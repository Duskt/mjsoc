use std::{
    env,
    fs::File,
    io::{BufReader, Write},
    time::{SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekData {
    pub week: u8,
    pub last_set_unix_seconds: u64,
}

impl WeekData {
    pub fn from_file(path: &str) -> Self {
        match File::open(path) {
            Ok(f) => {
                let reader = BufReader::new(f);
                serde_json::from_reader(reader).expect("Failed to read week file format")
            }
            Err(_) => {
                let week_data = Self {
                    week: 1,
                    last_set_unix_seconds: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                };

                week_data.save_to_file();
                week_data
            }
        }
    }

    pub fn save_week(&mut self, week: u8) {
        self.last_set_unix_seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.week = week;
        self.save_to_file();
    }

    fn save_to_file(&self) {
        let mut file = File::create(env::var("WEEK_FILE").unwrap()).unwrap();
        file.write_all(serde_json::to_string(&self).unwrap().as_bytes())
            .unwrap();
    }
}
