use actix_session::Session;
use actix_web::{web, HttpResponse, Responder};

use crate::{auth::is_authenticated, AppState};

pub async fn get_data(
    session: Session,
    data: web::Data<AppState>,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Unauthorized().finish();
    }
    HttpResponse::Ok().json(data.mahjong_data.lock().unwrap().data.clone())
}