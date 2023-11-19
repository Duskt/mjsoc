mod auth;
mod components;
mod errors;
mod google;
mod http_client;
mod qr;
mod quota;
mod rate_limit_handler;
mod session_week;
mod signature;

use crate::{
    auth::{is_authenticated, RedirectURL},
    google::sheets::{flip_names, insert_new_member},
    session_week::{change_week, get_week},
    signature::verify_signature,
};
use actix_files as fs;
use actix_session::{storage::CookieSessionStore, Session, SessionMiddleware};
use actix_web::{
    cookie, get, http::header::LOCATION, web, App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use auth::authenticate;
use chrono::Duration;
use circular_buffer::CircularBuffer;
use dotenv::dotenv;
use errors::insert_member_error::InsertMemberErr;
use fs::NamedFile;
use maud::{html, PreEscaped, DOCTYPE};
use qr::{download_qr, generate_qr};
use quota::Quota;
use rate_limit_handler::RateLimit;
use serde::{Deserialize, Serialize};
use std::{
    env,
    fs::File,
    io::{BufReader, Read, Write},
    sync::{Arc, Mutex, RwLock},
    time::{SystemTime, UNIX_EPOCH},
};
use urlencoding::encode;

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

#[get("/register_attendance")]
async fn register_attendance(
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
        return HttpResponse::UnprocessableEntity().body("Invalid signature");
    }

    // Autoincrement session week.
    // if 6 days have passed since last set, increments ``session_week``
    // and updates ``last_set``. Otherwise, change nothing.
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

    // flip before giving it to the sheets api
    let flipped_name = flip_names(&info.name);
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

#[get("/login")]
async fn login(
    session: Session,
    data: web::Data<AppState>,
    info: web::Query<RedirectURL>,
) -> impl Responder {
    if is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Ok().body("already authenticated");
    }

    let redirect = info.redirect.clone().unwrap_or("/".to_string());
    let redirect_encoded = encode(&redirect);
    let html = page(html! {
        p { "Enter admin password to accept member attendance:"}
        form action=(format!("/auth?redirect={redirect_encoded}")) method="POST" {
            input name="password" id="password" type="password" autofocus {}
        }
    });

    HttpResponse::Ok().body(html.into_string())
}

#[get("/assets/logo.jpg")]
async fn logo() -> Result<NamedFile, std::io::Error> {
    match env::var("LOGO_FILE") {
        Ok(path) => NamedFile::open(path),
        Err(_) => {
            println!("No env LOGO_FILE found, using default '/public/assets/logo.jpg'");
            NamedFile::open("/public/assets/logo.jpg")
        }
    }
}

#[get("/")]
async fn index() -> impl Responder {
    let html = page(html! {
        img src="/assets/logo.jpg" class="logo";
        p {
            "Only the Mahjong society committee should need to use this."
            br; br;
            "Contact a developer for help."
        }
    });

    HttpResponse::Ok().body(html.into_string())
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekData {
    week: u8,
    last_set_unix_seconds: u64,
}

impl WeekData {
    pub fn from_file(path: &str) -> Self {
        match File::open(path) {
            Ok(f) => {
                let reader = BufReader::new(f);
                serde_json::from_reader(reader).expect("Failed to read week file format")
            }
            Err(_) => {
                let week_data = Self {
                    week: 1,
                    last_set_unix_seconds: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                };

                week_data.save_to_file();
                week_data
            }
        }
    }

    pub fn save_week(&mut self, week: u8) {
        self.last_set_unix_seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.week = week;
        self.save_to_file();
    }

    fn save_to_file(&self) {
        let mut file = File::create(env::var("WEEK_FILE").unwrap()).unwrap();
        file.write_all(serde_json::to_string(&self).unwrap().as_bytes())
            .unwrap();
    }
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
    // If less than burst_size, replenish 1 every period
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
