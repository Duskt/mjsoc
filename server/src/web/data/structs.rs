use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

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

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct Faan(i8);

impl Faan {
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
            -10 => Some(-128),
            _ => None,
        }
    }

    pub fn get_points(&self, win_kind: Option<WinKind>) -> Option<i32> {
        // the number of points transferred from one loser to one winner
        // dachut: double the base points from loser to winner
        // baozimo: the same ^, but triple
        // zimo: for each loser, base points from loser to winner
        let raw_points = Faan::get_base_points(self)?;
        match win_kind {
            Some(WinKind::Zimo) => Some(raw_points),
            Some(WinKind::Dachut) => Some(raw_points * 2),
            Some(WinKind::Baozimo) => Some(raw_points * 3),
            None => None,
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
