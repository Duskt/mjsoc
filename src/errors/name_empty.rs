use std::{error::Error, fmt};

use actix_web::{body::BoxBody, HttpResponse, ResponseError};

#[derive(Debug, Clone)]
pub struct NameEmptyErr;

impl fmt::Display for NameEmptyErr {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Name empty error")
    }
}

impl Error for NameEmptyErr {}

impl ResponseError for NameEmptyErr {
    fn status_code(&self) -> actix_web::http::StatusCode {
        actix_web::http::StatusCode::BAD_REQUEST
    }

    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        let res = HttpResponse::new(self.status_code());

        res.set_body(BoxBody::new("Name empty"))
    }
}
