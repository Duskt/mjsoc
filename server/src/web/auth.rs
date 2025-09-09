use actix_session::Session;
use actix_web::{HttpRequest, HttpResponse};
use circular_buffer::CircularBuffer;
use lib::util::get_redirect_response;
use urlencoding::encode;
use std::sync::RwLock;
use uuid::Uuid;
use crate::config::MAX_AUTHENTICATED_USERS;

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

pub fn authenticate(session: &Session, keys: &RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>, req: HttpRequest) -> Option<HttpResponse> {
    if !is_authenticated(session, keys) {
        // Login and redirect back here
        return Some(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }
    None
}

pub fn new_session(
    session: &Session,
    authenticated_keys: &RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
) -> String {
    let uuid = Uuid::new_v4();

    // Add to user's cookies
    session.insert("session_key", uuid.to_string()).unwrap_or_else(|_| panic!("Failed to insert a session cookie. This could be because it was unable to JSON-serialize the following uuid value: {}", uuid));

    // Store on server to check user has a valid session
    authenticated_keys
        .write()
        .unwrap()
        .push_back(uuid.to_string());

    uuid.to_string()
}
