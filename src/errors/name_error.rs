use crate::impl_response_error;

use std::fmt::Display;

#[derive(Debug, Clone)]
pub enum NameErr {
    NameEmpty,
    NameTooLong,
}

impl Display for NameErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            NameErr::NameEmpty => write!(f, "Name empty"),
            NameErr::NameTooLong => write!(f, "Name too long"),
        }
    }
}

impl_response_error!(NameErr, actix_web::http::StatusCode::BAD_REQUEST);
