use sqlx::{migrate::MigrateDatabase, Connection, Sqlite, SqliteConnection};
use std::path::PathBuf;

use crate::data::{
    mutator::{get_new_index, MahjongDataError, MahjongDataHandler, MahjongDataMutator},
    structs::{Faan, Log, MahjongData, Member, TableData, TableNo, TournamentData},
};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::data::structs::{LogId, MemberId, WinKind, Wind};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MemberRow {
    pub member_id: MemberId,
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
    pub faan: Option<Faan>,
    pub win_kind: Option<WinKind>,
    pub datetime: Option<DateTime<Utc>>,
    pub round_wind: Option<Wind>,
    pub seat_wind: Option<Wind>,
    #[serde(default)] // false
    pub disabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PointTransfer {
    pub log_id: LogId,
    pub points: i32,
    pub to_member: MemberId,
    pub from_member: MemberId,
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
    pub async fn setup(&self) {
        Sqlite::create_database(&format!("sqlite:{}", self.path.to_str().unwrap()))
            .await
            .expect("err");
        let mut conn = self.connect().await;
        // members, who exist independently of a particular session
        sqlx::query(
            "CREATE TABLE members(
                member_id INT NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                council INTEGER NOT NULL DEFAULT 0,
                session_points NUMERIC NOT NULL DEFAULT 0,
                total_points NUMERIC NOT NULL DEFAULT 0,
                registered INTEGER NOT NULL DEFAULT 0
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        // tables, dependent on member ids and used in a particular session
        sqlx::query(
            "CREATE TABLE mahjong_tables(
                table_no INT NOT NULL PRIMARY KEY,
                east INT DEFAULT NULL,
                south INT DEFAULT NULL,
                west INT DEFAULT NULL,
                north INT DEFAULT NULL,
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
                points NUMERIC NOT NULL,
                log_id INT NOT NULL,
                to_member INT NOT NULL,
                from_member INT NOT NULL,
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
                id INT NOT NULL PRIMARY KEY,
                win_kind TEXT NOT NULL,
                points NUMERIC,
                faan NUMERIC,
                datetime TEXT,
                round_wind TEXT,
                seat_wind TEXT,
                disabled INTEGER NOT NULL DEFAULT 0
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
    }

    async fn connect(&self) -> SqliteConnection {
        sqlx::SqliteConnection::connect(self.path.to_str().unwrap())
            .await
            .unwrap_or_else(|_| panic!("Couldn't connect to database at {}", self.path.display()))
    }

    pub async fn remake_log(conn: &mut SqliteConnection, lr: LogRow) -> Log {
        // Given a LogRow, reconstruct the Log which it represents
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
            self.setup().await;
        }
        // TODO: database_exists doesn't check if the file is a database, just if it exists
        let mut conn = self.connect().await;
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
                id: mr.member_id,
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

impl MahjongDataError for sqlx::Error {}

fn memberify(id: MemberId) -> Option<MemberId> {
    if id == 0 {
        None
    } else {
        Some(id)
    }
}

impl MahjongDataSqlite3 {
    pub async fn new_table(&self) -> Result<TableData, sqlx::Error> {
        // TODO: ASAP replace w/ much more efficient sqlite version
        let Ok(table) = self.load().await.new_table().await;
        let mut conn = self.connect().await;
        sqlx::query("INSERT INTO mahjong_tables (table_no) VALUES (?)")
            .bind(table.table_no)
            .execute(&mut conn)
            .await?;
        Ok(table)
    }

    pub async fn mut_table(
        &self,
        table_no: TableNo,
        new_table: TableData,
    ) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        sqlx::query("UPDATE mahjong_tables SET table_no = ?, east = ?, south = ?, west = ?, north = ? WHERE table_no = ?")
            .bind(new_table.table_no)
            .bind(memberify(new_table.east))
            .bind(memberify(new_table.south))
            .bind(memberify(new_table.west))
            .bind(memberify(new_table.north))
            .bind(table_no)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn del_table(&self, table_no: TableNo) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        sqlx::query("DELETE FROM mahjong_tables WHERE table_no = ?")
            .bind(table_no)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn get_member(&self, member_id: MemberId) -> Result<Member, sqlx::Error> {
        let mut conn = self.connect().await;
        let mr: MemberRow = sqlx::query_as("SELECT * FROM members WHERE member_id = ?")
            .bind(member_id)
            .fetch_one(&mut conn)
            .await?;
        Ok(Member {
            id: mr.member_id,
            name: mr.name,
            council: mr.council,
            tournament: TournamentData {
                total_points: mr.total_points,
                session_points: mr.session_points,
                registered: mr.registered,
            },
        })
    }

    pub async fn get_members(&self, member_ids: Vec<MemberId>) -> Result<Vec<Member>, sqlx::Error> {
        let mut result: Vec<Member> = Vec::new();
        for mid in member_ids {
            match self.get_member(mid).await {
                Ok(m) => result.push(m),
                Err(e) => return Err(e),
            }
        };
        Ok(result)
    }

    pub async fn new_member(&self, name: String) -> Result<Member, sqlx::Error> {
        let mut conn = self.connect().await;
        let member_ids: Vec<(MemberId,)> = sqlx::query_as("SELECT member_id FROM members;")
            .fetch_all(&mut conn)
            .await?;
        let new_id = get_new_index(member_ids.iter().map(|(td,)| *td).collect());
        sqlx::query("INSERT INTO members (member_id, name) VALUES (?, ?)")
            .bind(new_id)
            .bind(name.clone())
            .execute(&mut conn)
            .await?;
        // todo: use default impl for Member
        Ok(Member {
            id: new_id,
            name,
            council: false,
            tournament: TournamentData {
                total_points: 0,
                session_points: 0,
                registered: false,
            },
        })
    }

    // TODO FOR MUT AND DEL: UPDATE TABLES AS NEC
    pub async fn mut_member(
        &self,
        member_id: MemberId,
        new_member: Member,
    ) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        sqlx::query("UPDATE members SET member_id = ?, name = ?, council = ?, total_points = ?, session_points = ?, registered = ? WHERE member_id = ?")
            .bind(new_member.id)
            .bind(new_member.name)
            .bind(new_member.council)
            .bind(new_member.tournament.total_points)
            .bind(new_member.tournament.session_points)
            .bind(new_member.tournament.registered)
            .bind(member_id)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn add_member_session_points(&self, member_id: MemberId, point_increase: i32) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        let member = self.get_member(member_id).await?;
        sqlx::query("UPDATE members SET session_points = ? WHERE member_id = ?")
            .bind(member.tournament.session_points + point_increase)
            .bind(member_id)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn del_member(&self, member_id: MemberId) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        sqlx::query("DELETE FROM members WHERE member_id = ?")
            .bind(member_id)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn new_log(&self, lr: LogRow) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        sqlx::query("INSERT INTO logs (id, win_kind, points, faan, datetime, round_wind) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(lr.id)
            .bind(lr.win_kind)
            .bind(lr.points)
            .bind(lr.faan)
            .bind(lr.datetime)
            .bind(lr.round_wind)
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn new_point_transfer(&self, pt: PointTransfer) -> Result<(), sqlx::Error> {
        let mut conn = self.connect().await;
        sqlx::query("INSERT INTO point_transfers (points, log_id, to_member, from_member) VALUES (?, ?, ?, ?)")
            .bind(pt.points)
            .bind(pt.log_id)
            .bind(pt.to_member)
            .bind(pt.from_member)
            .execute(&mut conn)
            .await?;
        Ok(())
    }
}