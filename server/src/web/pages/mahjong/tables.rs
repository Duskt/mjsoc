use lib::env;

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use maud::html;
use serde::Deserialize;
use urlencoding::encode;

use crate::{
    auth::is_authenticated, components::page::page, data::{sqlite::TablesMutator, structs::TableData},
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
        article id="tables" style="margin-top: 20px" {
            // table and header-bar are both filled with js on frontend
            div id="header-bar" { h1 { "Tables" } }
            table id="table" {}
        }
    }
    });
    HttpResponse::Ok().body(html.into_string())
}

pub async fn create_table(session: Session, data: web::Data<AppState>) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return get_redirect_response("/login?redirect=tables");
    }
    match data.mahjong_data.new_table().await {
        Ok(td) => HttpResponse::Created().json(td),
        Err(_) => HttpResponse::InternalServerError().body("Unknown database error occurred."),
    }
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
    // todo: validate table_no exists?
    match data.mahjong_data.del_table(body.table_no).await {
        Ok(_) => HttpResponse::Ok().body("Deleted table."),
        Err(e) => {
            println!("{e}");
            HttpResponse::InternalServerError().body("Unknown database error occurred.")
        }
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
    for EditTable { table_no, table } in body.iter() {
        match data.mahjong_data.mut_table(*table_no, table.clone()).await {
            Ok(_) => continue,
            Err(e) => {
                println!("{e}");
                return HttpResponse::InternalServerError()
                    .body("Unknown database error occurred. Some updates may have been made.");
            }
        };
    }
    HttpResponse::Ok().body("Updated table(s) as desired.")
}
