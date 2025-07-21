use actix_web::ResponseError;
use core::fmt::{Debug, Display};
use derive_more::Display;

// This is a workaround because actix doesn't allow for Box<dyn ResponseError>. It has to be known
// at compile time
#[derive(Debug, Display)]
pub enum EitherError<L, R>
where
    L: Debug + Display + ResponseError,
    R: Debug + Display + ResponseError,
{
    #[display(fmt = "{}", _0)]
    Left(L),
    #[display(fmt = "{}", _0)]
    Right(R),
}

impl<L, R> actix_web::ResponseError for EitherError<L, R>
where
    L: Debug + Display + ResponseError,
    R: Debug + Display + ResponseError,
{
    fn status_code(&self) -> actix_web::http::StatusCode {
        match self {
            Self::Left(e) => e.status_code(),
            Self::Right(e) => e.status_code(),
        }
    }

    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        match self {
            Self::Left(e) => e.error_response(),
            Self::Right(e) => e.error_response(),
        }
    }
}

impl<L, R> EitherError<L, R>
where
    L: Debug + Display + ResponseError,
    R: Debug + Display + ResponseError,
{
    pub fn from_left(value: L) -> Self {
        EitherError::Left(value)
    }

    pub fn from_right(value: R) -> Self {
        EitherError::Right(value)
    }
}
