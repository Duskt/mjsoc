use std::{path::PathBuf, sync::RwLock};

use circular_buffer::CircularBuffer;
use lib::util::get_file_bytes;
use chrono::Duration as chronoDuration;

use crate::{data::{sqlite::MahjongDataSqlite3, MahjongDB}, rate_limit::quota::Quota};

#[macro_export]
macro_rules! compile_env {
    ($name:literal, $type:ty) => {
        std::env::var($name).expect(&format!("No {} environment variable found", $name)).parse::<$type>().expect(&format!(
            "{} was not able to be parsed as {:?}",
            $name,
            stringify!($type)
        ))
    };
}

fn find_env(path: Result<PathBuf, std::io::Error>) {
    let err = std::io::Error::new(std::io::ErrorKind::NotFound, ".env file not found");
    let Ok(path) = path else {
        println!("No .env file found for environment declarations (todo: remove warning if vars are set manually");
        return;
    };
    let env_file = path.join(".env");
    match dotenvy::from_path(&env_file) {
        Ok(_) => println!("Got .env file at {env_file:?}"),
        Err(_) => if path.ends_with("server") { 
            let parent = path.parent().map(|x| x.to_path_buf());
            find_env(parent.ok_or(err))
        } else { find_env(Err(err)) }
    }
}

// NOTE: this needs to be const (used for type), so cannot be environment
// Reading environment in at compile time wouldn't be any different from const
pub const MAX_AUTHENTICATED_USERS: usize = 64;

#[derive(Clone)]
pub struct Config {
    pub addrs: (String, u16),
    pub public_path: String,
    pub logo_path: String,
}

impl Default for Config {
    fn default() -> Self {
        // use ROOT/.env or ROOT/server/.env for configuration
        find_env(std::env::current_dir());
        let ip = std::env::var("IP").unwrap_or("0.0.0.0".to_string());
        let raw_port = std::env::var("PORT");
        let port = match raw_port {
            Ok(p) => p.parse().expect("Couldn't use port {p}"),
            Err(_) => 5654,
        };
        let public_path = std::env::var("PUBLIC_PATH").unwrap_or("/public".to_string());
        let logo_path = std::env::var("LOGO_PATH").unwrap_or_else(|_| {
            println!("No logo found: specify environment variable LOGO_PATH.");
            String::new()
        });
        Self { addrs: (ip, port), public_path, logo_path }
    }
}

pub struct AppState {
    // Circular buffer allows us to have a fixed capacity and remove oldest
    // key when inserting a new one - this is to prevent using up too much memory
    pub config: Config,
    pub authenticated_keys: RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
    pub admin_password_hash: Option<String>,
    pub hmac_key: Vec<u8>,
    pub mahjong_data: MahjongDB,
}


pub async fn init_state(config: Config) -> AppState {
    let admin_password_hash = match std::env::var("ADMIN_PASSWORD_HASH") {
        Ok(hash) => Option::Some(hash),
        Err(_) => { 
            println!("Admin password is blank: provide ADMIN_PASSWORD_HASH environment variable as argon2 hash.");
            Option::None
        }
    };

    let hmac_key = match std::env::var("HMAC_KEY_PATH") {
        Ok(path) => get_file_bytes(&path),
        Err(_) => panic!("todo use systemtime default")
    };

    let mahjong_data_path = std::env::var("MAHJONG_DATA_PATH").unwrap_or("data/mjdata.db".to_string());
    let mahjong_data_mutator = MahjongDataSqlite3::new(mahjong_data_path).await;

    AppState {
        config,
        authenticated_keys: RwLock::new(CircularBuffer::new()),
        admin_password_hash,
        hmac_key,
        mahjong_data: mahjong_data_mutator,
    }
}

pub fn get_quota() -> Quota {
    // If quota is less than burst_size, replenish 1 every period
    let burst_size: i32 = std::env::var("RATE_LIMIT_BURST_SIZE").map_or(1000, |x| x.parse().expect("Couldn't parse RATE_LIMIT_BURST_SIZE as signed 32-bit int."));
    let period = chronoDuration::seconds(std::env::var("RATE_LIMIT_PERIOD_SECONDS").map_or(60, |x| x.parse().expect("Couldn't parse RATE_LIMIT_PERIOD_SECONDS as signed 64-bit int.")));
    Quota::new(burst_size, period)
}
