use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug)]
pub enum EntryId {
    Member(MemberId),
    Table(TableNo),
    Log(LogId)
}

impl EntryId {
    pub fn get_table_key_value(&self) -> (&'static str, &'static str, u32) {
        match self {
            EntryId::Member(mid) => ("members", "member_id", *mid),
            EntryId::Table(tno) => ("mahjong_tables", "table_no", *tno),
            EntryId::Log(lid) => ("logs", "id", *lid)
        }
    }
}

// a single member's data associated with a tournament
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TournamentData {
    pub total_points: i32,
    pub session_points: i32,
    pub registered: bool,
}

pub type MemberId = u32;

// member data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: MemberId,
    pub name: String,
    pub tournament: TournamentData,
    #[serde(default)]
    pub council: bool,
}

pub type TableNo = u32;

// a four-player mahjong table's data
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TableData {
    pub table_no: TableNo,
    pub east: MemberId,
    pub south: MemberId,
    pub west: MemberId,
    pub north: MemberId,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(rename_all = "lowercase", type_name = "wind")]
#[serde(rename_all = "lowercase")]
pub enum Wind {
    East,
    South,
    West,
    North,
}
impl Wind {
    pub fn into_str(self) -> &'static str {
        match self {
            Self::East => "east",
            Self::South => "south",
            Self::West => "west",
            Self::North => "north"
        }
    }
    pub fn all() -> Vec<Self> {
        vec![Wind::East, Wind::South, Wind::West, Wind::North]
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(rename_all = "lowercase", type_name = "win_kind")]
#[serde(rename_all = "lowercase")]
pub enum WinKind {
    Zimo,
    Dachut,
    Baozimo,
}

impl WinKind {
    pub fn into_str(self) -> &'static str {
        match self {
            Self::Zimo => "zimo",
            Self::Baozimo => "baozimo",
            Self::Dachut => "dachut"
        }
    }
}

pub type LogId = u32;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
pub struct Log {
    pub id: LogId,
    pub to: MemberId,
    pub from: Vec<MemberId>,
    pub points: i32,
    pub faan: Option<Faan>,
    pub win_kind: Option<WinKind>,
    pub datetime: Option<DateTime<Utc>>,
    pub round_wind: Option<Wind>,
    pub seat_wind: Option<Wind>,
    // other unaffected players on the table
    pub others: Option<Vec<MemberId>>,
    #[serde(default)] // false
    pub disabled: bool,
}

impl Log {
    pub fn get_points(&self) -> Option<i32> {
        // the number of points transferred from ONE loser to the winner
        // dachut: double the base points from loser to winner
        // baozimo: the same ^, but triple
        // zimo: for each loser, base points from loser to winner
        let points = match &self.faan {
            Some(faan) => faan.get_base_points(),
            None => Some(self.points)
        }?;
        match self.win_kind {
            Some(WinKind::Zimo) => Some(points),
            Some(WinKind::Dachut) => Some(points * 2),
            Some(WinKind::Baozimo) => Some(points * 3),
            None => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct Faan(i8);

impl Faan {
    // the base point amount is the amount a player loses from another's self-draw (zimo)
    // deal-in (dachut) is double this
    pub fn get_base_points(&self) -> Option<i32> {
        match self.0 {
            3 => Some(8),
            4 => Some(16),
            5 => Some(24),
            6 => Some(32),
            7 => Some(48),
            8 => Some(64),
            9 => Some(96),
            10 => Some(128),
            -10 => Some(-128), // penalty
            _ => None,
        }
    }
}

// player data
// overall structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MahjongData {
    pub tables: Vec<TableData>,
    pub members: Vec<Member>,
    pub log: Vec<Log>,
}

pub struct TableNotFoundError;

impl MahjongData {
    pub fn get_table_index(&self, table_no: TableNo) -> Result<usize, TableNotFoundError> {
        match self.tables.iter().position(|td| td.table_no == table_no) {
            Some(td) => Ok(td),
            None => Err(TableNotFoundError),
        }
    }
    pub fn default() -> Self {
        Self {
            tables: Vec::new(),
            members: Vec::new(),
            log: Vec::new(),
        }
    }
}
