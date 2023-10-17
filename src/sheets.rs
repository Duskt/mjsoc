// sheets.rs
use dotenv::dotenv;
use google_sheets4::{
    api::{UpdateValuesResponse, ValueRange},
    hyper::{self, Body, Response},
    hyper_rustls, Error, Sheets,
};
use serde_json::value::Value;
use std::env;

const SESSION: u8 = 1;
const MAX_PLAYERS: u8 = 30;

pub async fn get_members(
    hub: &Sheets<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>,
    name: Option<&str>,
) -> Result<usize, String> {
    dotenv().ok();
    let range: String = format!("Session {}!A1:A{}", SESSION, MAX_PLAYERS);
    let res = hub
        .spreadsheets()
        .values_get(&env::var("SHEET_ID").unwrap(), &range)
        .doit() // just
        .await
        .expect("Could not get members:");
    let values = res.1.values.expect("res.1.values was None unexpectedly");
    if let Some(name) = name {
        if values.iter().fold(false, |acc, i| {
            // im a rustacean
            acc | i
                .iter()
                .map(|x| x.to_string().replace('"', ""))
                .collect::<Vec<String>>()
                .contains(&name.to_string())
        }) {
            return Err(format!("{} already present in roster.", name));
        }
    }
    Ok(values.len())
}

pub async fn add_member(
    hub: &Sheets<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>,
    column: u8,
    name: &str,
) -> Result<(Response<Body>, UpdateValuesResponse), Error> {
    dotenv().ok();
    let range = format!("Session {}!A{}", SESSION, column + 1);
    let req = ValueRange {
        major_dimension: None, // defaults to ROWS, doesn't matter since length is 1
        range: Some(range.clone()),
        values: Some(vec![vec![Value::from(name)]]),
    };
    hub.spreadsheets()
        .values_update(req, &env::var("SHEET_ID").unwrap(), &range)
        // value_input_option must be "RAW" or "USER_ENTERED". fuck enums ig
        .value_input_option("RAW")
        .doit()
        .await
}
