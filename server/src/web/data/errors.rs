use actix_web::HttpResponse;

use crate::data::structs::EntryId;

#[derive(Debug)]
pub enum MahjongDataError {
    ForeignConstraint(EntryId),
    ReferenceNotFound(EntryId),
    DuplicatesFound(EntryId),
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
            MahjongDataError::ForeignConstraint(entry) | MahjongDataError::ReferenceNotFound(entry) => match entry {
                EntryId::Member(mid) => HttpResponse::BadRequest().body(format!("Couldn't find member with id {mid}")),
                EntryId::Table(tno) => HttpResponse::BadRequest().body(format!("Couldn't find table with table number {tno}")),
                EntryId::Log(lid) => HttpResponse::BadRequest().body(format!("Couldn't find log with id {lid}"))
            },
            MahjongDataError::DuplicatesFound(entry) => match entry {
                EntryId::Member(mid) => HttpResponse::ExpectationFailed().body(format!("Multiple members with id {mid} exist.")),
                EntryId::Table(tno) => HttpResponse::ExpectationFailed().body(format!("Multiple tables with table number {tno} exist.")),
                EntryId::Log(lid) => HttpResponse::ExpectationFailed().body(format!("Multiple logs with id {lid} exist."))
            },
            MahjongDataError::Unknown(..) => self.handle_unknown()
        }
    }
}