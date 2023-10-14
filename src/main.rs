mod errors;
mod auth;

use crate::auth::is_authenticated;
use errors::name_too_long::NameTooLongErr;
use uuid::Uuid;
use actix_web::http::header::LOCATION;
use std::{
    collections::HashSet,
    sync::{RwLock},
};

use actix_files as fs;
use actix_session::{storage::CookieSessionStore, Session, SessionMiddleware};
use actix_web::{
    cookie,
    get,
    http::header::{ContentDisposition, DispositionParam, DispositionType},
    web, App, HttpResponse, HttpServer, Responder,
};
use const_format::formatcp;
use maud::html;
use qrcode_generator::QrCodeEcc;
use serde::Deserialize;

const IP: &str = "0.0.0.0";
const PORT: u16 = 5654;

const QR_SIZE: usize = 256;
const BASE_URL: &str = formatcp!("http://localhost:{PORT}");

const MAX_NAME_LEN: usize = 64;

#[derive(Deserialize)]
pub struct UserProfileOptional {
    name: Option<String>,
}

fn get_qr_url(name: &str) -> Result<String, NameTooLongErr> {
    if name.len() > MAX_NAME_LEN {
        return Err(NameTooLongErr);
    }

    Ok(format!("{BASE_URL}/register_attendance?name={}", name))
}

#[get("/")]
async fn generate_qr(info: web::Query<UserProfileOptional>) -> impl Responder {
    let html = match info.name.clone() {
        Some(name) => {
            let url = get_qr_url(&name);
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
                    form onsubmit="redirect(event)" method="get" {
                        input id="nameInput" autofocus {}
                    }

                    button onclick=(format!("window.location.href='/download?name={}'", name)) { "Download!" }
                }
            }
        }
        None => html! {
            html {
                script src="/index.js" {}

                form onsubmit="redirect(event)" method="get" {
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
async fn download_qr(info: web::Query<UserProfile>) -> impl Responder {
    let url = get_qr_url(&info.name);
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
async fn register_attendance(info: web::Query<UserProfile>, data: web::Data<AppState>, session: Session) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Found().append_header((LOCATION, format!("{BASE_URL}/login"))).finish()
    }

    HttpResponse::Ok().body(info.name.clone())
}

// TODO: take redirect url - take them back to the page they were on before
#[get("/login")]
async fn login(session: Session, data: web::Data<AppState>) -> impl Responder {
    if is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Ok().body("already authenticated");
    }
    // TODO: Get and check password

    let uuid = Uuid::new_v4();

    session
        .insert("session_key", uuid.to_string())
        .unwrap();

    // TODO: remove oldest if exceeds certain number of keys - maybe best to use Vec?
    data.authenticated_keys.write().unwrap().insert(uuid.to_string());

    HttpResponse::Ok().body("authenticated now")
}

struct AppState {
    authenticated_keys: RwLock<HashSet<String>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let key = cookie::Key::generate();

        App::new()
            .app_data(web::Data::new(AppState { 
                authenticated_keys: RwLock::new(HashSet::new())
            }))
            .wrap(SessionMiddleware::new(CookieSessionStore::default(), key))
            .service(generate_qr)
            .service(download_qr)
            .service(register_attendance)
            .service(login)
            .service(fs::Files::new("/", "public").show_files_listing())
    })
    .bind((IP, PORT))?
    .run()
    .await
}
