use actix_files as fs;
use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use const_format::formatcp;
use qrcode_generator::QrCodeEcc;
use serde::Deserialize;

const IP: &str = "0.0.0.0";
const PORT: u16 = 5654;

const QR_SIZE: usize = 256;
const BASE_URL: &str = formatcp!("http://localhost:{PORT}");

const MAX_NAME_LEN: usize = 64;

#[derive(Deserialize)]
pub struct UserProfile {
    name: Option<String>,
}

#[get("/")]
async fn generate_qr(info: web::Query<UserProfile>) -> impl Responder {
    let qr_svg = match info.name.clone() {
        Some(name) => {
            if name.len() > MAX_NAME_LEN {
                return HttpResponse::BadRequest().body("Name too long");
            }

            let url = format!("{BASE_URL}/login?name={}", name);
            qrcode_generator::to_svg_to_string::<_, &str>(url, QrCodeEcc::Medium, QR_SIZE, None)
                .unwrap()
        }
        None => String::new(),
    };

    let html = format!(
        r#"
            <script src="/onsubmit.js"></script>
            <html>
                {}
                <form onsubmit="redirect(); return false" method="get">
                    <input id="nameInput"/>
                </form>
            </html>
        "#,
        qr_svg
    );
    HttpResponse::Ok().body(html)
}

#[get("/login")]
async fn login(info: web::Query<UserProfile>) -> impl Responder {
    HttpResponse::Ok().body(info.name.clone().unwrap())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(generate_qr)
            .service(login)
            .service(fs::Files::new("/", "public").show_files_listing())
    })
    .bind((IP, PORT))?
    .run()
    .await
}
