use serde::Deserialize;

#[derive(Deserialize)]
pub struct GenerateQuery {
    pub name: Option<String>,
}

#[derive(Deserialize)]
pub struct DownloadQuery {
    pub name: String,
}
