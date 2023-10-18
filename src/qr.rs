use crate::{
    auth::is_authenticated,
    components::qr::{qr_display, QrData},
    errors::name_error::NameErr,
    get_base_url, get_redirect_response,
    google::sheets,
    page,
    signature::generate_signature,
    AppState, QR_SIZE,
};
use actix_session::Session;
use actix_web::{
    get,
    http::header::{ContentDisposition, DispositionParam, DispositionType},
    web, HttpRequest, HttpResponse, Responder,
};
use qrcode_generator::QrCodeEcc;
use serde::Deserialize;
use urlencoding::encode;

fn get_qr_url(name: &str, base_url: &str, key: &Vec<u8>) -> Result<String, NameErr> {
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
    name: Option<String>,
}

#[get("/qr")]
pub async fn generate_qr(
    info: web::Query<GenerateQuery>,
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }

    let qr_data = match info.name.clone() {
        Some(name) => {
            let url = get_qr_url(&name, &get_base_url(&req), &data.hmac_key);
            let url = match url {
                Ok(url) => url,
                Err(err) => return Err(err),
            };

            // Generate the QR code as svg
            let qr_svg = qrcode_generator::to_svg_to_string::<_, &str>(
                url,
                QrCodeEcc::Medium,
                QR_SIZE * 2, // TODO: separate QR display size?
                None,
            )
            .unwrap();

            Some(QrData {
                name: name.to_string(),
                svg: qr_svg,
            })
        }
        None => None,
    };

    let html = page(qr_display(qr_data));
    Ok(HttpResponse::Ok().body(html.into_string()))
}

#[derive(Deserialize)]
pub struct DownloadQuery {
    name: String,
}

#[get("/download")]
pub async fn download_qr(
    info: web::Query<DownloadQuery>,
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
) -> impl Responder {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }
    let url = get_qr_url(&info.name, &get_base_url(&req), &data.hmac_key);
    match url {
        Ok(_) => (),
        Err(err) => return Err(err),
    }

    // Generate the QR PNG blob
    let binary = qrcode_generator::to_png_to_vec(url.unwrap(), QrCodeEcc::Medium, QR_SIZE).unwrap();

    // Tell the browser to download the file with a specific filename
    let content_disposition = ContentDisposition {
        disposition: DispositionType::Attachment,
        parameters: vec![DispositionParam::Filename(format!("{}.png", info.name))],
    };

    Ok(HttpResponse::Ok()
        .content_type("image/png")
        .append_header(content_disposition)
        .body(binary))
}
