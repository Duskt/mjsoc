use lib::env;
use std::{
    fs::{rename, File},
    io::{BufReader, Write},
    path::PathBuf,
    convert::Infallible,
};

use crate::data::{mutator::MahjongDataMutator, structs::{MahjongData, TableData}};

pub struct MahjongDataJson {
    pub data: MahjongData,
    pub path: PathBuf,
}

impl MahjongDataJson {
    pub fn archive() {
        let path = env::expect_env("MAHJONG_DATA_PATH");
        let mut backup_path = path.clone();
        // remove ".json" ending
        backup_path.truncate(backup_path.len() - 5);
        backup_path += "_OLD.json";
        rename(path, backup_path).expect("Failed to save backup file; crashing...")
    }

    pub fn save(&self) -> &Self {
        let mut file = File::create(&self.path).unwrap();
        file.write_all(serde_json::to_string(&self.data).unwrap().as_bytes())
            .unwrap();
        self
    }
    pub fn load(path: &str) -> Self {
        // this path may not exist, but the parent path must exist
        let path = PathBuf::from(path);
        // split into final component and parent (everything before) and resolve the parent
        let dest = path.file_name().unwrap();
        let parent = path
            .parent()
            .unwrap()
            .canonicalize()
            .expect("Failed to canoncalicalziele");

        let path = parent.join(dest);
        match File::open(&path) {
            Ok(f) => {
                let reader = BufReader::new(f);
                match serde_json::from_reader(reader) {
                    Ok(r) => Self { path, data: r },
                    Err(_) => {
                        println!(
                            "JSON deserialize error on {} - saving file as *_OLD.json and remaking it..."
                        , path.display());
                        MahjongDataJson::archive();
                        Self {
                            path,
                            data: MahjongData::default(),
                        }
                    }
                }
            }
            Err(_) => {
                // File not found error - create empty
                println!(
                    "Mahjong data JSON file at '{}' not found; creating a new one...",
                    path.display()
                );
                Self {
                    path,
                    data: MahjongData::default(),
                }
            }
        }
    }
}

impl MahjongDataMutator<Infallible> for MahjongDataJson {
    async fn new_table(&mut self) -> Result<TableData, Infallible> {
        let td = self.data.new_table().await?;
        self.save();
        Ok(td)
    }
    async fn del_table(&mut self, table_index: usize) -> Result<(), Infallible> {
        let r = self.data.del_table(table_index).await?;
        self.save();
        Ok(r)
    }
    async fn mut_table(&mut self, table_index: usize, new_table: TableData) -> Result<(), Infallible> {
        let r = self.data.mut_table(table_index, new_table).await?;
        self.save();
        Ok(r)
    }
}