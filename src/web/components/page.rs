use maud::{html, PreEscaped, DOCTYPE};

pub fn page(inner: PreEscaped<String>) -> PreEscaped<String> {
    html! {
        (DOCTYPE)
        html {
            head {
                title { "Mahjong Bath" }
                link rel="stylesheet" href="styles.css";
                link rel="stylesheet" href="tables.css";
                link rel="icon" type="image/x-icon" href="assets/favicon.ico";
            }
            body {
                nav {
                    a href="/" { img src="/assets/logo.jpg" class="home-icon" {} }
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
