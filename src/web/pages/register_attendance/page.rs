use crate::{
    auth::is_authenticated,
    errors::{
        either_error::EitherError, insert_member_error::InsertMemberErr,
        signature_error::SignatureErr,
    },
    google::sheets::insert_new_member,
    pages::register_attendance::data::{flip_names, increment_week},
    util::get_redirect_response,
    AppState,
};

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse};
use lib::signature::verify_signature;
use urlencoding::encode;

use super::data::AttendanceQuery;

pub async fn register_attendance(
    info: web::Query<AttendanceQuery>,
    data: web::Data<AppState>,
    session: Session,
    req: HttpRequest,
) -> Result<HttpResponse, EitherError<SignatureErr, InsertMemberErr>> {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }

    if !verify_signature(&info.name, &info.signature, &data.hmac_key) {
        println!(
            "Failed to verify signature '{}' for '{}'",
            info.signature, info.name
        );
        return Err(EitherError::from_left(SignatureErr));
    }

    println!("Recording attendance");

    // Flip before giving it to the sheets api
    let flipped_name = flip_names(&info.name);
    let session_week_number = increment_week(&data);

    insert_new_member(&flipped_name, session_week_number)
        .await
        .map_err(EitherError::from_right)?;

    Ok(HttpResponse::Created().body(format!("{} has been added to the roster.", &info.name)))
}
