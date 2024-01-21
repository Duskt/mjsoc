use derive_more::Display;

use crate::{
    auth::is_authenticated,
    errors::{insert_member_error::InsertMemberErr, signature_error::SignatureErr},
    google::sheets::insert_new_member,
    pages::register_attendance::data::{flip_names, increment_week},
    signature::verify_signature,
    util::get_redirect_response,
    AppState,
};

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse};
use urlencoding::encode;

use super::data::AttendanceQuery;

pub async fn register_attendance(
    info: web::Query<AttendanceQuery>,
    data: web::Data<AppState>,
    session: Session,
    req: HttpRequest,
) -> Result<HttpResponse, RegisterAttendanceError> {
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
        return Err(RegisterAttendanceError::from(SignatureErr));
    }

    println!("Recording attendance");

    // Flip before giving it to the sheets api
    let flipped_name = flip_names(&info.name);
    let session_week_number = increment_week(&data);

    insert_new_member(&flipped_name, session_week_number).await?;

    Ok(HttpResponse::Created().body(format!("{} has been added to the roster.", &info.name)))
}

#[derive(Debug, Display)]
pub enum RegisterAttendanceError {
    #[display(fmt = "{}", _0)]
    SignatureErr(SignatureErr),
    #[display(fmt = "{}", _0)]
    InsertMemberErr(InsertMemberErr),
}

impl actix_web::ResponseError for RegisterAttendanceError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match self {
            Self::SignatureErr(s) => s.status_code(),
            Self::InsertMemberErr(s) => s.status_code(),
        }
    }

    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        match self {
            Self::SignatureErr(s) => s.error_response(),
            Self::InsertMemberErr(s) => s.error_response(),
        }
    }
}

impl From<SignatureErr> for RegisterAttendanceError {
    fn from(value: SignatureErr) -> Self {
        RegisterAttendanceError::SignatureErr(value)
    }
}

impl From<InsertMemberErr> for RegisterAttendanceError {
    fn from(value: InsertMemberErr) -> Self {
        RegisterAttendanceError::InsertMemberErr(value)
    }
}
