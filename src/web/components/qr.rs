use std::env;

use maud::{html, PreEscaped};
use lib::qr::QrData;
use urlencoding::encode;

pub fn qr_display(qr_data: Option<QrData>) -> PreEscaped<String> {
    let public_path = env::var("PUBLIC_PATH").expect("Missing PUBLIC_PATH");
    let script_path = format!("{}/index.js", public_path);
    html!(
        script src=(script_path) {}

        @if let Some(QrData { svg, name }) = &qr_data {
            (maud::PreEscaped(svg))
            button onclick=(format!("window.location.href='/download?name={}'", encode(name))) { "Download!" }
        }
        p { "Please enter a name as it should be displayed on the Google Sheet, e.g. John Smith."}
        form onsubmit="displayQR(event)" method="GET" {
            input id="nameInput" autofocus {}
        }
    )
}
