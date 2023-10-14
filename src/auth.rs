use std::{collections::HashSet, sync::RwLock};

use actix_session::Session;

pub fn is_authenticated(session: &Session, authenticated_keys: &RwLock<HashSet<String>>) -> bool {
    let key = session.get::<String>("session_key").unwrap();

    match key {
        Some(key) => return authenticated_keys.read().unwrap().contains(&key),
        None => false,
    }
}
