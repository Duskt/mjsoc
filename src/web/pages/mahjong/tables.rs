use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use maud::{html, PreEscaped};
use serde::Deserialize;
use serde_json;
use urlencoding::encode;

use crate::{
    auth::is_authenticated, components::page::page, mahjong::TableData,
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
    let mjdata_copy = data.mahjong_data.lock().unwrap().clone();
    let cereal = serde_json::to_string(&mjdata_copy).expect("Serialization failed for mjdata");
    // webpage
    let html = page(html! {
        script {
            "window.MJDATA = "(PreEscaped(cereal))";"
        }
        script src="/index.js" {}
        main {
        div class="sidebar" {
            div {
                button id="add-member" class="member-button" { "Add a new member" }
            }
            button { ">" }
        }
        article {
            h1 { "Tables" }
            table id="table" {}
        }
        dialog {
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
        mjdata.tables.swap_remove(index);
        mjdata.save_to_file();
        // redirect (instead we could use js to do this?)
        HttpResponse::ResetContent().body("Deleted table")
    } else {
        HttpResponse::BadRequest().body(format!(
            "Could not find index with table number {}",
            body.table_no
        ))
    }
}

#[derive(Deserialize)]
pub struct UpdateTablePostRequest {
    table_no: u32,
    table: TableData,
}

pub async fn update_table(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<UpdateTablePostRequest>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return get_redirect_response("/login?redirect=tables");
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    if let Some(table_index) = mjdata
        .tables
        .iter()
        .position(|x| x.table_no == body.table_no)
    {
        mjdata.tables[table_index] = body.table.clone();
        mjdata.save_to_file();
        HttpResponse::Ok().body("Updated table as desired.")
    } else {
        HttpResponse::BadRequest().body(format!(
            "Could not find index with table number {}",
            body.table_no
        ))
    }
}
