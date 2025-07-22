mod auth;
mod components;
mod errors;
mod google;
mod data;
mod notification;
mod pages;
mod rate_limit;

use actix_files as fs;
use actix_session::{config::PersistentSession, storage::CookieSessionStore, SessionMiddleware};
use actix_web::{
    cookie::{self, time::Duration}, middleware::DefaultHeaders, web::{self, delete, get, post, put}, App, HttpServer
};
use lib::{
    env, expect_env, parsed_env,
    util::{self, get_file_bytes},
};

use chrono::Duration as chronoDuration;
use circular_buffer::CircularBuffer;
use reqwest::header::CONTENT_LANGUAGE;
use std::sync::{Arc, RwLock};

use pages::{
    auth::authenticate,
    index::index,
    login::login,
    mahjong::{
        tables::{create_table, delete_table, get_tables, update_table},
    },
    qr::page::{download_qr, generate_qr},
    //register_attendance::page::{manual_register_attendance, register_qr_attendance},
};
use rate_limit::{quota::Quota, rate_limit_handler::RateLimit};

use crate::{data::{sqlite::MahjongDataSqlite3, MahjongDB}, pages::{
    logo::logo,
    mahjong::data::get_data,
}};

// NOTE: this needs to be const (used for type), so cannot be environment
// Reading environment in at compile time wouldn't be any different from const
pub const MAX_AUTHENTICATED_USERS: usize = 64;

pub struct AppState {
    // Circular buffer allows us to have a fixed capacity and remove oldest
    // key when inserting a new one - this is to prevent using up too much memory
    authenticated_keys: RwLock<CircularBuffer<MAX_AUTHENTICATED_USERS, String>>,
    admin_password_hash: String,
    hmac_key: Vec<u8>,
    mahjong_data: MahjongDB,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv_override().expect(".env file not found.");

    let key = cookie::Key::generate();
    let state = web::Data::new(get_initial_state().await);
    let quotas_mtx = Arc::new(RwLock::new(get_quota()));

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(RateLimit::new(quotas_mtx.clone()))
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), key.clone())
                    .session_lifecycle(
                        PersistentSession::default().session_ttl(Duration::hours(12)),
                    )
                    .build(),
            )
            .wrap(DefaultHeaders::new().add((CONTENT_LANGUAGE, "en, zh")))
            .route("/qr", get().to(generate_qr))
            .route("/download", get().to(download_qr))
            .route("/", get().to(index))
            // authentication
            .route("/login", get().to(login))
            .route("/auth", post().to(authenticate))
            //.service(
            //    web::resource("/register")
            //        .route(get().to(register_qr_attendance))
            //        .route(post().to(manual_register_attendance)),
            //)
            // mahjong client
            // table page routing
            .service(
                web::resource("/tables")
                    .route(get().to(get_tables))
                    .route(post().to(create_table))
                    .route(delete().to(delete_table))
                    .route(put().to(update_table)),
            )
            //.service(
            //    web::resource("/members")
            //        .route(post().to(create_member))
            //        .route(put().to(update_member))
            //        .route(delete().to(delete_member)),
            //)
            //.service(
            //    web::scope("/members")
            //        .service(web::resource("/transfer").route(post().to(transfer_points))),
            //)
            //.service(
            //    web::resource("/log")
            //        .route(get().to(get_log_page))
            //        .route(put().to(put_log)),
            //)
            //.route("/settings", put().to(update_settings))
            .route("/data.json", get().to(get_data))
            .route(&env::expect_env("LOGO_ROUTE"), get().to(logo))
            // If the mount path is set as the root path /, services registered after this one will be inaccessible. Register more specific handlers and services first.
            .service(fs::Files::new("/public", env::expect_env("PUBLIC_PATH")))
    })
    .bind((env::expect_env("IP"), parsed_env!("PORT", u16)))?
    .run()
    .await
}

async fn get_initial_state() -> AppState {
    let admin_password_hash = env::expect_env("ADMIN_PASSWORD_HASH");

    let hmac_key_path = env::expect_env("HMAC_KEY_PATH");
    let hmac_key = get_file_bytes(&hmac_key_path);

    let mahjong_data_path = env::expect_env("MAHJONG_DATA_PATH");
    let mahjong_data_mutator = MahjongDataSqlite3::from_str(&mahjong_data_path);

    AppState {
        authenticated_keys: RwLock::new(CircularBuffer::new()),
        admin_password_hash,
        hmac_key,
        mahjong_data: mahjong_data_mutator,
    }
}

fn get_quota() -> Quota {
    // If quota is less than burst_size, replenish 1 every period
    let burst_size = parsed_env!("RATE_LIMIT_BURST_SIZE", i32);
    let period = chronoDuration::seconds(parsed_env!("RATE_LIMIT_PERIOD_SECONDS", i64));

    Quota::new(burst_size, period)
}
