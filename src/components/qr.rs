use maud::{html, PreEscaped};
use urlencoding::encode;

pub struct QrData {
    pub name: String,
    pub svg: String,
}

pub fn qr_display(qr_data: Option<QrData>) -> PreEscaped<String> {
    html!(
        script src="/index.js" {}

        @if let Some(QrData { svg, name }) = &qr_data {
            (maud::PreEscaped(svg))
            button onclick=(format!("window.location.href='/download?name={}'", encode(&name))) { "Download!" }
        }
        p { "Please enter a name as it should be displayed on the Google Sheet, e.g. John Smith."}
        form onsubmit="displayQR(event)" method="GET" {
            input id="nameInput" autofocus {}
        }
    )
}
