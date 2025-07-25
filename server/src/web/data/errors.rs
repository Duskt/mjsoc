use actix_web::HttpResponse;

pub enum MahjongDataError {
    ReferenceNotFound,
    DuplicatesFound,
    Unknown(sqlx::Error)
}


impl MahjongDataError {
    pub fn handle_unknown(&self) -> HttpResponse {
        match self {
            MahjongDataError::Unknown(err) => {
                println!("Sqlite error occurred: {err}");
                HttpResponse::InternalServerError().body("An unexpected error occurred in the server.")
            }
            _ => panic!("handle_unknown called with specific error")
        }
    }
}

impl MahjongDataError {
    pub fn handle(&self) -> HttpResponse {
        match self {
            MahjongDataError::ReferenceNotFound => HttpResponse::BadRequest().body("Couldn't find entry with provided id."),
            MahjongDataError::DuplicatesFound => HttpResponse::ExpectationFailed().body("Multiple entries with provided id exist."),
            MahjongDataError::Unknown(_) => self.handle_unknown()
        }
    }
}