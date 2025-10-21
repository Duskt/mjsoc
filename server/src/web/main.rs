mod auth;
mod components;
mod config;
mod data;
mod errors;
mod notification;
mod pages;
mod rate_limit;

use actix_files::Files;
use actix_session::{config::PersistentSession, storage::CookieSessionStore, SessionMiddleware};
use actix_web::{
    cookie::{self, time::Duration},
    middleware::DefaultHeaders,
    web::{self, delete, get, post, put},
    App, HttpServer,
};

use reqwest::header::CONTENT_LANGUAGE;
use std::sync::{Arc, RwLock};

use pages::{
    auth::authenticate,
    index::index,
    login::login,
    mahjong::{
        players::{create_member, delete_member, update_member},
        tables::{create_table, delete_table, get_tables, update_table},
    },
    // qr::page::{download_qr, generate_qr},
    //register_attendance::page::{manual_register_attendance, register_qr_attendance},
};
use rate_limit::rate_limit_handler::RateLimit;

use crate::{
    config::{get_quota, AppState},
    pages::{
        logo::logo,
        mahjong::{
            data::get_data,
            log::{get_log_page, put_log, transfer_points},
        },
        register_attendance::page::{manual_register_attendance, register_qr_attendance},
        session_week::reset_session,
    },
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let key = cookie::Key::generate();
    let config = config::Config::default();
    let state = web::Data::<AppState>::new(config::init_state(config.clone()).await);
    let quotas_mtx = Arc::new(RwLock::new(get_quota()));

    println!(
        "Listening at http://{}:{} ...",
        if config.addrs.0 == "0.0.0.0" {
            "localhost"
        } else {
            &config.addrs.0
        },
        config.addrs.1
    );
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
            // .route("/qr", get().to(generate_qr))
            // .route("/download", get().to(download_qr))
            .route("/", get().to(index))
            // authentication
            .route("/login", get().to(login))
            .route("/auth", post().to(authenticate))
            .service(
                web::resource("/register")
                    .route(get().to(register_qr_attendance))
                    .route(post().to(manual_register_attendance)),
            )
            // mahjong client
            // table page routing
            .service(
                web::resource("/tables")
                    .route(get().to(get_tables))
                    .route(post().to(create_table))
                    .route(delete().to(delete_table))
                    .route(put().to(update_table)),
            )
            .service(
                web::resource("/members")
                    .route(post().to(create_member))
                    .route(put().to(update_member))
                    .route(delete().to(delete_member)),
            )
            .service(
                web::scope("/members")
                    .service(web::resource("/transfer").route(post().to(transfer_points))),
            )
            .service(
                web::resource("/log")
                    .route(get().to(get_log_page))
                    .route(put().to(put_log)),
            )
            .route("/week", delete().to(reset_session))
            //.route("/settings", put().to(update_settings))
            .route("/data.json", get().to(get_data))
            .route("/public/logo", get().to(logo))
            // If the mount path is set as the root path /, services registered after this one will be inaccessible. Register more specific handlers and services first.
            .service(Files::new("/public", &config.public_path))
    })
    .bind(config.addrs)?
    .run()
    .await
}
