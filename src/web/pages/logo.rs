use std::env;
use actix_files::NamedFile;

pub async fn logo() -> Result<NamedFile, std::io::Error> {
    let logo_path_env = env::var("LOGO_PATH");
    let public_path = env::var("PUBLIC_PATH").expect("PUBLIC_PATH required.");
    let logo_path = match logo_path_env {
        Ok(path) => path,
        Err(_) => {
            // the internal file (note the file extension, because this a real path)
            println!("No env LOGO_PATH found, using default '<public>/assets/logo.jpg'");
            format!("{}/assets/logo.jpg", public_path)
        }
    };
    NamedFile::open(logo_path)
}
