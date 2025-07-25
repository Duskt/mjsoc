use sqlx::{
    migrate::MigrateDatabase, query::QueryAs, sqlite::SqlitePoolOptions, Connection, Sqlite,
    SqlitePool,
};
use std::path::PathBuf;

use crate::data::{
    errors::MahjongDataError,
    mutator::{get_new_index, MahjongDataMutator},
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

impl From<MemberRow> for Member {
    fn from(value: MemberRow) -> Self {
        Member {
            id: value.member_id,
            name: value.name,
            tournament: TournamentData {
                total_points: value.total_points,
                session_points: value.session_points,
                registered: value.registered,
            },
            council: value.council,
        }
    }
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

impl LogRow {
    fn into_log(self, point_transfers: Vec<PointTransfer>) -> Log {
        let to_member = point_transfers.first().unwrap().to_member;
        let (bystander_transfers, loss_transfers): (Vec<PointTransfer>, Vec<PointTransfer>) =
            point_transfers.into_iter().partition(|pt| pt.points == 0);
        Log {
            to: to_member,
            from: loss_transfers.iter().map(|pt| pt.from_member).collect(),
            others: Some(
                bystander_transfers
                    .iter()
                    .map(|pt| pt.from_member)
                    .collect(),
            ),
            id: self.id,
            points: self.points,
            faan: self.faan,
            win_kind: self.win_kind,
            datetime: self.datetime,
            round_wind: self.round_wind,
            seat_wind: self.seat_wind,
            disabled: self.disabled,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PointTransfer {
    pub log_id: LogId,
    pub points: i32,
    pub to_member: MemberId,
    pub from_member: MemberId,
}

pub enum PointTransferTarget {
    To(MemberId),
    From(MemberId),
}

pub struct MahjongDataSqlite3 {
    //pub path: PathBuf,
    pub pool: SqlitePool,
}

impl MahjongDataSqlite3 {
    pub async fn new(path: impl Into<PathBuf>) -> Self {
        // resolve the path
        let path: PathBuf = path.into();
        let dest = path.file_name().expect("Path must refer to a file.");
        let parent = path.parent().unwrap().canonicalize().unwrap();
        let resolved_path = parent.join(dest);
        MahjongDataSqlite3 {
            pool: MahjongDataSqlite3::get_pool(&resolved_path).await,
        }
    }

    pub async fn get_pool(path: &PathBuf) -> SqlitePool {
        MahjongDataSqlite3::check_exists(path).await;
        SqlitePoolOptions::new()
            .max_connections(2)
            .min_connections(0)
            .connect(path.to_str().unwrap())
            .await
            .unwrap()
    }

    pub async fn check_exists(path: &PathBuf) {
        if !(Sqlite::database_exists(path.to_str().unwrap())
            .await
            .unwrap_or_else(|_| panic!("Parent path of {} does not exist.", path.display())))
        {
            println!("Creating new sqlite database...");
            MahjongDataSqlite3::setup(path).await;
        }
    }

    pub async fn setup(path: &PathBuf) {
        Sqlite::create_database(&format!("sqlite:{}", path.to_str().unwrap()))
            .await
            .expect("err");
        let mut conn = sqlx::SqliteConnection::connect(path.to_str().unwrap())
            .await
            .unwrap();
        // members, who exist independently of a particular session
        sqlx::query(
            "CREATE TABLE members(
                member_id INTEGER NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                council INTEGER NOT NULL DEFAULT 0,
                session_points INTEGER NOT NULL DEFAULT 0,
                total_points INTEGER NOT NULL DEFAULT 0,
                registered INTEGER NOT NULL DEFAULT 0
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        // tables, dependent on member ids and used in a particular session
        sqlx::query(
            "CREATE TABLE mahjong_tables(
                table_no INTEGER NOT NULL PRIMARY KEY,
                east INTEGER DEFAULT NULL,
                south INTEGER DEFAULT NULL,
                west INTEGER DEFAULT NULL,
                north INTEGER DEFAULT NULL,
                FOREIGN KEY(east) REFERENCES members(member_id),
                FOREIGN KEY(south) REFERENCES members(member_id),
                FOREIGN KEY(west) REFERENCES members(member_id),
                FOREIGN KEY(north) REFERENCES members(member_id)
            );",
        )
        .execute(&mut conn)
        .await
        .unwrap();
        // point transfers are linked to a certain log, acting like an array. to_ and from_ can be
        // NULL, indicating a since-deleted member
        sqlx::query(
            "CREATE TABLE point_transfers(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                points NUMERIC NOT NULL,
                log_id INTEGER NOT NULL,
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
                id INTEGER NOT NULL PRIMARY KEY,
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
}

impl MahjongDataSqlite3 {
    pub async fn remake_log(&self, lr: LogRow) -> Log {
        // Given a LogRow, reconstruct the Log which it represents
        let point_transfers =
            sqlx::query_as::<_, PointTransfer>("SELECT * FROM point_transfers WHERE log_id = ?")
                .bind(lr.id)
                .fetch_all(&self.pool)
                .await
                .unwrap();
        lr.into_log(point_transfers)
    }

    pub async fn load(&self) -> MahjongData {
        // TODO: database_exists doesn't check if the file is a database, just if it exists
        let tables = sqlx::query_as::<_, TableData>("SELECT * FROM mahjong_tables;")
            .fetch_all(&self.pool)
            .await
            .unwrap();
        let members = sqlx::query_as::<_, MemberRow>("SELECT * FROM members;")
            .fetch_all(&self.pool)
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
            .fetch_all(&self.pool)
            .await
            .unwrap();
        // this might be possible with SQL joins
        // todo: learn how to do this functionally with map and future::join_all
        let mut log: Vec<Log> = Vec::new();
        for lr in logrows {
            log.push(self.remake_log(lr).await)
        }
        MahjongData {
            tables,
            members,
            log,
        }
    }
}

impl MahjongDataSqlite3 {
    // hm, this seems a little verbose... and incomprehensible...
    pub async fn get_single_match<'q, O>(
        &self,
        query: QueryAs<'q, Sqlite, O, sqlx::sqlite::SqliteArguments<'q>>,
    ) -> Result<O, MahjongDataError>
    where
        O: Send + Unpin + for<'r> FromRow<'r, <sqlx::Sqlite as sqlx::Database>::Row>,
    {
        let result = query.fetch_all(&self.pool).await;
        let mut matches = match result {
            Err(e) => return Err(MahjongDataError::Unknown(e)),
            Ok(r) => r,
        };
        if matches.len() > 1 {
            return Err(MahjongDataError::DuplicatesFound);
        }
        match matches.pop() {
            Some(r) => Ok(r),
            None => Err(MahjongDataError::ReferenceNotFound),
        }
    }
}

fn memberify(id: MemberId) -> Option<MemberId> {
    if id == 0 {
        None
    } else {
        Some(id)
    }
}

// you could combine these into one trait which takes three generic parameters -
// if you could figure out the syntax which rust wants you to use for specifying the
// ambiguity. something like <Struct as Trait<A, B, C>>::method?
// imo far too many special patterns in rust's syntax spec. sorry!
pub trait MembersMutator {
    async fn new_member(&self, new_entry_data: String) -> Result<Member, MahjongDataError>;
    async fn mut_member(
        &self,
        entry_id: MemberId,
        new_entry: Member,
    ) -> Result<(), MahjongDataError>;
    async fn del_member(&self, entry_id: MemberId) -> Result<(), MahjongDataError>;
}

pub trait TablesMutator {
    async fn new_table(&self) -> Result<TableData, MahjongDataError>;
    async fn mut_table(
        &self,
        entry_id: TableNo,
        new_entry: TableData,
    ) -> Result<(), MahjongDataError>;
    async fn mut_table_seat(
        &self,
        entry_id: TableNo,
        seat: Wind,
        new_value: MemberId,
    ) -> Result<(), MahjongDataError>;
    async fn mut_seat(
        &self,
        member_id: MemberId,
        seat: Wind,
        new_value: Option<MemberId>,
    ) -> Result<(), MahjongDataError>;
    async fn del_table(&self, entry_id: TableNo) -> Result<(), MahjongDataError>;
}

impl TablesMutator for MahjongDataSqlite3 {
    async fn new_table(&self) -> Result<TableData, MahjongDataError> {
        // TODO: ASAP replace w/ much more efficient sqlite version
        let Ok(table) = self.load().await.new_table().await;
        if let Err(e) = sqlx::query("INSERT INTO mahjong_tables (table_no) VALUES (?)")
            .bind(table.table_no)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(table)
    }

    async fn mut_table(
        &self,
        table_no: TableNo,
        new_table: TableData,
    ) -> Result<(), MahjongDataError> {
        // sqlx doesn't support bulk inserts (apart from in Postgres, which has native arrays)
        if let Err(e) = sqlx::query("UPDATE mahjong_tables SET table_no = ?, east = ?, south = ?, west = ?, north = ? WHERE table_no = ?")
            .bind(new_table.table_no)
            .bind(memberify(new_table.east))
            .bind(memberify(new_table.south))
            .bind(memberify(new_table.west))
            .bind(memberify(new_table.north))
            .bind(table_no)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e))
        }
        Ok(())
    }

    async fn mut_table_seat(
        &self,
        table_no: TableNo,
        seat: Wind,
        new_value: MemberId,
    ) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("UPDATE mahjong_tables SET ? = ? WHERE table_no = ?")
            .bind(seat.into_str())
            .bind(new_value)
            .bind(table_no)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(())
    }

    async fn mut_seat(
        &self,
        member_id: MemberId,
        seat: Wind,
        new_value: Option<MemberId>,
    ) -> Result<(), MahjongDataError> {
        let statement = match seat {
            Wind::East => "UPDATE mahjong_tables SET east = ? WHERE east = ?",
            Wind::South => "UPDATE mahjong_tables SET south = ? WHERE south = ?",
            Wind::West => "UPDATE mahjong_tables SET west = ? WHERE west = ?",
            Wind::North => "UPDATE mahjong_tables SET north = ? WHERE north = ?"
        };
        let query = match new_value {
            Some(mid) => sqlx::query(statement).bind(mid),
            None => sqlx::query(statement).bind(None::<u32>),
        };
        if let Err(e) = query
            .bind(member_id)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(())
    }

    async fn del_table(&self, table_no: TableNo) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("DELETE FROM mahjong_tables WHERE table_no = ?")
            .bind(table_no)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(())
    }
}

impl MembersMutator for MahjongDataSqlite3 {
    async fn new_member(&self, name: String) -> Result<Member, MahjongDataError> {
        let member_ids = match sqlx::query_as("SELECT member_id FROM members;")
            .fetch_all(&self.pool)
            .await
        {
            Ok(v) => v,
            Err(e) => return Err(MahjongDataError::Unknown(e)),
        };
        let new_id = get_new_index(member_ids.iter().map(|(td,)| *td).collect());
        if let Err(e) = sqlx::query("INSERT INTO members (member_id, name) VALUES (?, ?)")
            .bind(new_id)
            .bind(name.clone())
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
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

    async fn mut_member(
        &self,
        member_id: MemberId,
        new_member: Member,
    ) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("UPDATE members SET member_id = ?, name = ?, council = ?, total_points = ?, session_points = ?, registered = ? WHERE member_id = ?")
            .bind(new_member.id)
            .bind(new_member.name)
            .bind(new_member.council)
            .bind(new_member.tournament.total_points)
            .bind(new_member.tournament.session_points)
            .bind(new_member.tournament.registered)
            .bind(member_id)
            .execute(&self.pool)
            .await {
                return Err(MahjongDataError::Unknown(e))
            }
        Ok(())
    }
    async fn del_member(&self, member_id: MemberId) -> Result<(), MahjongDataError> {
        // remove the member from tables...
        for wind in Wind::all() {
            self.mut_seat(member_id, wind, Option::None).await?;
        }
        // remove the member from point transfers...
        self.mut_point_transfer_target(PointTransferTarget::To(member_id), Option::None)
            .await?;
        self.mut_point_transfer_target(PointTransferTarget::From(member_id), Option::None)
            .await?;
        if let Err(e) = sqlx::query("DELETE FROM members WHERE member_id = ?")
            .bind(member_id)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(())
    }
}

// MEMBERS
impl MahjongDataSqlite3 {
    pub async fn get_member(&self, member_id: MemberId) -> Result<Member, MahjongDataError> {
        let mr: MemberRow = self
            .get_single_match(
                sqlx::query_as("SELECT * FROM members WHERE member_id = ?").bind(member_id),
            )
            .await?;
        Ok(mr.into())
    }

    pub async fn get_members(
        &self,
        member_ids: Vec<MemberId>,
    ) -> Result<Vec<Member>, MahjongDataError> {
        let mut result: Vec<Member> = Vec::new();
        for mid in member_ids {
            match self.get_member(mid).await {
                Ok(r) => result.push(r),
                Err(e) => return Err(e),
            }
        }
        Ok(result)
    }

    pub async fn add_member_session_points(
        &self,
        member_id: MemberId,
        point_increase: i32,
    ) -> Result<(), MahjongDataError> {
        let member = self.get_member(member_id).await?;
        if let Err(e) = sqlx::query("UPDATE members SET session_points = ? WHERE member_id = ?")
            .bind(member.tournament.session_points + point_increase)
            .bind(member_id)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(())
    }

    pub async fn get_point_transfers(
        &self,
        log_id: LogId,
    ) -> Result<Vec<PointTransfer>, MahjongDataError> {
        let transfers = match sqlx::query_as("SELECT * FROM point_transfers WHERE log_id = ?")
            .bind(log_id)
            .fetch_all(&self.pool)
            .await
        {
            Ok(r) => r,
            Err(e) => return Err(MahjongDataError::Unknown(e)),
        };
        Ok(transfers)
    }

    pub async fn new_log(&self, lr: LogRow) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("INSERT INTO logs (id, win_kind, points, faan, datetime, round_wind) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(lr.id)
            .bind(lr.win_kind)
            .bind(lr.points)
            .bind(lr.faan)
            .bind(lr.datetime)
            .bind(lr.round_wind)
            .execute(&self.pool)
            .await {
                return match e {
                    // todo: i think some non-trivial errors are possible here
                    _ => Err(MahjongDataError::Unknown(e))
                }
            }
        Ok(())
    }

    pub async fn new_point_transfer(&self, pt: PointTransfer) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("INSERT INTO point_transfers (points, log_id, to_member, from_member) VALUES (?, ?, ?, ?)")
            .bind(pt.points)
            .bind(pt.log_id)
            .bind(pt.to_member)
            .bind(pt.from_member)
            .execute(&self.pool)
            .await {
                return match e {
                    _ => Err(MahjongDataError::Unknown(e))
                }
            }
        Ok(())
    }

    pub async fn mut_point_transfer_target(
        &self,
        target: PointTransferTarget,
        new_value: Option<MemberId>,
    ) -> Result<(), MahjongDataError> {
        let (statement, target_id) = match target {
            PointTransferTarget::To(i) => ("UPDATE point_transfers SET to_member = ? WHERE to_member = ?", i),
            PointTransferTarget::From(i) => ("UPDATE point_transfers SET from_member = ? WHERE from_member = ?", i),
        };
        let query = sqlx::query(statement);
        let query = match new_value {
            Some(mid) => query.bind(mid),
            None => query.bind(None::<u32>),
        };
        if let Err(e) = query
            .bind(target_id)
            .execute(&self.pool)
            .await {
                return match e {
                    // todo: foreign key constraint err
                    _ => Err(MahjongDataError::Unknown(e))
                }
            }
        Ok(())
    }

    pub async fn disable_log(&self, log_id: LogId) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("UPDATE logs SET disabled = true WHERE id = ?;")
            .bind(log_id)
            .execute(&self.pool)
            .await {
                return Err(MahjongDataError::Unknown(e))
            };
        Ok(())
    }
}
