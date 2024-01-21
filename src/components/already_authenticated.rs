use maud::PreEscaped;

use super::page::page;

pub fn already_authenticated() -> PreEscaped<String> {
    page(maud::html! { "Already authenticated" })
}
