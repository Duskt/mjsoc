use argon2::{
    PasswordHash,
    PasswordVerifier,
    Argon2,
};
use std::sync::RwLock;
use actix_session::Session;
use actix_web::{post, web, HttpResponse, Responder};
use circular_buffer::CircularBuffer;
use serde::Deserialize;
use uuid::Uuid;

use crate::{get_redirect_response, AppState, MAX_AUTHENTICATED_USERS};

fn circular_buffer_contains(
    buffer: &CircularBuffer<MAX_AUTHENTICATED_USERS, String>,
    value: &str,
) -> bool {
    buffer.iter().any(|x| x == value)
}

pub fn is_authenticated(
    session: &Session,
    authenticated_keys: &RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
) -> bool {
    let key = session.get::<String>("session_key").unwrap();

    match key {
        Some(key) => return circular_buffer_contains(&authenticated_keys.read().unwrap(), &key),
        None => false,
    }
}

pub fn new_session(
    session: &Session,
    authenticated_keys: &RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
) -> String {
    let uuid = Uuid::new_v4();

    // Add to user's cookies
    session.insert("session_key", uuid.to_string()).unwrap();

    // Store on server to check user has a valid session
    authenticated_keys
        .write()
        .unwrap()
        .push_back(uuid.to_string());

    uuid.to_string()
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthBody {
    password: String,
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
    if !Argon2::default().verify_password(body.password.as_bytes(), &hash).is_ok() {
        return HttpResponse::Unauthorized().body("Invalid admin password");
    }

    // Create session for user
    new_session(&session, &data.authenticated_keys);
    get_redirect_response(&info.redirect.clone().unwrap_or("/".to_string()))
}
