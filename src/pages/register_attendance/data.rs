use derive_more::Display;

use crate::{
    errors::{insert_member_error::InsertMemberErr, signature_error::SignatureErr},
    AppState,
};

use actix_web::web;

use serde::Deserialize;
use std::time::{SystemTime, UNIX_EPOCH};

// Takes a name in the format "Last, First Second" and
// formats to "First Second Last"
// ["Last", "First Second"]
pub fn flip_names(name: &str) -> String {
    name.rsplit(", ").collect::<Vec<_>>().join(" ")
}

#[derive(Deserialize)]
pub struct AttendanceQuery {
    pub name: String,
    pub signature: String,
}

// Autoincrement session week and return current week
// if 6 days have passed since last set, increments ``session_week``
// and updates ``last_set``. Otherwise, change nothing.
pub fn increment_week(data: &web::Data<AppState>) -> u8 {
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

    let session_week_number;
    if days_elapsed >= 6 {
        session_week_number = week_data_mutex.week + 1;
        week_data_mutex.save_week(session_week_number);
    } else {
        session_week_number = week_data_mutex.week;
    }

    drop(week_data_mutex);
    session_week_number
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
