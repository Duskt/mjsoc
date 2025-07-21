use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use maud::html;
use serde::Deserialize;
use urlencoding::encode;
use lib::env;
use crate::{
    auth::is_authenticated, components::page::page, util::get_redirect_response, AppState,
};

#[derive(Deserialize)]
pub struct WeekForm {
    week: String,
}

pub async fn get_week(data: web::Data<AppState>) -> impl Responder {
    println!("Week requested");

    let mj = data.mahjong_data.lock().unwrap();
    let html = page(html! {
        img src=(env::expect_env("LOGO_ROUTE")) class="logo";
        p {
            "Enter week number:"
        }
        form action="/week" method="POST" {
            input name="week" id="week" value=(format!("{}", mj.data.week.get())) autofocus {}
        }
    });
    HttpResponse::Ok().body(html.into_string())
}

pub async fn change_week(
    session: Session,
    data: web::Data<AppState>,
    body: web::Form<WeekForm>,
    req: HttpRequest,
) -> impl Responder {
    println!("Change week running");
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }

    let week = body.week.parse().expect("Input not int");
    println!("Changing week to {}", week);

    // Set week
    let mut mj = data.mahjong_data.lock().unwrap();
    mj.data.week.set(week);
    mj.save();
    HttpResponse::NoContent().finish()
}

pub async fn reset_session(
    session: Session,
    data: web::Data<AppState>,
    _body: web::Json<()>, // js 'null'
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let mut mj = data.mahjong_data.lock().unwrap();
    mj.data.members.iter_mut().for_each(|m| {
        m.tournament.registered = false;
        m.tournament.total_points += m.tournament.session_points;
        m.tournament.session_points = 0;
    });
    mj.save();
    HttpResponse::Ok().body("Success")
}
