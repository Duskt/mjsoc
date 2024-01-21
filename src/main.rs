mod auth;
mod components;
mod errors;
mod google;
mod notification;
mod pages;
mod rate_limit;
mod signature;
mod util;
mod week_data;

use actix_files as fs;
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_web::{
    cookie,
    web::{self, get, post},
    App, HttpServer,
};

use chrono::Duration;
use circular_buffer::CircularBuffer;
use dotenv::dotenv;
use std::{
    env,
    sync::{Arc, Mutex, RwLock},
};

use pages::{
    auth::authenticate,
    index::index,
    login::login,
    logo::logo,
    qr::page::{download_qr, generate_qr},
    register_attendance::page::register_attendance,
    session_week::{change_week, get_week},
};
use rate_limit::{quota::Quota, rate_limit_handler::RateLimit};
use util::get_file_bytes;
use week_data::WeekData;

// TODO: Use .env?
const IP: &str = "0.0.0.0";
const PORT: u16 = 5654;

const QR_SIZE: usize = 256;

pub const MAX_AUTHENTICATED_USERS: usize = 64;

pub struct AppState {
    // Circular buffer allows us to have a fixed capacity and remove oldest
    // key when inserting a new one - this is to prevent using up too much memory
    authenticated_keys: RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
    admin_password_hash: String,
    hmac_key: Vec<u8>,
    session_week: Mutex<WeekData>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let key = cookie::Key::generate();
    let state = web::Data::new(get_intial_state());
    let quotas_mtx = Arc::new(RwLock::new(get_quota()));

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(RateLimit::new(quotas_mtx.clone()))
            .wrap(SessionMiddleware::new(
                CookieSessionStore::default(),
                key.clone(),
            ))
            .route("/qr", get().to(generate_qr))
            .route("/download", get().to(download_qr))
            .route("/", get().to(index))
            .route("/week", get().to(get_week))
            .route("/week", post().to(change_week))
            .route("/login", get().to(login))
            .route("/auth", post().to(authenticate))
            .route("/register_attendance", get().to(register_attendance))
            .route("/assets/logo.jpg", get().to(logo))
            //.service(fs::Files::new("/assets", "./data/assets"))
            // If the mount path is set as the root path /, services registered after this one will be inaccessible. Register more specific handlers and services first.
            .service(fs::Files::new("/", "public"))
    })
    .bind((IP, PORT))?
    .run()
    .await
}

fn get_intial_state() -> AppState {
    let admin_password_hash =
        env::var("ADMIN_PASSWORD_HASH").expect("No admin password hash provided in environment");

    let hmac_key_file = env::var("HMAC_KEY_FILE").expect("No hmac file provided");
    let hmac_key = get_file_bytes(&hmac_key_file);

    let week_file = env::var("WEEK_FILE").unwrap();

    AppState {
        authenticated_keys: RwLock::new(CircularBuffer::new()),
        admin_password_hash,
        hmac_key,
        session_week: Mutex::new(WeekData::from_file(&week_file)),
    }
}

fn get_quota() -> Quota {
    // If quota is less than burst_size, replenish 1 every period
    let burst_size = env::var("RATE_LIMIT_BURST_SIZE")
        .expect("No burst size provided")
        .parse()
        .unwrap();

    let period = Duration::seconds(
        env::var("RATE_LIMIT_PERIOD_SECONDS")
            .expect("No period provided")
            .parse()
            .expect("Invalid period"),
    );

    Quota::new(burst_size, period)
}
