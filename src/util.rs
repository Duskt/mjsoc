use std::{
    fs::File,
    io::{BufReader, Read},
};

use actix_web::{http::header::LOCATION, HttpRequest, HttpResponse};

pub fn get_base_url(req: &HttpRequest) -> String {
    let conn_info = req.connection_info();
    let scheme = conn_info.scheme();
    let host = conn_info.host();

    format!("{scheme}://{host}")
}

pub fn get_redirect_response(url: &str) -> HttpResponse {
    return HttpResponse::Found()
        .append_header((LOCATION, url))
        .finish();
}

pub fn get_file_bytes(path: &str) -> Vec<u8> {
    let f = File::open(path).expect("Failed to find file");
    let mut reader = BufReader::new(f);
    let mut buffer = Vec::new();

    // Read file into vector.
    reader
        .read_to_end(&mut buffer)
        .expect("Failed to read file");

    buffer
}

#[macro_export]
macro_rules! parsed_env {
    ($name:literal, $type:ty) => {
        $crate::expect_env!($name).parse::<$type>().expect(&format!(
            "{} was not able to be parsed as {:?}",
            $name,
            stringify!($type)
        ))
    };
}

#[macro_export]
macro_rules! expect_env {
    ($name:literal) => {
        std::env::var($name).expect(&format!("No {} environment variable found", $name))
    };
}
