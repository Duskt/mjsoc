use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use serde::Deserialize;
use urlencoding::encode;

use crate::{
    auth::is_authenticated,
    mahjongdata::{Member, MemberId, TournamentData},
    AppState,
};

#[derive(Deserialize)]
pub struct UpdateMemberPutRequest {
    id: MemberId,
    new_name: String,
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
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let member_data = mjdata.members.iter_mut().find(|x| x.id == body.id);
    match member_data {
        None => HttpResponse::BadRequest().body("Player ID could not be found."),
        Some(member) => {
            member.name = body.new_name.clone();
            mjdata.save_to_file();
            HttpResponse::Ok().body("Edited player name")
        }
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
    let mut mjdata = data.mahjong_data.lock().unwrap();
    // defaults to 1 (0+1) as 0 represents an empty seat
    let id = mjdata.members.iter().map(|x| x.id).max().unwrap_or(0) + 1;
    let new_member = Member {
        id,
        name: body.name.clone(),
        tournament: TournamentData {
            total_points: 0,
            session_points: 0,
            registered: false,
        },
        council: false,
    };
    mjdata.members.push(new_member.clone());
    mjdata.save_to_file();
    // no need to redirect as they already see the changes they've made
    HttpResponse::Created().json(new_member)
}

#[derive(Deserialize)]
pub struct MemberDeleteRequest {
    name: String,
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
    let mut mjdata = data.mahjong_data.lock().unwrap();

    if let Some(index) = mjdata.members.iter().position(|x| x.name == body.name) {
        let member_id = mjdata.members[index].id;
        // remove references to the member
        for t in mjdata.tables.iter_mut() {
            // todo: surely a better way
            if t.east == member_id {
                t.east = 0
            }
            if t.south == member_id {
                t.south = 0
            }
            if t.west == member_id {
                t.west = 0
            }
            if t.north == member_id {
                t.north = 0
            }
        }
        // now remove the member from the members list
        mjdata.members.swap_remove(index);
        mjdata.save_to_file();
        HttpResponse::ResetContent().body("Deleted member")
    } else {
        HttpResponse::BadRequest().body(format!(
            "Could not find a member by the name of {}",
            body.name
        ))
    }
}