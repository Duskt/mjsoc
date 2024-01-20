use crate::{
    errors::insert_member_error::InsertMemberErr, google::sheets::insert_new_member,
    signature::verify_signature, util::get_redirect_response,
};
use actix_session::Session;
use actix_web::HttpRequest;
use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use std::time::{SystemTime, UNIX_EPOCH};
use urlencoding::encode;

use crate::{auth::is_authenticated, AppState};

// Takes a name in the format "Last, First Second" and
// formats to "First Second Last"
// ["Last", "First Second"]
pub fn flip_names(name: &str) -> String {
    name.rsplit(", ").collect::<Vec<_>>().join(" ")
}

#[derive(Deserialize)]
pub struct AttendanceQuery {
    name: String,
    signature: String,
}

// Autoincrement session week and return current week
// if 6 days have passed since last set, increments ``session_week``
// and updates ``last_set``. Otherwise, change nothing.
fn increment_week(data: &web::Data<AppState>) -> u8 {
    let session_week_number;
    {
        let mut week_data_mutex = data.session_week.lock().unwrap();

        let now_seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // diff in secs / 60 -> mins / 60 -> hours / 24 -> days
        let days_elapsed = (now_seconds - week_data_mutex.last_set_unix_seconds) / 60 / 60 / 24;

        println!(
            "Last increment: {}, current time {}, difference in days: {}",
            week_data_mutex.last_set_unix_seconds, now_seconds, days_elapsed
        );

        if days_elapsed >= 6 {
            session_week_number = week_data_mutex.week + 1;
            week_data_mutex.save_week(session_week_number);
        } else {
            session_week_number = week_data_mutex.week;
        }
    }

    session_week_number
}

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

    // flip before giving it to the sheets api
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
