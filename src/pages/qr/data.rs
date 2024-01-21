use crate::{
    components::qr::QrData, errors::name_error::NameErr, signature::generate_signature, QR_SIZE,
};
use qrcode_generator::QrCodeEcc;
use serde::Deserialize;
use urlencoding::encode;

// TODO: use .env?
pub const MAX_NAME_LEN: usize = 64;

pub fn get_qr_url(name: &str, base_url: &str, key: &[u8]) -> Result<String, NameErr> {
    if name.is_empty() {
        return Err(NameErr::NameEmpty);
    }

    if name.len() > MAX_NAME_LEN {
        return Err(NameErr::NameTooLong);
    }

    let signature = generate_signature(name, key);

    let url = format!(
        "{base_url}/register_attendance?name={}&signature={}",
        encode(name),
        encode(&signature), // Shouldn't need to encode, but to be safe
    );

    println!("{url}");
    Ok(url)
}

pub fn get_qr_data(name: &str, base_url: &str, hmac_key: &[u8]) -> Result<QrData, NameErr> {
    let url = get_qr_url(name, base_url, hmac_key)?;

    // Generate the QR code as svg
    let qr_svg = qrcode_generator::to_svg_to_string::<_, &str>(
        url,
        QrCodeEcc::Medium,
        QR_SIZE * 2, // TODO: separate QR display size?
        None,
    )
    .unwrap();

    Ok(QrData {
        name: name.to_string(),
        svg: qr_svg,
    })
}

#[derive(Deserialize)]
pub struct GenerateQuery {
    pub name: Option<String>,
}

#[derive(Deserialize)]
pub struct DownloadQuery {
    pub name: String,
}
