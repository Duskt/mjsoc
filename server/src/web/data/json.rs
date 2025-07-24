use lib::env;
use std::{
    fs::{rename, File},
    io::{BufReader, Write},
    path::PathBuf,
    convert::Infallible,
};

use crate::data::{mutator::MahjongDataMutator, structs::{MahjongData, TableData, TableNo, TableNotFoundError}};

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

impl MahjongDataMutator<Infallible, TableNotFoundError> for MahjongDataJson {
    async fn new_table(&mut self) -> Result<TableData, Infallible> {
        let td = self.data.new_table().await?;
        self.save();
        Ok(td)
    }
    async fn del_table(&mut self, table_no: TableNo) -> Result<(), TableNotFoundError> {
        let r = self.data.del_table(table_no).await?;
        self.save();
        Ok(r)
    }
    async fn mut_table(&mut self, table_no: TableNo, new_table: TableData) -> Result<(), TableNotFoundError> {
        let r = self.data.mut_table(table_no, new_table).await?;
        self.save();
        Ok(r)
    }
}

/*
    UPDATE MEMBER
    let mut mj = data.mahjong_data.lock().unwrap();
    let optmember = mj.data.members.iter_mut().find(|x| x.id == body.id);
    let response = match optmember {
        None => HttpResponse::BadRequest().body("Player ID could not be found."),
        Some(member) => HttpResponse::Ok().json(mem::replace(member, body.new_member.clone())),
    };
    mj.save();
    response
    
    NEW MEMBER
    let mut mj = data.mahjong_data.lock().unwrap();
    // defaults to 1 (0+1) as 0 represents an empty seat
    let id = mj.data.members.iter().map(|x| x.id).max().unwrap_or(0) + 1;
    let new_member = Member {
        id,
        name: body.name.clone(),
        tournament: TournamentData {
            total_points: 0,
            session_points: 0,
            registered: false,
        },
        council: false,
    };
    mj.data.members.push(new_member.clone());
    mj.save();
    // no need to redirect as they already see the changes they've made
    HttpResponse::Created().json(new_member)

    DEL MEMBER
    let mut mj = data.mahjong_data.lock().unwrap();

    if let Some(index) = mj.data.members.iter().position(|x| x.id == body.id) {
        let member_id = mj.data.members[index].id;
        // remove references to the member
        for t in mj.data.tables.iter_mut() {
            // todo: surely a better way
            if t.east == member_id {
                t.east = 0
            }
            if t.south == member_id {
                t.south = 0
            }
            if t.west == member_id {
                t.west = 0
            }
            if t.north == member_id {
                t.north = 0
            }
        }
        // now remove the member from the members list
        mj.data.members.swap_remove(index);
        mj.save();
        HttpResponse::ResetContent().body("Deleted member")
    } else {
        HttpResponse::BadRequest().body(format!("Could not find a member with the id {}", body.id))
    }


    POINT TRANSFER
        let mut mj = data.mahjong_data.lock().unwrap();
    if mj.data.log.iter().any(|l| l.id == body.id) {
        return HttpResponse::BadRequest().body("id already exists");
    }

    // calc points, defaulting to body.points (legacy) which frontend calculates
    let points = match Faan::get_base_points(body.faan, body.win_kind.clone()) {
        Some(calc_pts) => calc_pts,
        None => body.points,
    };
    // take the points from...
    let mut update_members: Vec<Member> = vec![];
    for id in body.from.iter() {
        for member in mj.data.members.iter_mut() {
            if member.id == *id {
                member.tournament.session_points -= points;
                update_members.push(member.clone());
            }
        }
    }
    // and give points*n to...
    let winner_points = ((points as isize) * (body.from.len() as isize)) as i32;
    if let Some(mem) = mj.data.members.iter_mut().find(|mem| mem.id == body.to) {
        mem.tournament.session_points += winner_points;
        update_members.push(mem.clone());
    }
    // log the PointTransfer request
    mj.data.log.push(body.to_owned());
    mj.save();
    // send back the affected members as confirmation
    HttpResponse::Ok().json(update_members)
*/