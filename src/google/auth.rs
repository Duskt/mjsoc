use google_sheets4::oauth2::{self, authenticator::Authenticator};
use google_sheets4::{hyper, hyper_rustls};

use crate::expect_env;

// https://medium.com/@iamchrisgrounds/google-sheets-with-rust-6ecab23fa765
pub async fn authenticate(
    client: hyper::Client<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>,
) -> Authenticator<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>> {
    let secret: oauth2::ServiceAccountKey =
        oauth2::read_service_account_key(expect_env!("GOOGLE_PRIVATE_KEY_FILE"))
            .await
            .expect("Secret not found!");

    oauth2::ServiceAccountAuthenticator::with_client(secret, client.clone())
        .build()
        .await
        .expect("could not create an authenticator")
}
