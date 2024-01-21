use crate::impl_response_error;

use derive_more::Display;
use google_sheets4::Error;

#[derive(Debug, Display)]
pub enum InsertMemberErr {
    #[display(fmt = "User is already in the roster")]
    AlreadyInRoster,
    #[display(fmt = "{:?}", _0)]
    GoogleSheetsErr(Error),
}

impl_response_error!(InsertMemberErr, actix_web::http::StatusCode::BAD_REQUEST);
