use actix_session::Session;
use actix_web::{web, HttpResponse};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use serde::Deserialize;

use crate::{
    auth::{is_authenticated, new_session},
    components::already_authenticated::already_authenticated,
    errors::admin_password_error::AdminPasswordErr,
    util::get_redirect_response,
    AppState,
};

#[derive(Debug, Clone, Deserialize)]
pub struct AuthBody {
    pub username: Option<String>,
    pub password: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedirectURL {
    pub redirect: Option<String>,
}

pub async fn authenticate(
    session: Session,
    data: web::Data<AppState>,
    body: web::Form<AuthBody>,
    info: web::Query<RedirectURL>,
) -> Result<HttpResponse, AdminPasswordErr> {
    if is_authenticated(&session, &data.authenticated_keys) {
        return Ok(HttpResponse::Ok().body(already_authenticated().into_string()));
    }
    let hash = PasswordHash::new(&data.admin_password_hash).unwrap_or_else(|_| panic!("Failed to create an argon2i password hash from \"{}\" Are you sure it's the right format?.", &data.admin_password_hash));
    if Argon2::default()
        .verify_password(body.password.as_bytes(), &hash)
        .is_err()
    {
        println!("Failed to authenticate");
        return Err(AdminPasswordErr);
    }

    println!("Authenticated");

    // Create session for user
    new_session(&session, &data.authenticated_keys);
    Ok(get_redirect_response(
        &info.redirect.clone().unwrap_or("/".to_string()),
    ))
}
