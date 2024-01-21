use crate::impl_response_error;

use google_sheets4::Error;
use std::fmt::Display;

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

impl_response_error!(InsertMemberErr, actix_web::http::StatusCode::BAD_REQUEST);
