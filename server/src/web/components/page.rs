use maud::{html, PreEscaped, DOCTYPE};

pub fn page(inner: PreEscaped<String>) -> PreEscaped<String> {
    html! {
        (DOCTYPE)
        html lang="en" {
            head {
                title { "Mahjong Bath" }
                link rel="stylesheet" href="/public/styles.css";
                link rel="stylesheet" href="/public/tables.css";
                link rel="icon" type="image/x-icon" href="/public/assets/favicon.ico";
            }
            body {
                nav {
                    a href="/" { img src="/public/logo" class="home-icon" {} }
                    a href="/tables" class="nav-link" { "Tables" }
                    a href="/log" class="nav-link" { "Log" }
                    button class="settings-button dropdown-button" style="display: none" { "" }
                }
                main class="centre-container" {
                    (inner)
                }
            }
        }
    }
}
