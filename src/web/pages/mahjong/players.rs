use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use serde::Deserialize;
use urlencoding::encode;

use crate::{
    auth::is_authenticated,
    mahjong::{Member, MemberId},
    AppState,
};

#[derive(Deserialize)]
pub struct PlayerNamePostRequest {
    id: MemberId,
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
    let member_data = mjdata
        .members
        .iter_mut()
        .find(|x| x.id == body.id)
        .expect("Post request should have a valid member id.");
    member_data.name = body.new_name.clone();
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
    // defaults to 1 (0+1) as 0 represents an empty seat
    let id = mjdata.members.iter().map(|x| x.id).max().unwrap_or(0) + 1;
    let new_member = Member {
        id,
        name: body.name.clone(),
        points: 0,
    };
    mjdata.members.push(new_member.clone());
    mjdata.save_to_file();
    // no need to redirect as they already see the changes they've made
    HttpResponse::Created().json(new_member)
}
