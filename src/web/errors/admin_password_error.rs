use derive_more::Display;

use crate::impl_response_error;

#[derive(Debug, Display)]
#[display(fmt = "Invalid admin password")]
pub struct AdminPasswordErr;

impl_response_error!(AdminPasswordErr, actix_web::http::StatusCode::UNAUTHORIZED);
