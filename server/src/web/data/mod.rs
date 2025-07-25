/* This very very specific name 'data' describes a directory of program files to describe the 
 * schema of data structures and manage read/write functionality for database management on
 * said structures.
 */
use crate::data::sqlite::MahjongDataSqlite3;

pub mod structs;
pub mod mutator;
pub mod sqlite;
pub mod json;
pub mod errors;
pub type MahjongDB = MahjongDataSqlite3; // Mutex<MahjongDataJson>;