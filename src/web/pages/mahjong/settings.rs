use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use serde::Deserialize;
use urlencoding::encode;

use crate::{auth::is_authenticated, util::get_redirect_response, AppState};

#[derive(Deserialize)]
pub struct SettingsPutRequest {
    #[serde(rename(deserialize="matchmakingCoefficient", serialize="matchmakingCoefficient"))]
    matchmaking_coefficient: Option<f32>,
}

pub async fn update_settings(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<SettingsPutRequest>,
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    // needs a macro rly
    if let Some(mcoeff) = body.matchmaking_coefficient {
        mjdata.settings.matchmaking_coefficient = mcoeff;
    } else {
        return HttpResponse::BadRequest().body("Couldn't find mcoeff?");
    }
    mjdata.save_to_file();
    HttpResponse::Ok().body("Updated settings.")
}
