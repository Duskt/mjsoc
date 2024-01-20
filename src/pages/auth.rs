use actix_session::Session;
use actix_web::{post, web, HttpResponse, Responder};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use serde::Deserialize;

use crate::{
    auth::{is_authenticated, new_session},
    util::get_redirect_response,
    AppState,
};

#[derive(Debug, Clone, Deserialize)]
pub struct AuthBody {
    pub password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedirectURL {
    pub redirect: Option<String>,
}

#[post("/auth")]
pub async fn authenticate(
    session: Session,
    data: web::Data<AppState>,
    body: web::Form<AuthBody>,
    info: web::Query<RedirectURL>,
) -> impl Responder {
    if is_authenticated(&session, &data.authenticated_keys) {
        return HttpResponse::Ok().body("already authenticated");
    }

    let hash = PasswordHash::new(&data.admin_password_hash).unwrap();
    if Argon2::default()
        .verify_password(body.password.as_bytes(), &hash)
        .is_err()
    {
        println!("Failed to authenticate");
        return HttpResponse::Unauthorized().body("Invalid admin password");
    }

    println!("Authenticated");
    // Create session for user
    new_session(&session, &data.authenticated_keys);
    get_redirect_response(&info.redirect.clone().unwrap_or("/".to_string()))
}
