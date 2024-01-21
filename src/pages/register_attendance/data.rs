use actix_web::web;
use serde::Deserialize;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::AppState;

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
