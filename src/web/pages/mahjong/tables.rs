use std::sync::MutexGuard;

use lib::env;

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use maud::html;
use serde::Deserialize;
use urlencoding::encode;

use crate::{
    auth::is_authenticated, components::page::page, mahjongdata::{MahjongData, TableData},
    util::get_redirect_response, AppState,
};

// display tables webpage
pub async fn get_tables(
    session: Session,
    data: web::Data<AppState>,
    req: HttpRequest,
) -> impl Responder {
    // clone and serialize the data to send to the client js code
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let public_path = env::expect_env("PUBLIC_PATH");
    let script_path = format!("{}/index.js", public_path);
    // webpage
    let html = page(html! {
        script src=(script_path) {}
        main {
        div id="sidebar" {}
        article id="tables" {
            // table and header-bar are both filled with js on frontend
            div id="header-bar" { h1 { "Tables" } }
            table id="table" {}
        }
        dialog id="add-member-dialog" {
            // as far as i can tell method="dialog" does nothing since i override onsubmit
            form method="dialog" action="/members" enctype="application/json" {
                label for="name" { "Name:" }
                input name="name" id="name" required {}
                button { "Submit" }
            }
        }
    }
    });
    HttpResponse::Ok().body(html.into_string())
}

pub async fn create_table(session: Session, data: web::Data<AppState>) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return get_redirect_response("/login?redirect=tables");
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let td = mjdata.create_table();
    HttpResponse::Created().json(td)
}

#[derive(Deserialize)]
pub struct TableDeleteRequest {
    table_no: u32,
}

fn decrement_tables(mut mjdata: MutexGuard<'_, MahjongData>, after_table_no: u32) -> MutexGuard<'_, MahjongData> {
    for i in &mut mjdata.tables {
        if i.table_no > after_table_no {
            i.table_no -= 1
        }
    }
    mjdata.save_to_file();
    mjdata
}

pub async fn delete_table(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<TableDeleteRequest>,
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        // (GET to this address is routed to /table)
        println!("{}, {}", &req.uri(), &req.uri().path_and_query().unwrap());
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    if let Some(index) = mjdata
        .tables
        .iter()
        .position(|x| x.table_no == body.table_no)
    {
        // tables are sorted by id, so their vector index matters not!
        mjdata.tables.swap_remove(index);
        drop(decrement_tables(mjdata, body.table_no));
        // redirect (instead we could use js to do this?)
        HttpResponse::Ok().body("Deleted table.")
    } else {
        HttpResponse::BadRequest().body(format!(
            "Could not find index with table number {}",
            body.table_no
        ))
    }
}

#[derive(Deserialize)]
pub struct EditTable {
    table_no: u32,
    table: TableData,
}

pub async fn update_table(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<Vec<EditTable>>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return get_redirect_response("/login?redirect=tables");
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let mut tables_copy = mjdata.tables.clone();
    for t in body.iter() {
        if let Some(table_index) = tables_copy
            .iter()
            .position(|x| x.table_no == t.table_no)
        {
            tables_copy[table_index] = t.table.clone();
        } else {
            return HttpResponse::BadRequest().body(format!(
                "Could not find index with table number {}",
                t.table_no
            ));
        }
    }
    mjdata.tables = tables_copy;
    mjdata.save_to_file();
    HttpResponse::Ok().body("Updated table(s) as desired.")
}
