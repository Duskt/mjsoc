use actix_web::HttpResponse;

use crate::data::sqlite::PrimaryEntryKind;

pub enum MahjongDataError {
    ReferenceNotFound(PrimaryEntryKind),
    DuplicatesFound(PrimaryEntryKind),
    Unknown(sqlx::Error)
}


impl MahjongDataError {
    pub fn handle_unknown(&self) -> HttpResponse {
        match self {
            MahjongDataError::Unknown(err) => {
                println!("Sqlite error occurred when running UNKNOWN statement:");
                dbg!(err);
                HttpResponse::InternalServerError().body("An unexpected error occurred in the server.")
            }
            _ => panic!("handle_unknown called with specific error")
        }
    }
}

impl MahjongDataError {
    pub fn handle(&self) -> HttpResponse {
        match self {
            MahjongDataError::ReferenceNotFound(entry) => match entry {
                PrimaryEntryKind::Member(mid) => HttpResponse::BadRequest().body(format!("Couldn't find member with id {mid}")),
                PrimaryEntryKind::Table(tno) => HttpResponse::BadRequest().body(format!("Couldn't find table with table number {tno}"))
            },
            MahjongDataError::DuplicatesFound(entry) => match entry {
                PrimaryEntryKind::Member(mid) => HttpResponse::ExpectationFailed().body(format!("Multiple members with id {mid} exist.")),
                PrimaryEntryKind::Table(tno) => HttpResponse::ExpectationFailed().body(format!("Multiple tables with table number {tno} exist."))
            },
            MahjongDataError::Unknown(..) => self.handle_unknown()
        }
    }
}