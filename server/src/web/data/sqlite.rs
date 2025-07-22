use sqlx::{migrate::MigrateDatabase, Connection, Sqlite, SqliteConnection};
use std::path::PathBuf;

use crate::data::{
    mutator::{MahjongDataHandler, MahjongDataMutator},
    structs::{Log, MahjongData, Member, TableData, TableNo, TournamentData},
};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::data::structs::{LogId, MemberId, WinKind, Wind};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MemberRow {
    pub id: MemberId,
    pub name: String,
    #[serde(default)]
    pub council: bool,
    pub total_points: i32,
    pub session_points: i32,
    pub registered: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LogRow {
    pub id: LogId,
    pub points: i32,
    pub faan: Option<i8>,
    pub win_kind: Option<WinKind>,
    pub datetime: Option<DateTime<Utc>>,
    pub round_wind: Option<Wind>,
    pub seat_wind: Option<Wind>,
    #[serde(default)] // false
    pub disabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PointTransfer {
    log_id: LogId,
    points: i32,
    to_member: MemberId,
    from_member: MemberId,
}

pub struct MahjongDataSqlite3 {
    pub path: PathBuf,
}

fn canonicalize_parent(path: &str) -> PathBuf {
    // this path may not exist, but the parent path must exist
    let path = PathBuf::from(path);
    // split into final component and parent (everything before) and resolve the parent
    let dest = path.file_name().unwrap();
    let parent = path
        .parent()
        .unwrap()
        .canonicalize()
        .expect("Failed to canoncalicalziele");
    parent.join(dest)
}

impl MahjongDataSqlite3 {
    pub fn from_str(path: &str) -> Self {
        let path = canonicalize_parent(path);
        MahjongDataSqlite3 { path }
    }
    /* MahjongDataSqlite3 { path } or from_str will refer to an existing database. MahjongDataSqlite3::new(path)
    or new_from_str will set up a new database, and error if it already exists.*/
    pub async fn new(path: &PathBuf) -> Self {
        Sqlite::create_database(&format!("sqlite:{}", path.to_str().unwrap()))
            .await
            .expect("err");
        let mut conn = MahjongDataSqlite3::connect(path).await;
        // members, who exist independently of a particular session
        sqlx::query(
            "CREATE TABLE members(
                member_id INT PRIMARY KEY,
                name TEXT,
                council INTEGER,
                session_points NUMERIC,
                total_points NUMERIC,
                registered INTEGER
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        // tables, dependent on member ids and used in a particular session
        sqlx::query(
            "CREATE TABLE mahjong_tables(
                table_no INT PRIMARY KEY,
                east INT,
                south INT,
                west INT,
                north INT,
                FOREIGN KEY(east) REFERENCES members(member_id),
                FOREIGN KEY(south) REFERENCES members(member_id),
                FOREIGN KEY(west) REFERENCES members(member_id),
                FOREIGN KEY(north) REFERENCES members(member_id)
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        // point transfers are linked to a certain log, acting like an array
        sqlx::query(
            "CREATE TABLE point_transfers(
                points NUMERIC,
                log_id INT,
                to_member INT,
                from_member INT,
                FOREIGN KEY(log_id) REFERENCES logs(id),
                FOREIGN KEY(to_member) REFERENCES members(member_id),
                FOREIGN KEY(from_member) REFERENCES MEMBERS(member_id)
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        // logs, to which point transfers are attached
        sqlx::query(
            "CREATE TABLE logs(
                id INT PRIMARY KEY,
                win_kind TEXT,
                points NUMERIC,
                faan NUMERIC,
                datetime TEXT,
                round_wind TEXT,
                seat_wind TEXT,
                disabled INTEGER
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        MahjongDataSqlite3 {
            path: path.to_path_buf(),
        }
    }

    pub async fn new_from_str(path: &str) -> Self {
        let path = canonicalize_parent(path);
        MahjongDataSqlite3::new(&path).await
    }

    async fn connect(path: &PathBuf) -> SqliteConnection {
        sqlx::SqliteConnection::connect(path.to_str().unwrap())
            .await
            .unwrap_or_else(|_| panic!("Couldn't connect to database at {}", path.display()))
    }

    pub async fn remake_log(conn: &mut SqliteConnection, lr: LogRow) -> Log {
        let point_transfers =
            sqlx::query_as::<_, PointTransfer>("SELECT * FROM point_transfers WHERE log_id = ?")
                .bind(lr.id)
                .fetch_all(conn)
                .await
                .unwrap();
        let to_member = point_transfers.first().unwrap().to_member;
        let from_member = point_transfers
            .iter()
            .filter(|pt| pt.points > 0)
            .map(|pt| pt.from_member)
            .collect();
        let others: Vec<u32> = point_transfers
            .iter()
            .filter(|pt| pt.points == 0)
            .map(|pt| pt.from_member)
            .collect();
        Log {
            id: lr.id,
            to: to_member,
            from: from_member,
            points: lr.points,
            faan: lr.faan,
            win_kind: lr.win_kind,
            datetime: lr.datetime,
            round_wind: lr.round_wind,
            seat_wind: lr.seat_wind,
            others: Some(others),
            disabled: lr.disabled,
        }
    }

    pub async fn load(&self) -> MahjongData {
        if !(Sqlite::database_exists(self.path.to_str().unwrap())
            .await
            .unwrap_or_else(|_| panic!("Parent path of {} does not exist.", self.path.display())))
        {
            println!("Creating new sqlite database...");
            MahjongDataSqlite3::new(&self.path).await;
        }
        // TODO: database_exists doesn't check if the file is a database, just if it exists
        let mut conn = MahjongDataSqlite3::connect(&self.path).await;
        let tables = sqlx::query_as::<_, TableData>("SELECT * FROM mahjong_tables;")
            .fetch_all(&mut conn)
            .await
            .unwrap();
        let members = sqlx::query_as::<_, MemberRow>("SELECT * FROM members;")
            .fetch_all(&mut conn)
            .await
            .unwrap()
            .into_iter()
            .map(|mr| Member {
                id: mr.id,
                name: mr.name,
                council: mr.council,
                tournament: TournamentData {
                    total_points: mr.total_points,
                    session_points: mr.session_points,
                    registered: mr.registered,
                },
            })
            .collect();
        let logrows = sqlx::query_as::<_, LogRow>("SELECT * FROM logs;")
            .fetch_all(&mut conn)
            .await
            .unwrap();
        // this might be possible with SQL joins
        // todo: learn how to do this functionally with map and future::join_all
        let mut log: Vec<Log> = Vec::new();
        for lr in logrows {
            log.push(MahjongDataSqlite3::remake_log(&mut conn, lr).await)
        }
        MahjongData {
            tables,
            members,
            log,
        }
    }
}

impl MahjongDataHandler<sqlx::Error, sqlx::Error> for MahjongDataSqlite3 {
    async fn new_table(&self) -> Result<TableData, sqlx::Error> {
        // TODO: ASAP replace w/ much more efficient sqlite version
        let Ok(table) = self.load()
            .await
            .new_table()
            .await;
        let mut conn = MahjongDataSqlite3::connect(&self.path).await;
        sqlx::query("INSERT INTO mahjong_tables (table_no) VALUES (?)")
            .bind(table.table_no)
            .execute(&mut conn)
            .await?;
        Ok(table)
    }

    async fn mut_table(
        &self,
        table_no: TableNo,
        new_table: TableData,
    ) -> Result<(), sqlx::Error> {
        let mut conn = MahjongDataSqlite3::connect(&self.path).await;
        sqlx::query("UPDATE tables SET table_no = ?, east = ?, south = ?, west = ?, north = ? WHERE table_no = ?")
            .bind(new_table.table_no)
            .bind(new_table.east)
            .bind(new_table.south)
            .bind(new_table.west)
            .bind(new_table.north)
            .bind(table_no)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    async fn del_table(&self, table_no: TableNo) -> Result<(), sqlx::Error> {
        let mut conn = MahjongDataSqlite3::connect(&self.path).await;
        sqlx::query("DELETE FROM mahjong_tables WHERE table_no = ?")
            .bind(table_no)
            .execute(&mut conn)
            .await?;
        Ok(())
    }
}
