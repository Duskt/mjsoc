use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use maud::html;
use serde::Deserialize;

use crate::{
    auth::authenticate,
    components::page::page,
    data::{
        sqlite::tables::{TableMutation, TablesMutator},
        structs::TableData,
    },
    AppState,
};

// display tables webpage
pub async fn get_tables(
    session: Session,
    data: web::Data<AppState>,
    req: HttpRequest,
) -> impl Responder {
    if let Some(login_redir) = authenticate(&session, &data.authenticated_keys, req) {
        return login_redir;
    };
    // clone and serialize the data to send to the client js code
    // webpage
    let html = page(html! {
        script src=("public/index.js") {}
        div style="display: flex; flex-direction: row; flex-grow: 1; width: 100%;" {
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

pub async fn create_table(
    session: Session,
    data: web::Data<AppState>,
    req: HttpRequest,
) -> impl Responder {
    if let Some(login_redir) = authenticate(&session, &data.authenticated_keys, req) {
        return login_redir;
    };
    match data.mahjong_data.new_table(None).await {
        Ok(td) => HttpResponse::Created().json(td),
        Err(e) => e.handle(),
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
    if let Some(login_redir) = authenticate(&session, &data.authenticated_keys, req) {
        return login_redir;
    };
    // todo: validate table_no exists?
    match data.mahjong_data.del_table(body.table_no).await {
        Ok(_) => HttpResponse::Ok().body("Deleted table."),
        Err(e) => e.handle(),
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
    req: HttpRequest,
) -> impl Responder {
    if let Some(login_redir) = authenticate(&session, &data.authenticated_keys, req) {
        return login_redir;
    };
    for EditTable { table_no, table } in body.iter() {
        if data.mahjong_data.get_table(*table_no).await.is_err() {
            data.mahjong_data.new_table(Some(*table_no)).await.unwrap();
        }
        if let Err(e) = data
            .mahjong_data
            .mut_table(TableMutation::Replace {
                table_no: *table_no,
                new_table: table.clone(),
            })
            .await
        {
            return e.handle();
        };
    }
    HttpResponse::Ok().body("Updated table(s) as desired.")
}
