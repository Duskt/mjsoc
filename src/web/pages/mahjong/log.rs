use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::util::get_redirect_response;
use maud::{html, PreEscaped};
use urlencoding::encode;

use crate::{auth::is_authenticated, components::page::page, AppState};

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
