use actix_files::NamedFile;
use actix_web::web;

use crate::config::AppState;

pub async fn logo(data: web::Data<AppState>) -> Result<NamedFile, std::io::Error> {
    NamedFile::open(&data.config.logo_path)
}
