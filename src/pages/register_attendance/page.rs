use crate::pages::register_attendance::data::{flip_names, increment_week};
use crate::{
    errors::insert_member_error::InsertMemberErr, google::sheets::insert_new_member,
    signature::verify_signature, util::get_redirect_response,
};
use actix_session::Session;
use actix_web::HttpRequest;
use actix_web::{web, HttpResponse, Responder};
use urlencoding::encode;

use crate::{auth::is_authenticated, AppState};

use super::data::AttendanceQuery;

pub async fn register_attendance(
    info: web::Query<AttendanceQuery>,
    data: web::Data<AppState>,
    session: Session,
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }

    if !verify_signature(&info.name, &info.signature, &data.hmac_key) {
        println!(
            "Failed to verify signature '{}' for '{}'",
            info.signature, info.name
        );
        return HttpResponse::UnprocessableEntity().body("Invalid signature");
    }

    println!("Recording attendance");

    // Flip before giving it to the sheets api
    let flipped_name = flip_names(&info.name);
    let session_week_number = increment_week(&data);
    match insert_new_member(&flipped_name, session_week_number).await {
        Ok(_) => {
            HttpResponse::Created().body(format!("{} has been added to the roster.", &info.name))
        }
        Err(InsertMemberErr::AlreadyInRoster) => {
            HttpResponse::Ok().body(format!("{} is already in the roster.", &info.name))
        }
        Err(InsertMemberErr::GoogleSheetsErr(e)) => HttpResponse::BadRequest().body(e.to_string()),
    }
}
