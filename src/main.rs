use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::Deserialize;

const IP: &str = "127.0.0.1";
const PORT: u16 = 5654;

#[derive(Deserialize)]
pub struct UserProfile {
    name: String,
}

#[get("/")]
async fn hello(info: web::Query<UserProfile>) -> impl Responder {
    HttpResponse::Ok().body(info.name.clone())
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
