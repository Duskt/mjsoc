use actix_session::Session;
use actix_web::{web, HttpResponse, Responder};
use maud::html;
use urlencoding::encode;

use crate::{auth::is_authenticated, components::page::page, pages::auth::RedirectURL, AppState};

pub async fn login(
    session: Session,
    data: web::Data<AppState>,
    info: web::Query<RedirectURL>,
) -> impl Responder {
    if is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Ok().body("already authenticated");
    }

    let redirect = info.redirect.clone().unwrap_or("/".to_string());
    let redirect_encoded = encode(&redirect);
    let html = page(html! {
        p { "Enter admin password to accept member attendance:"}
        form action=(format!("/auth?redirect={redirect_encoded}")) method="POST" {
            input name="password" id="password" type="password" autofocus {}
        }
    });

    HttpResponse::Ok().body(html.into_string())
}
