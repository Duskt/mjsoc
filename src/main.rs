mod auth;
mod errors;
mod http_client;
mod sheets;

use crate::auth::is_authenticated;
use crate::auth::new_session;
use actix_web::{http::header::LOCATION, post, HttpRequest};
use circular_buffer::CircularBuffer;
use dotenv::dotenv;
use errors::name_empty::NameEmptyErr;
use errors::name_too_long::NameTooLongErr;
use std::error::Error;
use std::{env, sync::RwLock};
use urlencoding::encode;

use actix_files as fs;
use actix_session::{storage::CookieSessionStore, Session, SessionMiddleware};
use actix_web::{
    cookie, get,
    http::header::{ContentDisposition, DispositionParam, DispositionType},
    web, App, HttpResponse, HttpServer, Responder,
};
use maud::html;
use qrcode_generator::QrCodeEcc;
use serde::Deserialize;

use google_sheets4::Sheets;

// TODO: Use .env?
const IP: &str = "0.0.0.0";
const PORT: u16 = 5654;

const QR_SIZE: usize = 256;

const MAX_NAME_LEN: usize = 64;

pub const MAX_AUTHENTICATED_USERS: usize = 64;

#[derive(Deserialize)]
pub struct UserProfileOptional {
    name: Option<String>,
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

fn get_qr_url(name: &str, base_url: &str) -> Result<String, Box<dyn Error>> {
    if name.len() > MAX_NAME_LEN {
        return Err(Box::new(NameTooLongErr));
    }

    if name.is_empty() {
        return Err(Box::new(NameEmptyErr));
    }

    Ok(format!(
        "{base_url}/register_attendance?name={}",
        encode(name)
    ))
}

#[get("/qr")]
async fn generate_qr(info: web::Query<UserProfileOptional>, req: HttpRequest) -> impl Responder {
    // TODO: check name isn't empty
    let html = match info.name.clone() {
        Some(name) => {
            let url = get_qr_url(&name, &get_base_url(&req));
            if url.is_err() {
                return Err(NameTooLongErr);
            }

            // Generate the QR code as svg
            let qr_svg = qrcode_generator::to_svg_to_string::<_, &str>(
                url.unwrap(),
                QrCodeEcc::Medium,
                QR_SIZE,
                None,
            )
            .unwrap();

            html! {
                html {
                    script src="/index.js" {}

                    (maud::PreEscaped(qr_svg))
                    form onsubmit="displayQR(event)" method="GET" {
                        input id="nameInput" autofocus {}
                    }

                    button onclick=(format!("window.location.href='/download?name={}'", encode(name))) { "Download!" }
                }
            }
        }
        None => html! {
            html {
                script src="/index.js" {}
                p { "Please enter a user ID. For proper formatting, use lowercase with a period (.) to separate names (e.g. John Smith would be john.smith)."}
                form onsubmit="displayQR(event)" method="GET" {
                    input id="nameInput" autofocus {}
                }
            }
        },
    };

    Ok(HttpResponse::Ok().body(html.into_string()))
}

#[derive(Deserialize)]
pub struct UserProfile {
    name: String,
}

#[get("/download")]
async fn download_qr(info: web::Query<UserProfile>, req: HttpRequest) -> impl Responder {
    let url = get_qr_url(&info.name, &get_base_url(&req));
    if url.is_err() {
        return HttpResponse::BadRequest().body("Name too long");
    }

    // Generate the QR PNG blob
    let binary = qrcode_generator::to_png_to_vec(url.unwrap(), QrCodeEcc::Medium, QR_SIZE).unwrap();

    // Tell the browser to download the file with a specific filename
    let content_disposition = ContentDisposition {
        disposition: DispositionType::Attachment,
        parameters: vec![DispositionParam::Filename(format!("{}.png", info.name))],
    };

    HttpResponse::Ok()
        .content_type("image/png")
        .append_header(content_disposition)
        .body(binary)
}

#[get("/register_attendance")]
async fn register_attendance(
    info: web::Query<UserProfile>,
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

    let client = http_client::http_client();
    let auth = auth::google_auth(client.clone()).await;
    let hub = Sheets::new(client.clone(), auth);
    let name = sheets::userid_to_name(&info.name);
    let length = match sheets::get_members(&hub, Some(&name)).await {
        Ok(l) => l,
        _ => 0, // just use zero to indicate duplicates?
    };
    if length == 0 {
        return HttpResponse::Ok().body("Already in");
    }
    let u8length = length.try_into().unwrap();
    sheets::add_member(&hub, u8length, &name)
        .await
        .expect("Adding member to the spreadsheet failed.");
    HttpResponse::Ok().body(format!(
        "{} has been added to the roster as {}.",
        info.name.clone(),
        &name
    ))
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthBody {
    password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedirectURL {
    redirect: Option<String>,
}

#[post("/auth")]
async fn authenticate(
    session: Session,
    data: web::Data<AppState>,
    body: web::Form<AuthBody>,
    info: web::Query<RedirectURL>,
) -> impl Responder {
    if is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Ok().body("already authenticated");
    }

    if body.password != data.admin_password {
        return HttpResponse::Unauthorized().body("Invalid admin password");
    }

    // Create session for user
    new_session(&session, &data.authenticated_keys);
    get_redirect_response(&info.redirect.clone().unwrap_or("/".to_string()))
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
    let html = html! {
        html {
            p { "Enter admin password to accept member attendance:"}
            form action=(format!("/auth?redirect={redirect_encoded}")) method="POST" {
                input name="password" id="password" type="password" autofocus {}
            }
        }
    };

    HttpResponse::Ok().body(html.into_string())
}

struct AppState {
    // Circular buffer allows us to have a fixed capacity and remove oldest
    // key when inserting a new one - this is to prevent using up too much memory
    authenticated_keys: RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
    admin_password: String,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        dotenv().ok();

        let key = cookie::Key::generate();
        let admin_password =
            env::var("ADMIN_PASSWORD").expect("No admin password provided in environment");

        App::new()
            .app_data(web::Data::new(AppState {
                authenticated_keys: RwLock::new(CircularBuffer::new()),
                admin_password,
            }))
            .wrap(SessionMiddleware::new(CookieSessionStore::default(), key))
            .service(generate_qr)
            .service(download_qr)
            .service(register_attendance)
            .service(login)
            .service(authenticate)
            .service(fs::Files::new("/", "public").index_file("index.html"))
    })
    .bind((IP, PORT))?
    .run()
    .await
}
