use base64::{engine::general_purpose, Engine};
use ring::hmac;

pub fn generate_signature(input: &str, key: &Vec<u8>) -> String {
    let key = hmac::Key::new(hmac::HMAC_SHA256, key);
    let mut context = hmac::Context::with_key(&key);
    context.update(input.as_bytes());

    let signature = context.sign();
    general_purpose::URL_SAFE_NO_PAD.encode(&signature)
}

pub fn verify_signature(input: &str, signature: &str, key: &Vec<u8>) -> bool {
    let signature_bytes = match general_purpose::URL_SAFE_NO_PAD.decode(&signature) {
        Ok(decoded) => decoded,
        Err(_) => return false,
    };

    let verifying_key = hmac::Key::new(hmac::HMAC_SHA256, key);
    hmac::verify(&verifying_key, input.as_bytes(), &signature_bytes).is_ok()
}
