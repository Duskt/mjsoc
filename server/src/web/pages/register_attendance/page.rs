use crate::{
    auth::is_authenticated, data::{sqlite::members::{MemberMutation, MembersMutator}, structs::MemberId}, errors::{
        either_error::EitherError, insert_member_error::InsertMemberErr,
        signature_error::SignatureErr,
    }, util::get_redirect_response, AppState
};

use actix_session::Session;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use lib::signature::verify_signature;
use serde::Deserialize;
use urlencoding::encode;

use super::data::QrAttendanceQuery;

// This is the URL that a QR code links to, with the appropriate query.
// When sending a GET, it uses this path.
pub async fn register_qr_attendance(
    info: web::Query<QrAttendanceQuery>,
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
    Ok(HttpResponse::NotImplemented().body("To implement when QRs are used to access guest page."))
}

#[derive(Deserialize)]
pub struct RegisterMemberPostRequest {
    member_id: MemberId,
}

pub async fn manual_register_attendance(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<RegisterMemberPostRequest>,
    _req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // should do headers
        return HttpResponse::Unauthorized().finish();
    }
    match data.mahjong_data.mut_member(body.member_id, MemberMutation::Register(None)).await {
        Ok(r) => HttpResponse::Ok().json(r.unwrap()),
        Err(e) => e.handle()
    }
}
