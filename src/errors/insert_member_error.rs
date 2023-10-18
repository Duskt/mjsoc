use std::fmt::Display;

use actix_web::{body::BoxBody, HttpResponse, ResponseError};
use google_sheets4::Error;

#[derive(Debug)]
pub enum InsertMemberErr {
    AlreadyInRoster,
    GoogleSheetsErr(Error),
}

impl Display for InsertMemberErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InsertMemberErr::AlreadyInRoster => write!(f, "User is already in the roster"),
            InsertMemberErr::GoogleSheetsErr(e) => write!(f, "{e:?}"),
        }
    }
}

impl ResponseError for InsertMemberErr {
    fn status_code(&self) -> actix_web::http::StatusCode {
        actix_web::http::StatusCode::BAD_REQUEST
    }

    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        let res = HttpResponse::new(self.status_code());

        res.set_body(BoxBody::new(self.to_string()))
    }
}
