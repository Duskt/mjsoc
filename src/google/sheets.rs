use dotenv::dotenv;
use google_sheets4::{
    api::{UpdateValuesResponse, ValueRange},
    hyper::{self, Body, Response},
    hyper_rustls, Error, Sheets,
};
use serde_json::value::Value;
use std::env;

use crate::{errors::insert_member_error::InsertMemberErr, http_client::http_client};

const SESSION: u8 = 2;
const MAX_PLAYERS: u8 = 50;
pub const MAX_NAME_LEN: usize = 64;

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
    row: u8,
    name: &str,
) -> Result<(Response<Body>, UpdateValuesResponse), Error> {
    dotenv().ok();
    if name.len() > MAX_NAME_LEN {
        return Err(Error::BadRequest(Value::from(
            "Name must not be longer than 64 characters.",
        )));
    }
    let range = format!("Session {}!A{}", SESSION, row + 1);
    let req = ValueRange {
        major_dimension: None, // defaults to ROWS, doesn't matter since length is 1
        range: Some(range.clone()),
        values: Some(vec![vec![Value::from(flip_names(name))]]),
    };
    hub.spreadsheets()
        .values_update(req, &env::var("SHEET_ID").unwrap(), &range)
        // value_input_option must be "RAW" or "USER_ENTERED". fuck enums ig
        .value_input_option("RAW")
        .doit()
        .await
}

pub async fn insert_new_member(name: &str) -> Result<(), InsertMemberErr> {
    let client = http_client();
    let auth = super::auth::authenticate(client.clone()).await;
    let hub = Sheets::new(client.clone(), auth);
    let length = match super::sheets::get_members(&hub, Some(name)).await {
        Ok(l) => l,
        _ => return Err(InsertMemberErr::AlreadyInRoster),
    };

    let u8length = length.try_into().unwrap();
    super::sheets::add_member(&hub, u8length, name)
        .await
        .map(|_| ())
        .map_err(InsertMemberErr::GoogleSheetsErr)
}

fn flip_names(name: &str) -> String {
    // Takes a name in the format "Last, First Second" and
    // formats to "First Second Last"
    // ["Last", "First Second"]
    name.rsplit(", ").collect::<Vec<_>>().join(" ")
}
