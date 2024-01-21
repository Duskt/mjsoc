#[macro_export]
macro_rules! impl_response_error {
    ($err:ty, $resp_code:expr) => {
        impl actix_web::ResponseError for $err {
            fn status_code(&self) -> actix_web::http::StatusCode {
                $resp_code
            }

            fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
                let res = actix_web::HttpResponse::new(self.status_code());

                res.set_body(actix_web::body::BoxBody::new(self.to_string()))
            }
        }
    };
}
