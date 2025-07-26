use sqlx::{
    migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Connection, Sqlite,
    SqlitePool,
};
use std::path::PathBuf;

use crate::data::{
    errors::MahjongDataError,
    mutator::{get_new_index, MahjongDataMutator},
    structs::{EntryId, Faan, Log, MahjongData, Member, TableData, TableNo, TournamentData},
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
    pub pool: SqlitePool,
}

// creation, setup, and extremely general implementations
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
        if !(MahjongDataSqlite3::exists(path).await) {
            println!("Creating new sqlite database...");
            MahjongDataSqlite3::setup(path).await;
        };
        SqlitePoolOptions::new()
            .max_connections(2)
            .min_connections(0)
            .connect(path.to_str().unwrap())
            .await
            .unwrap()
    }

    pub async fn exists(path: &PathBuf) -> bool {
        if !(Sqlite::database_exists(path.to_str().unwrap())
            .await
            .unwrap_or_else(|_| panic!("Parent path of {} does not exist.", path.display())))
        {
            return false;
        }

        let Some(file_name) = path.file_name() else {
            return false;
        };
        let Some(file_name_str) = file_name.to_str() else {
            return false;
        };
        file_name_str.ends_with(".db")
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

    pub async fn load(&self) -> MahjongData {
        MahjongData {
            tables: self.get_tables(None).await.unwrap(),
            members: self.get_members(None).await.unwrap(),
            log: self.get_logs(None).await.unwrap(),
        }
    }

    pub async fn get_entry<
        O: Send + Unpin + for<'r> FromRow<'r, <sqlx::Sqlite as sqlx::Database>::Row>,
    >(
        &self,
        entry: EntryId,
    ) -> Result<O, MahjongDataError> {
        let (sqlite_table, entry_id_name, entry_id) = entry.get_table_key_value();
        // only formatting statically known strings - user values are bound!
        let statement = format!("SELECT * FROM {sqlite_table} WHERE {entry_id_name} = ?");
        let query = sqlx::query_as(&statement).bind(entry_id);
        let result = query.fetch_all(&self.pool).await;
        let mut matches = match result {
            Err(e) => return Err(MahjongDataError::Unknown(e)),
            Ok(r) => r,
        };
        if matches.len() > 1 {
            return Err(MahjongDataError::DuplicatesFound(entry));
        }
        match matches.pop() {
            Some(r) => Ok(r),
            None => Err(MahjongDataError::ReferenceNotFound(entry)),
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

pub trait MembersMutator: LogMutator {
    async fn get_member(&self, entry_id: MemberId) -> Result<Member, MahjongDataError>;
    async fn get_members(
        &self,
        entry_ids: Option<Vec<MemberId>>,
    ) -> Result<Vec<Member>, MahjongDataError>;
    async fn new_member(&self, new_entry_data: String) -> Result<Member, MahjongDataError>;
    async fn mut_member(
        &self,
        entry_id: MemberId,
        mutation: MemberMutation,
    ) -> Result<Option<bool>, MahjongDataError>;
    async fn del_member(&self, entry_id: MemberId) -> Result<(), MahjongDataError>;
}

pub enum MemberMutation {
    All(Member),
    AddPoints(i32),
    Register(Option<bool>),
}

pub trait TablesMutator {
    async fn get_table(&self, table_no: TableNo) -> Result<TableData, MahjongDataError>;
    async fn get_tables(
        &self,
        table_nos: Option<Vec<TableNo>>,
    ) -> Result<Vec<TableData>, MahjongDataError>;
    async fn new_table(&self) -> Result<TableData, MahjongDataError>;
    async fn mut_table(
        &self,
        entry_id: TableNo,
        new_entry: TableData,
    ) -> Result<(), MahjongDataError>;
    //async fn mut_table_seat(&self, entry_id: TableNo, seat: Wind, new_value: MemberId) -> Result<(), MahjongDataError>;
    async fn mut_seat(
        &self,
        member_id: MemberId,
        seat: Wind,
        new_value: Option<MemberId>,
    ) -> Result<(), MahjongDataError>;
    async fn del_table(&self, entry_id: TableNo) -> Result<(), MahjongDataError>;
}

pub enum TableMutation {
    ReplaceSatMember {
        member_id: MemberId,
        seat: Wind,
        new_member: Option<MemberId>,
    },
}

pub trait LogMutator {
    async fn get_log(&self, log_id: LogId) -> Result<Log, MahjongDataError>;
    async fn get_logs(&self, log_ids: Option<Vec<LogId>>) -> Result<Vec<Log>, MahjongDataError>;
    // not 'new' because that's more ambiguous as to whether the points are transferred in this method (they aren't)
    async fn record_log(&self, log: Log) -> Result<(), MahjongDataError>;
    async fn mut_log(&self, mutation: LogMutation) -> Result<Option<bool>, MahjongDataError>;
}

pub enum LogMutation {
    ToggleDisabled{log_id: LogId, new_value: Option<bool>},
    ReplaceReferencesToMember{old_member_id: MemberId, new_member_id: Option<MemberId>},
}

impl TablesMutator for MahjongDataSqlite3 {
    async fn get_table(&self, table_no: TableNo) -> Result<TableData, MahjongDataError> {
        self.get_entry(EntryId::Table(table_no)).await
    }

    async fn get_tables(
        &self,
        table_nos: Option<Vec<TableNo>>,
    ) -> Result<Vec<TableData>, MahjongDataError> {
        let Some(table_nos) = table_nos else {
            return match sqlx::query_as("SELECT * FROM mahjong_tables;")
                .fetch_all(&self.pool)
                .await
            {
                Ok(r) => Ok(r),
                Err(e) => Err(MahjongDataError::Unknown(e)),
            };
        };
        let mut result: Vec<TableData> = Vec::new();
        for tn in table_nos {
            match self.get_table(tn).await {
                Ok(td) => result.push(td),
                Err(e) => return Err(e),
            }
        }
        Ok(result)
    }

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

    /*
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
    */

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
            Wind::North => "UPDATE mahjong_tables SET north = ? WHERE north = ?",
        };
        let query = match new_value {
            Some(mid) => sqlx::query(statement).bind(mid),
            None => sqlx::query(statement).bind(None::<u32>),
        };
        if let Err(e) = query.bind(member_id).execute(&self.pool).await {
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

// helpers for MembersMutator
impl MahjongDataSqlite3 {
    async fn _mut_entire_member(
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
    async fn _mut_member_points(
        &self,
        member_id: MemberId,
        points: u32,
    ) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("UPDATE members SET session_points = ? WHERE member_id = ?")
            .bind(points)
            .bind(member_id)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        }
        Ok(())
    }

    async fn _add_member_points(
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

    async fn _mut_member_registered(
        &self,
        member_id: MemberId,
        new_value: Option<bool>,
    ) -> Result<bool, MahjongDataError> {
        // todo: DRY w/ mut_log_disabled
        let new_value = new_value.unwrap_or({
            let (is_disabled,): (bool,) =
                match sqlx::query_as("SELECT registered FROM members WHERE member_id = ?;")
                    .bind(member_id)
                    .fetch_one(&self.pool)
                    .await
                {
                    Ok(r) => r,
                    Err(e) => {
                        return Err(match e {
                            sqlx::Error::RowNotFound => {
                                MahjongDataError::ReferenceNotFound(EntryId::Member(member_id))
                            }
                            _ => MahjongDataError::Unknown(e),
                        })
                    }
                };
            !is_disabled
        });
        if let Err(e) = sqlx::query("UPDATE members SET registered = ? WHERE member_id = ?;")
            .bind(new_value)
            .bind(member_id)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        };
        Ok(new_value)
    }
}

impl MembersMutator for MahjongDataSqlite3 {
    async fn mut_member(
        &self,
        entry_id: MemberId,
        mutation: MemberMutation,
    ) -> Result<Option<bool>, MahjongDataError> {
        match mutation {
            MemberMutation::All(new_member) => {
                match self._mut_entire_member(entry_id, new_member).await {
                    Ok(_) => Ok(None),
                    Err(e) => Err(e),
                }
            }
            MemberMutation::Register(new_value) => {
                match self._mut_member_registered(entry_id, new_value).await {
                    Ok(r) => Ok(Some(r)),
                    Err(e) => Err(e),
                }
            }
            MemberMutation::AddPoints(points) => {
                match self._add_member_points(entry_id, points).await {
                    Ok(_) => Ok(None),
                    Err(e) => Err(e),
                }
            }
        }
    }

    async fn get_member(&self, member_id: MemberId) -> Result<Member, MahjongDataError> {
        let mr: MemberRow = self.get_entry(EntryId::Member(member_id)).await?;
        Ok(mr.into())
    }

    async fn get_members(
        &self,
        member_ids: Option<Vec<MemberId>>,
    ) -> Result<Vec<Member>, MahjongDataError> {
        let Some(member_ids) = member_ids else {
            return match sqlx::query_as("SELECT * FROM members;")
                .fetch_all(&self.pool)
                .await
            {
                Ok(r) => Ok(r.into_iter().map(|mr: MemberRow| mr.into()).collect()),
                Err(e) => Err(MahjongDataError::Unknown(e)),
            };
        };
        let mut result: Vec<Member> = Vec::new();
        for mid in member_ids {
            match self.get_member(mid).await {
                Ok(r) => result.push(r),
                Err(e) => return Err(e),
            }
        }
        Ok(result)
    }

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

    async fn del_member(&self, member_id: MemberId) -> Result<(), MahjongDataError> {
        // remove the member from tables...
        for wind in Wind::all() {
            self.mut_seat(member_id, wind, Option::None).await?;
        }
        // remove the member from point transfers...
        self.mut_log(LogMutation::ReplaceReferencesToMember { old_member_id: member_id, new_member_id: None }).await?;
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

// helpers for LogMutator
impl MahjongDataSqlite3 {
    async fn get_log_point_transfers(
        &self,
        log_id: LogId,
    ) -> Result<Vec<PointTransfer>, MahjongDataError> {
        match sqlx::query_as("SELECT * FROM point_transfers WHERE id = ?;")
            .bind(log_id)
            .fetch_all(&self.pool)
            .await
        {
            Ok(r) => Ok(r),
            Err(e) => Err(MahjongDataError::Unknown(e)),
        }
    }

    async fn record_point_transfer(
        &self,
        point_transfer: PointTransfer,
    ) -> Result<(), MahjongDataError> {
        if let Err(e) = sqlx::query("INSERT INTO point_transfers (points, log_id, to_member, from_member) VALUES (?, ?, ?, ?)")
            .bind(point_transfer.points)
            .bind(point_transfer.log_id)
            .bind(point_transfer.to_member)
            .bind(point_transfer.from_member)
            .execute(&self.pool)
            .await {
                return match e {
                    sqlx::Error::Database(dbe) if dbe.kind() == sqlx::error::ErrorKind::ForeignKeyViolation => Err(MahjongDataError::ForeignConstraint(EntryId::Log(point_transfer.log_id))),
                    _ => Err(MahjongDataError::Unknown(e))
                }
            }
        Ok(())
    }

    async fn _mut_log_disabled(
        &self,
        log_id: LogId,
        new_value: Option<bool>,
    ) -> Result<bool, MahjongDataError> {
        let new_value = new_value.unwrap_or({
            // todo low: use fetch_all then verify is one instead of fetch_one
            let (is_disabled,): (bool,) =
                match sqlx::query_as("SELECT disabled FROM logs WHERE id = ?;")
                    .bind(log_id)
                    .fetch_one(&self.pool)
                    .await
                {
                    Ok(r) => r,
                    Err(e) => {
                        return Err(match e {
                            sqlx::Error::RowNotFound => {
                                MahjongDataError::ReferenceNotFound(EntryId::Log(log_id))
                            }
                            _ => MahjongDataError::Unknown(e),
                        })
                    }
                };
            !is_disabled
        });
        if let Err(e) = sqlx::query("UPDATE logs SET disabled = ? WHERE id = ?;")
            .bind(new_value)
            .bind(log_id)
            .execute(&self.pool)
            .await
        {
            return Err(MahjongDataError::Unknown(e));
        };
        Ok(new_value)
    }

    pub async fn _mut_log_references_to_member(
        &self,
        member_id: MemberId,
        new_value: Option<MemberId>,
    ) -> Result<(), MahjongDataError> {
        for statement in ["UPDATE point_transfers SET to_member = ? WHERE to_member = ?", "UPDATE point_transfers SET from_member = ? WHERE from_member = ?"] {
            let query = sqlx::query(statement);
            let query = match new_value {
                Some(mid) => query.bind(mid),
                None => query.bind(None::<u32>),
            };
            if let Err(e) = query.bind(member_id).execute(&self.pool).await {
                return match e {
                    sqlx::Error::Database(dbe) if dbe.kind() == sqlx::error::ErrorKind::ForeignKeyViolation => Err(MahjongDataError::ForeignConstraint(EntryId::Member(member_id))),
                    _ => Err(MahjongDataError::Unknown(e)),
                };
            }
        }
        Ok(())
    }
}

impl LogMutator for MahjongDataSqlite3 {
    async fn get_log(&self, log_id: LogId) -> Result<Log, MahjongDataError> {
        let lr: LogRow = self.get_entry(EntryId::Log(log_id)).await?;
        let pts = self.get_log_point_transfers(log_id).await?;
        Ok(lr.into_log(pts))
    }

    async fn get_logs(&self, log_ids: Option<Vec<LogId>>) -> Result<Vec<Log>, MahjongDataError> {
        if let Some(provided) = log_ids {
            let mut result = Vec::new();
            for lid in provided {
                match self.get_log(lid).await {
                    Ok(l) => result.push(l),
                    Err(e) => return Err(e),
                };
            }
            return Ok(result);
        }
        let log_rows: Vec<LogRow> = match sqlx::query_as("SELECT * FROM logs;")
            .fetch_all(&self.pool)
            .await
        {
            Ok(r) => r,
            Err(e) => return Err(MahjongDataError::Unknown(e)),
        };
        let point_transfers: Vec<PointTransfer> =
            match sqlx::query_as("SELECT * FROM point_transfers;")
                .fetch_all(&self.pool)
                .await
            {
                Ok(r) => r,
                Err(e) => return Err(MahjongDataError::Unknown(e)),
            };
        let mut result = Vec::new();
        for lr in log_rows {
            let relevant_pts: Vec<PointTransfer> = point_transfers
                .iter()
                .filter_map(|pt| {
                    if pt.log_id == lr.id {
                        Some(pt.clone())
                    } else {
                        None
                    }
                })
                .collect();
            result.push(lr.into_log(relevant_pts));
        }
        Ok(result)
    }

    async fn record_log(&self, log: Log) -> Result<(), MahjongDataError> {
        let lr = LogRow {
            id: log.id,
            points: log.points,
            faan: log.faan,
            win_kind: log.win_kind,
            datetime: log.datetime,
            round_wind: log.round_wind,
            seat_wind: log.seat_wind,
            disabled: log.disabled,
        };
        if let Err(e) = sqlx::query("INSERT INTO logs (id, win_kind, points, faan, datetime, round_wind) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(lr.id)
            .bind(lr.win_kind)
            .bind(lr.points)
            .bind(lr.faan)
            .bind(lr.datetime)
            .bind(lr.round_wind)
            .execute(&self.pool)
            .await {
                return Err(MahjongDataError::Unknown(e))
                }

        for mid in log.from {
            self.record_point_transfer(PointTransfer {
                log_id: log.id,
                points: log.points,
                to_member: log.to,
                from_member: mid,
            })
            .await?;
        }
        let Some(others) = log.others else {
            return Ok(());
        };
        for mid in others {
            self.record_point_transfer(PointTransfer {
                log_id: log.id,
                points: 0,
                to_member: log.to,
                from_member: mid,
            })
            .await?;
        }
        Ok(())
    }
    
    async fn mut_log(&self, mutation: LogMutation) -> Result<Option<bool>, MahjongDataError> {
        match mutation {
            LogMutation::ToggleDisabled { log_id, new_value } => match self._mut_log_disabled(log_id, new_value).await {
                Ok(r) => Ok(Some(r)),
                Err(e) => Err(e)
            },
            LogMutation::ReplaceReferencesToMember { old_member_id, new_member_id } => match self._mut_log_references_to_member(old_member_id, new_member_id).await {
                Ok(r) => Ok(None),
                Err(e) => Err(e)
            }
        }
    }
}
