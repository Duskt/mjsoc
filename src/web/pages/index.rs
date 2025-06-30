use lib::env;

use actix_web::{HttpResponse, Responder};
use maud::html;

use crate::components::page::page;

pub async fn index() -> impl Responder {
    println!("Home page requested");

    let html = page(html! {
        img src=(env::expect_env("LOGO_ROUTE")) class="logo" style="margin-top: 20px;";
        p {
            "Only the Mahjong society committee should need to use this."
            br; br;
            "Contact a developer for help."
        }
    });

    HttpResponse::Ok().body(html.into_string())
}
