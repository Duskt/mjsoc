use maud::PreEscaped;

use super::page::page;

pub fn error(message: &str) -> PreEscaped<String> {
    page(maud::html! { "An error occurred: " (message) })
}
