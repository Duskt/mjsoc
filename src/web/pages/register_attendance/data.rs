use serde::Deserialize;

// Takes a name in the format "Last, First Second" and
// formats to "First Second Last"
// ["Last", "First Second"]
pub fn flip_names(name: &str) -> String {
    name.rsplit(", ").collect::<Vec<_>>().join(" ")
}

#[derive(Deserialize)]
pub struct AttendanceQuery {
    pub name: String,
    pub signature: String,
}