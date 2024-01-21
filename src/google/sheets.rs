use google_sheets4::{api::ValueRange, hyper, hyper_rustls, Sheets};
use serde_json::value::Value;

use crate::{
    errors::insert_member_error::InsertMemberErr, expect_env, google::http_client::http_client,
};

use super::auth::authenticate;

pub async fn get_members(
    hub: &Sheets<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>,
    name: Option<&str>,
    session: u8,
) -> Result<usize, InsertMemberErr> {
    let max_players = expect_env!("MAX_PLAYERS");
    let range: String = format!("Session {}!A1:A{}", session, max_players);
    let res = hub
        .spreadsheets()
        .values_get(&expect_env!("SHEET_ID"), &range)
        .doit() // just
        .await
        .expect("Could not get members");

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
            return Err(InsertMemberErr::AlreadyInRoster);
        }
    }

    Ok(values.len())
}

pub async fn insert_new_member(name: &str, session: u8) -> Result<(), InsertMemberErr> {
    let client = http_client();
    let auth = authenticate(client.clone()).await;
    let hub = Sheets::new(client.clone(), auth);
    let length = get_members(&hub, Some(name), session).await?;

    let u8length = length.try_into().unwrap();
    add_member(&hub, u8length, name, session).await
}

async fn add_member(
    hub: &Sheets<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>,
    row: u8,
    name: &str,
    session: u8,
) -> Result<(), InsertMemberErr> {
    let range = format!("Session {}!A{}", session, row + 1);
    let req: ValueRange = ValueRange {
        major_dimension: None, // defaults to ROWS, doesn't matter since length is 1
        range: Some(range.clone()),
        values: Some(vec![vec![Value::from(name)]]), // single value in 2d array
    };

    hub.spreadsheets()
        .values_update(req, &expect_env!("SHEET_ID"), &range)
        // value_input_option must be "RAW" or "USER_ENTERED". fuck enums ig
        .value_input_option("RAW")
        .doit()
        .await
        .map_err(InsertMemberErr::GoogleSheetsErr)?;

    Ok(())
}
