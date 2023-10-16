// sheets.rs
use dotenv::dotenv;
use google_sheets4::{
    api::{UpdateValuesResponse, ValueRange},
    hyper::{self, Body, Response},
    hyper_rustls, Error, Sheets,
};
use serde_json::value::Value;
use std::env;

pub async fn get_members(hub: &Sheets<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>) {
    dotenv().ok();
    let res = hub
        .spreadsheets()
        .values_get(&env::var("SHEET_ID").unwrap(), "Session 1!A1:A30")
        .doit() // just
        .await
        .expect("Request failed somehow");
    // as A1:A30 is just a column, it should always be Vec(1 item)<Vec(30 items)<serde_json::value::Value>>
    // we want to read the member list, make sure they're not on there, and then add them
    // (see below - there is an append method as well, but that won't check if theyre alr here)
    // for now let's just add the id
    // this should return:
    // Ok(a number corresponding to the row to add the name to, e.g. 15)
    // or Err(this person is already added)
}

pub async fn add_member(
    hub: &Sheets<hyper_rustls::HttpsConnector<hyper::client::HttpConnector>>,
) -> Result<(Response<Body>, UpdateValuesResponse), Error> {
    dotenv().ok();
    // THERE IS AN APPEND FUNCTION BTW
    // https://docs.rs/google-sheets4/latest/google_sheets4/api/struct.SpreadsheetValueAppendCall.html
    // i can't get this to work. google sheets api is crazy
    let req = ValueRange {
        major_dimension: None,
        range: Some(String::from("Session 1!A15")),
        values: Some(vec![vec![Value::from("test")]]),
    };
    println!("{:?}", req);
    hub.spreadsheets()
        .values_update(req, &env::var("SHEET_ID").unwrap(), "Session 1!A15")
        .value_input_option("test")
        .doit()
        .await
}
