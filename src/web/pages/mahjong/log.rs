use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use maud::{html, PreEscaped};
use serde::{Deserialize, Serialize};
use urlencoding::encode;

use crate::{
    auth::is_authenticated,
    components::page::page,
    mahjongdata::{get_points, Log, LogId, Member},
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

// a.k.a POST log, but for actual point transfer this endpoint (/members/transfer) must be used
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

    // calc points, defaulting to body.points (legacy) which frontend calculates
    let points = match get_points(body.faan, body.win_kind.clone()) {
        Some(calc_pts) => calc_pts,
        None => body.points,
    };
    // take the points from...
    let mut update_members: Vec<Member> = vec![];
    for id in body.from.iter() {
        for member in mjdata.members.iter_mut() {
            if member.id == *id {
                member.tournament.session_points -= points;
                update_members.push(member.clone());
            }
        }
    }
    // and give points*n to...
    let winner_points = ((points as isize) * (body.from.len() as isize)) as i32;
    if let Some(mem) = mjdata.members.iter_mut().find(|mem| mem.id == body.to) {
        mem.tournament.session_points += winner_points;
        update_members.push(mem.clone());
    }
    // log the PointTransfer request
    mjdata.log.push(body.to_owned());
    mjdata.save_to_file();
    // send back the affected members as confirmation
    HttpResponse::Ok().json(update_members)
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PutLogRequest {
    id: LogId,
    log: Option<Log>,
}

/* put_log handles either:
   - body.log = Some<Log>: Log editing (without point transfer)
   - body.log = None: Undo log (with point transfer)
*/
pub async fn put_log(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<PutLogRequest>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Unauthorized().finish();
    }
    if let Some(log) = &body.log {
        edit_log(data, body.id, log.clone())
    } else {
        undo_log(data, body.id)
    }
}

fn edit_log(data: web::Data<AppState>, log_id: LogId, new_log: Log) -> HttpResponse {
    let mut mahjongdata = data.mahjong_data.lock().unwrap();
    if let Some(old_log) = mahjongdata.log.iter_mut().find(|l| l.id == log_id) {
        *old_log = new_log;
        mahjongdata.save_to_file();
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::BadRequest().body("id not found")
    }
}

fn undo_log(data: web::Data<AppState>, log_id: LogId) -> HttpResponse {
    let mut changes = Vec::<Member>::new();
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let Some(log) = mjdata.log.iter_mut().find(|l| l.id == log_id) else {
        return HttpResponse::BadRequest().body("id not found");
    };
    if log.disabled {
        return HttpResponse::BadRequest().body("log already disabled");
    } else {
        log.disabled = true;
    }
    let log_copy = log.clone();
    // calc points, defaulting to body.points (legacy) which frontend calculates
    let points = match get_points(log_copy.faan, log_copy.win_kind.clone()) {
        Some(calc_pts) => calc_pts,
        None => log_copy.points,
    };
    let mut points_from_winner: i32 = 0;
    for loser_id in log_copy.from {
        if let Some(loser) = mjdata.members.iter_mut().find(|m| m.id == loser_id) {
            // give points back to each member in `log.from`
            loser.tournament.session_points += points;
            points_from_winner += points;
            changes.push(loser.clone());
        }
    }
    if let Some(winner) = mjdata.members.iter_mut().find(|m| m.id == log_copy.to) {
        winner.tournament.session_points -= points_from_winner;
        changes.push(winner.clone());
    }
    mjdata.save_to_file();
    HttpResponse::Ok().json(changes)
}
