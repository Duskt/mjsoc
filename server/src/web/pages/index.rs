use actix_web::{HttpResponse, Responder};
use maud::html;

use crate::components::page::page;

pub async fn index() -> impl Responder {
    println!("Home page requested");

    let html = page(html! {
        span { img src="/public/logo" class="logo"; }
        p {
            "Only the Mahjong society committee should need to use this."
            br; br;
            "Contact a developer for help."
        }
    });

    HttpResponse::Ok().body(html.into_string())
}
