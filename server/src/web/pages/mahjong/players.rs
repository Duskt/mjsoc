use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use serde::Deserialize;
use urlencoding::encode;

use crate::{
    auth::is_authenticated,
    data::{sqlite::MembersMutator, structs::{Member, MemberId}},
    AppState,
};

#[derive(Deserialize)]
pub struct UpdateMemberPutRequest {
    id: MemberId,
    new_member: Member,
}

pub async fn update_member(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<UpdateMemberPutRequest>,
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
    match data.mahjong_data.mut_member(body.id, body.new_member.clone()).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().body("TODO")
    }
}

#[derive(Deserialize)]
pub struct CreateMemberPostRequest {
    name: String,
}

pub async fn create_member(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<CreateMemberPostRequest>,
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
    match data.mahjong_data.new_member(body.name.clone()).await {
        // TODO:
        Ok(m) => HttpResponse::Created().json(m),
        Err(_) => HttpResponse::InternalServerError().body("TODO")
    }
}

#[derive(Deserialize)]
pub struct MemberDeleteRequest {
    id: MemberId,
}

pub async fn delete_member(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<MemberDeleteRequest>,
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

    match data.mahjong_data.del_member(body.id).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().body("TODO")
    }
}
