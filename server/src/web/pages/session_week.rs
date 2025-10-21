use crate::{
    auth::is_authenticated,
    components::page::page,
    data::{
        errors::MahjongDataError,
        sqlite::members::{MemberMutation, MembersMutator},
    },
    AppState,
};
use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use futures_util::{future::join_all, stream::FuturesUnordered, StreamExt};
use lib::util::get_redirect_response;
use maud::html;
use serde::Deserialize;
use urlencoding::encode;

#[derive(Deserialize)]
pub struct WeekForm {
    week: String,
}
/*
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
*/
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
    let futures = FuturesUnordered::new();
    data.mahjong_data
        .get_members(None)
        .await
        .expect("get members err")
        .into_iter()
        // this could be much faster if i knew how to do async in rust
        .for_each(|member: crate::data::structs::Member| {
            if (!member.tournament.registered) && member.tournament.session_points == 0 {
                return;
            }
            let mut m = member.clone();
            m.tournament.registered = false;
            m.tournament.total_points += m.tournament.session_points;
            m.tournament.session_points = 0;
            futures.push(data.mahjong_data.mut_member(m.id, MemberMutation::All(m)))
        });
    futures
        .collect::<Vec<Result<Option<bool>, MahjongDataError>>>()
        .await;
    HttpResponse::Ok().body("Success")
}
