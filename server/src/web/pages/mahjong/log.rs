use lib::env;

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use maud::html;
use serde::{Deserialize, Serialize};
use urlencoding::encode;

use crate::{
    auth::is_authenticated,
    components::page::page,
    data::{
        sqlite::{LogMutation, LogMutator, MemberMutation, MembersMutator},
        structs::{Log, LogId, MemberId}
    },
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
    let public_path = env::expect_env("PUBLIC_PATH");
    let script_path = format!("{}/index.js", public_path);
    // webpage
    let html = page(html! {
        script src=(script_path) {}
        main {
            table id="log-table" {}
        }
    });
    HttpResponse::Ok().body(html.into_string())
}

// similar to POST log, but for actual point transfer this endpoint (/members/transfer) must be used
pub async fn transfer_points(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<Log>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // todo: should include WW-Authentication header...
        return HttpResponse::Unauthorized().finish();
    }

    if body.disabled {
        return HttpResponse::BadRequest().body("Points cannot be transferred for a disabled log - you should simply POST the log instead.");
    }

    // calc points, defaulting to frontend-calculated body.points (legacy)
    let opt_points = if let Some(faan) = body.faan.clone() {
        faan.get_points(body.win_kind.clone())
    } else {
        Some(body.points)
    };
    let Some(points) = opt_points else {
        return HttpResponse::BadRequest().body("Wrong faan");
    };

    let log = body.clone();
    if let Err(e) = data
        .mahjong_data
        .record_log(log)
        .await
    {
        return e.handle();
    }

    for l in body.from.clone() {
        if let Err(e) = data
            .mahjong_data
            .mut_member(l, MemberMutation::AddPoints(-points))
            .await
        {
            return e.handle();
        }
        if let Err(e) = data
            .mahjong_data
            .mut_member(body.to, MemberMutation::AddPoints(points))
            .await
        {
            return e.handle();
        };
    }
    match data
        .mahjong_data
        .get_members(Some([body.from.clone(), [body.to].to_vec()].concat()))
        .await
    {
        Ok(r) => HttpResponse::Ok().json(r),
        Err(e) => 
            e.handle()
        
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PutLogRequest {
    id: LogId,
    log: Option<Log>,
}

pub async fn put_log(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<PutLogRequest>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Unauthorized().finish();
    };
    if body.log.is_some() {
        return HttpResponse::NotImplemented().body("Omit log (provide only id) for undo log.");
    };
    let log = match data.mahjong_data.get_log(body.id).await {
        Ok(r) => r,
        Err(e) => return e.handle()
    };
    let mut affected_members: Vec<MemberId> = Vec::new();
    // if log was enabled (i.e. undoing it), pay back the points; otherwise redo
    let payback = if !log.disabled { log.points } else { -log.points };
    for mid in log.from {
        if let Err(e) = data
            .mahjong_data
            .mut_member(mid, MemberMutation::AddPoints(payback))
            .await
        {
            return e.handle()
        }
        affected_members.push(mid);
    }
    if let Err(e) = data
        .mahjong_data
        .mut_member(log.to, MemberMutation::AddPoints(-payback))
        .await
    {
        return e.handle()
    }
    affected_members.push(log.to);
    if let Err(e) = data.mahjong_data.mut_log(LogMutation::ToggleDisabled { log_id: body.id, new_value: Some(!log.disabled) }).await {
        return e.handle()
    }
    let affected_members = match data.mahjong_data.get_members(Some(affected_members)).await {
        Ok(r) => r,
        Err(e) => return e.handle(),
    };
    HttpResponse::Ok().json(affected_members)
}

/* put_log handles either:
   - body.log = Some<Log>: Log editing (without point transfer)
   - body.log = None: Undo log (with point transfer)
*/
/*
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
    let mut mj = data.mahjong_data.lock().unwrap();
    if let Some(old_log) = mj.data.log.iter_mut().find(|l| l.id == log_id) {
        *old_log = new_log;
        mj.save();
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::BadRequest().body("id not found")
    }
}

fn undo_log(data: web::Data<AppState>, log_id: LogId) -> HttpResponse {
    let mut changes = Vec::<Member>::new();
    let mut mj = data.mahjong_data.lock().unwrap();
    let Some(log) = mj.data.log.iter_mut().find(|l| l.id == log_id) else {
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
        if let Some(loser) = mj.data.members.iter_mut().find(|m| m.id == loser_id) {
            // give points back to each member in `log.from`
            loser.tournament.session_points += points;
            points_from_winner += points;
            changes.push(loser.clone());
        }
    }
    if let Some(winner) = mj.data.members.iter_mut().find(|m| m.id == log_copy.to) {
        winner.tournament.session_points -= points_from_winner;
        changes.push(winner.clone());
    }
    mj.save();
    HttpResponse::Ok().json(changes)
}
*/
