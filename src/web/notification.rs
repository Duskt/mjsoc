use std::env;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
struct Notification {
    body: String,
    title: String,

    #[serde(rename = "type")]
    notification_type: String,
}

pub async fn send_notification(ip: &str, seconds_remaining: i64) {
    let content = Notification {
        title: "Rate limiting mjsoc.hop.io".to_string(),
        body: format!(
            "Quota exceeded, not sending more responses.\n\nOffending IP: {}\n\nWill replenish in {}s",
            ip,
            seconds_remaining
        ),
        notification_type: "note".to_string(),
    };

    let client = reqwest::Client::builder()
        .connection_verbose(true)
        .build()
        .unwrap();

    let pushbullet_access_tokens = env::var("PUSHBULLET_ACCESS_TOKENS");
    if let Ok(tokens) = pushbullet_access_tokens {
        let tokens = tokens.split(',').filter(|t| !t.is_empty());
        for token in tokens {
            client
                .post("https://api.pushbullet.com/v2/pushes")
                .header("Access-Token", token)
                .json(&content)
                .send()
                .await
                .unwrap();
        }
    }
}
