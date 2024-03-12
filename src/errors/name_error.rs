use crate::impl_response_error;

use derive_more::Display;

#[derive(Debug, Clone, Display)]
pub enum NameErr {
    #[display(fmt = "Name empty")]
    NameEmpty,
    #[display(fmt = "Name too long")]
    NameTooLong,
}

impl From<mj_lib::qr::NameErr> for NameErr {
    fn from(err: mj_lib::qr::NameErr) -> Self {
        match err {
            mj_lib::qr::NameErr::NameEmpty => NameErr::NameEmpty,
            mj_lib::qr::NameErr::NameTooLong => NameErr::NameTooLong,
        }
    }
}

impl_response_error!(NameErr, actix_web::http::StatusCode::BAD_REQUEST);
