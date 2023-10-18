mod auth;
mod errors;
mod google;
mod http_client;
mod qr;
mod signature;

use crate::{
    auth::{is_authenticated, RedirectURL},
    google::sheets::insert_new_member,
    signature::verify_signature,
};
use actix_files as fs;
use actix_session::{storage::CookieSessionStore, Session, SessionMiddleware};
use actix_web::{
    cookie, get, http::header::LOCATION, web, App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use auth::authenticate;
use circular_buffer::CircularBuffer;
use dotenv::dotenv;
use errors::insert_member_error::InsertMemberErr;
use maud::{html, PreEscaped, DOCTYPE};
use qr::{download_qr, generate_qr};
use serde::Deserialize;
use std::{
    env,
    fs::File,
    io::{BufReader, Read},
    sync::RwLock,
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

    match insert_new_member(&info.name).await {
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

#[derive(Debug)]
pub struct AppState {
    // Circular buffer allows us to have a fixed capacity and remove oldest
    // key when inserting a new one - this is to prevent using up too much memory
    authenticated_keys: RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
    admin_password: String,
    hmac_key: Vec<u8>,
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
    let admin_password =
        env::var("ADMIN_PASSWORD").expect("No admin password provided in environment");

    let hmac_key_file = env::var("HMAC_KEY_FILE").expect("No hmac file provided");
    let hmac_key = get_file_bytes(&hmac_key_file);

    let state = web::Data::new(AppState {
        authenticated_keys: RwLock::new(CircularBuffer::new()),
        admin_password,
        hmac_key,
    });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
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
            .service(fs::Files::new("/", "public"))
    })
    .bind((IP, PORT))?
    .run()
    .await
}
