use crate::{errors::name_error::NameErr, google::sheets, signature::generate_signature};
use serde::Deserialize;
use urlencoding::encode;

pub fn get_qr_url(name: &str, base_url: &str, key: &[u8]) -> Result<String, NameErr> {
    if name.is_empty() {
        return Err(NameErr::NameEmpty);
    }

    if name.len() > sheets::MAX_NAME_LEN {
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

#[derive(Deserialize)]
pub struct GenerateQuery {
    pub name: Option<String>,
}

#[derive(Deserialize)]
pub struct DownloadQuery {
    pub name: String,
}
