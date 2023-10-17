mod auth;
mod errors;
mod http_client;
mod sheets;

use crate::auth::is_authenticated;
use crate::auth::new_session;
use crate::errors::name_error::NameErr;
use actix_web::{http::header::LOCATION, post, HttpRequest};
use base64::engine::general_purpose;
use base64::Engine;
use circular_buffer::CircularBuffer;
use dotenv::dotenv;
use ring::hmac;
use std::fs::File;
use std::io::BufReader;
use std::io::Read;
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

fn generate_signature(input: &str, key: &Vec<u8>) -> String {
    let key = hmac::Key::new(hmac::HMAC_SHA256, key);
    let mut context = hmac::Context::with_key(&key);
    context.update(input.as_bytes());

    let signature = context.sign();
    general_purpose::URL_SAFE_NO_PAD.encode(&signature)
}

fn verify_signature(input: &str, signature: &str, key: &Vec<u8>) -> bool {
    let signature_bytes = match general_purpose::URL_SAFE_NO_PAD.decode(&signature) {
        Ok(decoded) => decoded,
        Err(_) => return false,
    };

    let verifying_key = hmac::Key::new(hmac::HMAC_SHA256, key);
    hmac::verify(&verifying_key, input.as_bytes(), &signature_bytes).is_ok()
}

fn get_qr_url(name: &str, base_url: &str, key: &Vec<u8>) -> Result<String, NameErr> {
    if name.is_empty() {
        return Err(NameErr::NameEmpty);
    }

    if name.len() > sheets::MAX_NAME_LEN {
        return Err(NameErr::NameTooLong);
    }

    let signature = generate_signature(name, key);

    let url = format!(
        "{base_url}/register_attendance?name={}&signature={}",
        encode(name),
        encode(&signature), // Shouldn't need to encode, but to be safe
    );

    println!("{url}");
    Ok(url)
}

#[get("/qr")]
async fn generate_qr(
    info: web::Query<UserProfileOptional>,
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }
    let html = match info.name.clone() {
        Some(name) => {
            let url = get_qr_url(&name, &get_base_url(&req), &data.hmac_key);
            let url = match url {
                Ok(url) => url,
                Err(err) => return Err(err),
            };

            // Generate the QR code as svg
            let qr_svg = qrcode_generator::to_svg_to_string::<_, &str>(
                url,
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

                    button onclick=(format!("window.location.href='/download?name={}'", encode(&name))) { "Download!" }
                }
            }
        }
        None => html! {
            html {
                script src="/index.js" {}
                p { "Please enter a name as it should be displayed on the Google Sheet, e.g. John Smith."}
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
async fn download_qr(
    info: web::Query<UserProfile>,
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }
    let url = get_qr_url(&info.name, &get_base_url(&req), &data.hmac_key);
    match url {
        Ok(_) => (),
        Err(err) => return Err(err),
    }

    // Generate the QR PNG blob
    let binary = qrcode_generator::to_png_to_vec(url.unwrap(), QrCodeEcc::Medium, QR_SIZE).unwrap();

    // Tell the browser to download the file with a specific filename
    let content_disposition = ContentDisposition {
        disposition: DispositionType::Attachment,
        parameters: vec![DispositionParam::Filename(format!("{}.png", info.name))],
    };

    Ok(HttpResponse::Ok()
        .content_type("image/png")
        .append_header(content_disposition)
        .body(binary))
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

    let client = http_client::http_client();
    let auth = auth::google_auth(client.clone()).await;
    let hub = Sheets::new(client.clone(), auth);
    let length = match sheets::get_members(&hub, Some(&info.name)).await {
        Ok(l) => l,
        _ => 0, // just use zero to indicate duplicates?
    };
    if length == 0 {
        return HttpResponse::Ok().body(format!("{} is already in the roster.", &info.name));
    }
    let u8length = length.try_into().unwrap();
    match sheets::add_member(&hub, u8length, &info.name).await {
        Ok(_) => {
            HttpResponse::Created().body(format!("{} has been added to the roster.", &info.name))
        }
        Err(e) => HttpResponse::BadRequest().body(e.to_string()),
    }
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

#[derive(Debug)]
struct AppState {
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
            .service(fs::Files::new("/", "public").index_file("index.html"))
    })
    .bind((IP, PORT))?
    .run()
    .await
}
