use crate::{
    auth::is_authenticated,
    errors::{
        either_error::EitherError, insert_member_error::InsertMemberErr,
        signature_error::SignatureErr,
    },
    google::sheets::insert_new_member,
    mahjongdata::MemberId,
    pages::register_attendance::data::flip_names,
    util::get_redirect_response,
    AppState,
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

    println!("Recording attendance");

    // Flip before giving it to the sheets api
    let flipped_name = flip_names(&info.name);
    let session_week_number = data.mahjong_data.lock().unwrap().week.increment();

    insert_new_member(&flipped_name, session_week_number)
        .await
        .map_err(EitherError::from_right)?;

    Ok(HttpResponse::Created().body(format!("{} has been added to the roster.", &info.name)))
}

#[derive(Deserialize)]
pub struct RegisterMemberPostRequest {
    member_id: MemberId,
}

pub async fn manual_register_attendance(
    session: Session,
    data: web::Data<AppState>,
    body: web::Json<RegisterMemberPostRequest>,
    req: HttpRequest,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        // (GET to this address is routed to /table)
        return get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        ));
    }
    let mut mjdata = data.mahjong_data.lock().unwrap();
    let present: bool;
    {
        let member = mjdata
            .members
            .iter_mut()
            .find(|m| m.id == body.member_id)
            .expect("No member with that id");
        present = !member.tournament.registered;
        member.tournament.registered = present;
    }
    mjdata.save_to_file();
    HttpResponse::Ok().json(present)
}
