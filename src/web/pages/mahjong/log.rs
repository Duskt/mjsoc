use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use maud::{html, PreEscaped};
use urlencoding::encode;

use crate::{auth::is_authenticated, components::page::page, mahjongdata::{Log, Member}, AppState};

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
