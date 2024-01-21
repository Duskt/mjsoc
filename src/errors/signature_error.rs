use crate::impl_response_error;
use derive_more::Display;

#[derive(Debug, Display)]
#[display(fmt = "Invalid signature")]
pub struct SignatureErr;

impl_response_error!(
    SignatureErr,
    actix_web::http::StatusCode::UNPROCESSABLE_ENTITY
);
