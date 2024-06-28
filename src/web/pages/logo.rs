use std::env;

use actix_files::NamedFile;
pub async fn logo() -> Result<NamedFile, std::io::Error> {
    let logo_file = env::var("LOGO_PATH");
    println!("Logo requested. Using '{:?}'", logo_file);
    match logo_file {
        Ok(path) => NamedFile::open(path),
        Err(_) => {
            println!("No env LOGO_PATH found, using default './public/assets/logo.jpg'");
            NamedFile::open("./public/assets/logo.jpg")
        }
    }
}
