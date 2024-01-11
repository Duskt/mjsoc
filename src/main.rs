mod auth;
mod components;
mod errors;
mod google;
mod pages;
mod quota;
mod rate_limit_handler;
mod signature;
mod week_data;

use actix_files as fs;
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_web::{cookie, http::header::LOCATION, web, App, HttpRequest, HttpResponse, HttpServer};
use chrono::Duration;
use circular_buffer::CircularBuffer;
use dotenv::dotenv;
use maud::{html, PreEscaped, DOCTYPE};
use pages::{
    auth::authenticate,
    index::index,
    login::login,
    logo::logo,
    qr::page::{download_qr, generate_qr},
    register_attendance::register_attendance,
    session_week::{change_week, get_week},
};
use quota::Quota;
use rate_limit_handler::RateLimit;
use serde::Deserialize;
use signature::verify_signature;
use std::{
    env,
    fs::File,
    io::{BufReader, Read},
    sync::{Arc, Mutex, RwLock},
};
use week_data::WeekData;

// TODO: Use .env?
const IP: &str = "0.0.0.0";
const PORT: u16 = 5654;

const QR_SIZE: usize = 256;

pub const MAX_AUTHENTICATED_USERS: usize = 64;

fn page(inner: PreEscaped<String>) -> PreEscaped<String> {
    html! {
        (DOCTYPE)
        html {
            head {
                title { "Mahjong Bath" }
                link rel="stylesheet" href="styles.css";
            }
            body {
                div class="centre-container" {
                    (inner)
                }
            }
        }
    }
}

fn get_base_url(req: &HttpRequest) -> String {
    let conn_info = req.connection_info();
    let scheme = conn_info.scheme();
    let host = conn_info.host();

    format!("{scheme}://{host}")
}

fn get_redirect_response(url: &str) -> HttpResponse {
    return HttpResponse::Found()
        .append_header((LOCATION, url))
        .finish();
}

#[derive(Deserialize)]
pub struct AttendanceQuery {
    name: String,
    signature: String,
}

pub struct AppState {
    // Circular buffer allows us to have a fixed capacity and remove oldest
    // key when inserting a new one - this is to prevent using up too much memory
    authenticated_keys: RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
    admin_password_hash: String,
    hmac_key: Vec<u8>,
    session_week: Mutex<WeekData>,
}

fn get_file_bytes(path: &str) -> Vec<u8> {
    let f = File::open(path).expect("Failed to find file");
    let mut reader = BufReader::new(f);
    let mut buffer = Vec::new();

    // Read file into vector.
    reader
        .read_to_end(&mut buffer)
        .expect("Failed to read file");

    buffer
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let key = cookie::Key::generate();
    let admin_password_hash =
        env::var("ADMIN_PASSWORD_HASH").expect("No admin password hash provided in environment");

    let hmac_key_file = env::var("HMAC_KEY_FILE").expect("No hmac file provided");
    let hmac_key = get_file_bytes(&hmac_key_file);

    let week_file = env::var("WEEK_FILE").unwrap();

    let state = web::Data::new(AppState {
        authenticated_keys: RwLock::new(CircularBuffer::new()),
        admin_password_hash,
        hmac_key,
        session_week: Mutex::new(WeekData::from_file(&week_file)),
    });

    // Max request quota is burst_size
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
    let quotas_mtx = Arc::new(RwLock::new(Quota::new(burst_size, period)));

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(RateLimit::new(quotas_mtx.clone()))
            .wrap(SessionMiddleware::new(
                CookieSessionStore::default(),
                key.clone(),
            ))
            .service(generate_qr)
            .service(download_qr)
            .service(register_attendance)
            .service(login)
            .service(authenticate)
            .service(index)
            .service(get_week)
            .service(change_week)
            .service(logo)
            //.service(fs::Files::new("/assets", "./data/assets"))
            // If the mount path is set as the root path /, services registered after this one will be inaccessible. Register more specific handlers and services first.
            .service(fs::Files::new("/", "public"))
    })
    .bind((IP, PORT))?
    .run()
    .await
}
