use std::{
    fs::{rename, File},
    io::{BufReader, Write},
    time::{SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};

use crate::expect_env;

// Week data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekData {
    week: u8,
    last_set_unix_seconds: u64,
}

impl WeekData {
    pub fn get(&self) -> u8 {
        self.week
    }

    pub fn set(&mut self, week: u8) {
        self.last_set_unix_seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.week = week;
    }

    // Autoincrement session week and return current week
    // if 6 days have passed since last set, increments ``session_week``
    // and updates ``last_set``. Otherwise, change nothing.
    pub fn increment(&mut self) -> u8 {
        let now_seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // diff in secs / 60 -> mins / 60 -> hours / 24 -> days
        let days_elapsed = (now_seconds - self.last_set_unix_seconds) / 60 / 60 / 24;

        println!(
            "Last increment: {}, current time {}, difference in days: {}",
            self.last_set_unix_seconds, now_seconds, days_elapsed
        );

        let session_week_number;
        if days_elapsed >= 6 {
            session_week_number = self.week + 1;
            self.set(session_week_number);
        } else {
            session_week_number = self.week;
        }

        session_week_number
    }
}

pub type MemberId = u32;

// table data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub table_no: u32,
    pub east: MemberId,
    pub south: MemberId,
    pub west: MemberId,
    pub north: MemberId,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: MemberId,
    pub name: String,
    pub points: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PointTransfer {
    pub to: MemberId,
    pub from: Vec<MemberId>,
    pub points: i32,
}

fn get_new_index(indices: Vec<u32>) -> u32 {
    let opt_maxi = indices.iter().max();
    let maxi = *opt_maxi.unwrap_or(&1);
    for i in 1..maxi {
        if !indices.contains(&i) {
            return i;
        }
    }
    maxi + 1
}

// player data
// overall structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MahjongData {
    pub week: WeekData,
    pub tables: Vec<TableData>,
    pub members: Vec<Member>,
    pub log: Vec<PointTransfer>,
}

impl MahjongData {
    pub fn create_table(&mut self) -> &TableData {
        if self.tables.is_empty() {
            self.tables.push(TableData {
                table_no: 1,
                // 0 represents empty
                east: 0,
                south: 0,
                west: 0,
                north: 0,
            });
            self.save_to_file();
            return &self.tables[0];
        }
        // get max index
        let new_index = get_new_index(self.tables.iter().map(|x| x.table_no).collect::<Vec<u32>>());
        let new_table = TableData {
            table_no: new_index,
            east: 0,
            south: 0,
            west: 0,
            north: 0,
        };

        self.tables.push(new_table);
        let index = self
            .tables
            .iter()
            .position(|x| x.table_no == new_index)
            .expect(
                "tables should have contained the new table with last_added.table_no incrememented",
            );
        self.save_to_file();
        &self.tables[index]
    }

    pub fn from_file(path: &str) -> Self {
        match File::open(path) {
            Ok(f) => {
                let reader = BufReader::new(f);
                match serde_json::from_reader(reader) {
                    Ok(r) => r,
                    Err(_) => {
                        println!(
                            "JSON deserialize error - saving file as *_OLD.json and remaking it..."
                        );
                        MahjongData::save_backup();
                        MahjongData::new()
                    }
                }
            }
            Err(_) => {
                // File not found error - create empty
                MahjongData::new()
            }
        }
    }

    pub fn save_backup() {
        let path = expect_env!("MAHJONG_DATA_PATH");
        let mut backup_path = path.clone();
        // remove ".json" ending
        backup_path.truncate(backup_path.len() - 5);
        backup_path += "_OLD.json";
        rename(path, backup_path).expect("Failed to save backup file; crashing...")
    }

    pub fn create_template() -> Self {
        Self {
            // no tables or members because there's no source of data
            tables: Vec::new(),
            members: Vec::new(),
            // week 1 last set now
            week: WeekData {
                week: 1,
                last_set_unix_seconds: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            },
            log: Vec::new(),
        }
    }

    pub fn new() -> Self {
        let mahjong_template_data = MahjongData::create_template();
        mahjong_template_data.save_to_file();
        mahjong_template_data
    }

    pub fn save_to_file(&self) {
        let mut file = File::create(expect_env!("MAHJONG_DATA_PATH")).unwrap();
        file.write_all(serde_json::to_string_pretty(&self).unwrap().as_bytes())
            .unwrap();
    }
}
