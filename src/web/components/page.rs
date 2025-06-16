use maud::{html, PreEscaped, DOCTYPE};
use lib::expect_env;

pub fn page(inner: PreEscaped<String>) -> PreEscaped<String> {
    html! {
        (DOCTYPE)
        html {
            head {
                title { "Mahjong Bath" }
                link rel="stylesheet" href="/public/styles.css";
                link rel="stylesheet" href="/public/tables.css";
                link rel="icon" type="image/x-icon" href="/public/assets/favicon.ico";
            }
            body {
                nav {
                    a href="/" { img src=(expect_env!("LOGO_ROUTE")) class="home-icon" {} }
                    a href="/tables" class="nav-link" { "Tables" }
                    a href="/log" class="nav-link" { "Log" }
                }
                div class="centre-container" {
                    (inner)
                }
            }
        }
    }
}
