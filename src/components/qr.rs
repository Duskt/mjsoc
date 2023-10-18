use maud::{html, PreEscaped};
use urlencoding::encode;

pub struct QrData {
    pub name: String,
    pub svg: String,
}

pub fn qr_display(qr_data: Option<QrData>) -> PreEscaped<String> {
    html!(
        script src="/index.js" {}

        @if let Some(QrData { svg, .. }) = &qr_data {
            (maud::PreEscaped(svg))
        }

        form onsubmit="displayQR(event)" method="GET" {
            input id="nameInput" autofocus {}
        }

        @if let Some(QrData { name, .. }) = &qr_data {
            button onclick=(format!("window.location.href='/download?name={}'", encode(&name))) { "Download!" }
        }
    )
}
