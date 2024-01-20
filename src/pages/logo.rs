use std::env;

use actix_files::NamedFile;
pub async fn logo() -> Result<NamedFile, std::io::Error> {
    println!("Logo requested. Using '{:?}'", env::var("LOGO_FILE"));
    match env::var("LOGO_FILE") {
        Ok(path) => NamedFile::open(path),
        Err(_) => {
            println!("No env LOGO_FILE found, using default './public/assets/logo.jpg'");
            NamedFile::open("./public/assets/logo.jpg")
        }
    }
}
