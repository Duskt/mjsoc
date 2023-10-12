use actix_files as fs;
use actix_web::{get, post, web, App, Error, HttpResponse, HttpServer, Responder};
use serde::Deserialize;

const IP: &str = "127.0.0.1";
const PORT: u16 = 5654;

#[derive(Deserialize)]
pub struct UserProfile {
    name: String,
}

// need to serve all files in public
#[get("/")]
async fn hello(info: web::Query<UserProfile>) -> Result<fs::NamedFile, Error> {
    let file = fs::NamedFile::open("public/index.html")?;
    Ok(file)
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().service(hello).service(echo)
        // .route("/hey", web::get().to(manual_hello))
    })
    .bind((IP, PORT))?
    .run()
    .await
}
