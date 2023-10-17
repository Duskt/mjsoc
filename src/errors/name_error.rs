use std::fmt::Display;

use actix_web::{body::BoxBody, HttpResponse, ResponseError};

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

impl ResponseError for NameErr {
    fn status_code(&self) -> actix_web::http::StatusCode {
        actix_web::http::StatusCode::BAD_REQUEST
    }

    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        let res = HttpResponse::new(self.status_code());

        res.set_body(BoxBody::new(self.to_string()))
    }
}
