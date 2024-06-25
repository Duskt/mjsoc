use log::warn;
use std::env;

use actix_files::NamedFile;
pub async fn logo() -> Result<NamedFile, std::io::Error> {
    let logo_file = env::var("LOGO_FILE");
    match logo_file {
        Ok(path) => NamedFile::open(path),
        Err(_) => {
            warn!("No env LOGO_FILE found, using default './public/assets/logo.jpg'");
            NamedFile::open("./public/assets/logo.jpg")
        }
    }
}
