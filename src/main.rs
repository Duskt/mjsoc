use std::fmt;

use actix_files as fs;
use actix_web::{
    body::BoxBody,
    get,
    http::header::{ContentDisposition, DispositionParam, DispositionType},
    web, App, HttpResponse, HttpServer, Responder, ResponseError,
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

#[derive(Debug, Clone)]
struct NameTooLongErr;

impl fmt::Display for NameTooLongErr {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Name too long error")
    }
}

impl ResponseError for NameTooLongErr {
    fn status_code(&self) -> actix_web::http::StatusCode {
        actix_web::http::StatusCode::BAD_REQUEST
    }

    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        let res = HttpResponse::new(self.status_code());

        res.set_body(BoxBody::new("Name too long"))
    }
}

fn get_qr_url(name: &str) -> Result<String, NameTooLongErr> {
    if name.len() > MAX_NAME_LEN {
        return Err(NameTooLongErr);
    }

    Ok(format!("{BASE_URL}/login?name={}", name))
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

#[get("/login")]
async fn login(info: web::Query<UserProfile>) -> impl Responder {
    HttpResponse::Ok().body(info.name.clone())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(generate_qr)
            .service(download_qr)
            .service(login)
            .service(fs::Files::new("/", "public").show_files_listing())
    })
    .bind((IP, PORT))?
    .run()
    .await
}
