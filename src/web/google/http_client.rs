// https://medium.com/@iamchrisgrounds/google-sheets-with-rust-6ecab23fa765
use google_sheets4::{hyper, hyper_rustls};

pub fn http_client() -> hyper::Client<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>> {
    hyper::Client::builder().build(
        hyper_rustls::HttpsConnectorBuilder::new()
            .with_native_roots()
            .https_only()
            .enable_http1()
            .enable_http2()
            .build(),
    )
}
