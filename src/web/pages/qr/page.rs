use crate::{
    auth::is_authenticated,
    components::{page::page, qr::qr_display},
    errors::name_error::NameErr,
    pages::qr::data::{DownloadQuery, GenerateQuery},
    parsed_env,
    util::{get_base_url, get_redirect_response},
    AppState,
};
use actix_session::Session;
use actix_web::{
    http::header::{ContentDisposition, DispositionParam, DispositionType},
    web, HttpRequest, HttpResponse,
};
use lib::qr::{get_qr_data, get_qr_url};
use qrcode_generator::QrCodeEcc;
use urlencoding::encode;

pub async fn generate_qr(
    info: web::Query<GenerateQuery>,
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
) -> Result<HttpResponse, NameErr> {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }

    let qr_data = match info.name.clone() {
        Some(name) => Some(get_qr_data(&name, &get_base_url(&req), &data.hmac_key)?),
        None => None,
    };

    let html = page(qr_display(qr_data));
    Ok(HttpResponse::Ok().body(html.into_string()))
}

pub async fn download_qr(
    info: web::Query<DownloadQuery>,
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
) -> Result<HttpResponse, NameErr> {
    if !is_authenticated(&session, &data.authenticated_keys) {
        // Login and redirect back here
        return Ok(get_redirect_response(&format!(
            "/login?redirect={}",
            encode(&req.uri().path_and_query().unwrap().to_string()),
        )));
    }

    let url = get_qr_url(&info.name, &get_base_url(&req), &data.hmac_key)?;
    println!("Downloading QR for {}", url);

    // Generate the QR PNG blob
    let qr_size = parsed_env!("QR_SIZE", usize);
    let binary = qrcode_generator::to_png_to_vec(url, QrCodeEcc::Medium, qr_size).unwrap();

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
