use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use serde::Deserialize;
use urlencoding::encode;

use crate::{auth::is_authenticated, mahjong::Member, AppState};

#[derive(Deserialize)]
pub struct PlayerNamePostRequest {
    table_no: u32,
    seat: String,
    new_name: String,
}

pub async fn post_player_name_edit(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<PlayerNamePostRequest>,
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        // (GET to this address is routed to /table)
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let tabledata = mjdata
        .tables
        .iter_mut()
        .find(|x| x.table_no == body.table_no)
        .expect("Post request should have a valid table number attached");
    match body.seat.as_str() {
        "north" => tabledata.north = body.new_name.clone(),
        "east" => tabledata.east = body.new_name.clone(),
        "south" => tabledata.south = body.new_name.clone(),
        "west" => tabledata.west = body.new_name.clone(),
        _ => panic!("invalid body seat"),
    };
    mjdata.save_to_file();
    // no need to redirect as they already see the changes they've made
    HttpResponse::Ok().body("Edited player name")
}

#[derive(Deserialize)]
pub struct NewMemberPostRequest {
    name: String,
}

pub async fn post_new_member(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<NewMemberPostRequest>,
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        // (GET to this address is routed to /table)
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let id = mjdata.members.iter().map(|x| x.id).max().unwrap_or(0) + 1;
    mjdata.members.push(Member {
        id,
        name: body.name.clone(),
        points: 0,
    });
    mjdata.save_to_file();
    // no need to redirect as they already see the changes they've made
    HttpResponse::Created().body(format!("Inserted new member with id {id}"))
}
