use maud::{html, PreEscaped, DOCTYPE};

pub fn page(inner: PreEscaped<String>) -> PreEscaped<String> {
    html! {
        (DOCTYPE)
        html {
            head {
                title { "Mahjong Bath" }
                link rel="stylesheet" href="styles.css";
            }
            body {
                div class="centre-container" {
                    (inner)
                }
            }
        }
    }
}
