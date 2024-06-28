use std::{
    fs::File,
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

// player data
// overall structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MahjongData {
    pub week: WeekData,
    pub tables: Vec<TableData>,
    pub members: Vec<Member>,
}

impl MahjongData {
    pub fn create_table(&mut self) -> &TableData {
        if self.tables.len() == 0 {
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
        let last_index = self
            .tables
            .iter()
            .max_by_key(|x| x.table_no)
            .unwrap()
            .table_no;
        let new_table = TableData {
            table_no: last_index + 1,
            east: 0,
            south: 0,
            west: 0,
            north: 0,
        };

        self.tables.push(new_table);
        let index = self
            .tables
            .iter()
            .position(|x| x.table_no == last_index + 1)
            .expect("tables should contain new table with last_added.table_no incrememented");
        self.save_to_file();
        &self.tables[index]
    }

    pub fn from_file(path: &str) -> Self {
        match File::open(path) {
            Ok(f) => {
                let reader = BufReader::new(f);
                serde_json::from_reader(reader).expect("Failed to read Mahjong data file format")
            }
            Err(_) => {
                // create a new template file
                let mahjong_template_data = Self {
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
                };

                mahjong_template_data.save_to_file();
                mahjong_template_data
            }
        }
    }

    pub fn save_to_file(&self) {
        let mut file = File::create(expect_env!("MAHJONG_DATA_PATH")).unwrap();
        file.write_all(serde_json::to_string(&self).unwrap().as_bytes())
            .unwrap();
    }
}
