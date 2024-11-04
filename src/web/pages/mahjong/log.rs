use std::sync::MutexGuard;

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use maud::{html, PreEscaped};
use serde::{Deserialize, Serialize};
use urlencoding::encode;

use crate::{
    auth::is_authenticated,
    components::page::page,
    mahjongdata::{Log, LogId, MahjongData, Member},
    AppState,
};

// display log webpage
pub async fn get_log_page(
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
            table id="log-table" {}
        }
    });
    HttpResponse::Ok().body(html.into_string())
}

pub async fn transfer_points(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<Log>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // todo: should include WW-Authentication header...
        return HttpResponse::Unauthorized().finish();
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    if mjdata.log.iter().any(|l| l.id == body.id) {
        return HttpResponse::BadRequest().body("id already exists");
    }

    // take the points from...
    let mut update_members: Vec<Member> = vec![];
    for id in body.from.iter() {
        for member in mjdata.members.iter_mut() {
            if member.id == *id {
                member.tournament.session_points -= body.points;
                update_members.push(member.clone());
            }
        }
    }
    // and give points*n to...
    let points = ((body.points as isize) * (body.from.len() as isize)) as i32;
    if let Some(mem) = mjdata.members.iter_mut().find(|mem| mem.id == body.to) {
        mem.tournament.session_points += points;
        update_members.push(mem.clone());
    }
    // log the PointTransfer request
    mjdata.log.push(body.to_owned());
    mjdata.save_to_file();
    // send back the affected members as confirmation
    HttpResponse::Ok().json(update_members)
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EditLogRequest {
    id: LogId,
    log: Log,
}

pub async fn edit_log(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<EditLogRequest>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Unauthorized().finish();
    }
    let mut mahjongdata = data.mahjong_data.lock().unwrap();
    let undone;
    if let Some(old_log) = mahjongdata.log.iter_mut().find(|l| l.id == body.log.id) {
        // if the log has now been disabled
        undone = (!old_log.disabled) && body.log.disabled;
        *old_log = body.log.clone();
    } else {
        return HttpResponse::BadRequest().body("Couldn't find that id");
    };
    if undone {
        // undo_log saves for us; todo: move fn to mjdata and save at end here
        HttpResponse::Ok().json(undo_log(body.log.clone(), &mut mahjongdata))
    } else {
        mahjongdata.save_to_file();
        HttpResponse::Ok().json(Vec::<Member>::new())
    }
}

fn undo_log(log: Log, mjdata: &mut MutexGuard<'_, MahjongData>) -> Vec<Member> {
    let mut changes = Vec::<Member>::new();
    let mut points_from_winner: i32 = 0;
    for loser_id in log.from {
        if let Some(loser) = mjdata.members.iter_mut().find(|m| m.id == loser_id) {
            loser.tournament.session_points += log.points;
            points_from_winner += log.points;
            changes.push(loser.clone());
        }
    }
    if let Some(winner) = mjdata.members.iter_mut().find(|m| m.id == log.to) {
        winner.tournament.session_points -= points_from_winner;
        changes.push(winner.clone());
    }
    mjdata.save_to_file();
    changes
}
