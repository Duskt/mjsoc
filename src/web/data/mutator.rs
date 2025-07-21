use std::convert::Infallible;

/* Mutations to the data structure in-memory are simply written in Rust, manipulating structures.
 * However, to persist across sessions, there needs to be another format of storage. Currently we implement
 * JSON and sqlite3 schemas. The JSON one is trivial; simply mutate in-memory, and then save. But re-writing
 * the entire file might be inefficient compared to sqlite3's implementation, which updates only that which
 * needs to be updated.
 * Regardless, JSON cannot feasibly be used with multiple connections, thus necessitating sqlite3.
 * 
 * 
 */
use crate::data::structs::{MahjongData, TableData};

pub trait MahjongDataMutator<E> {
    async fn new_table(&mut self) -> Result<TableData, E>;
    async fn mut_table(&mut self, table_index: usize, new_table: TableData) -> Result<(), E>;
    async fn del_table(&mut self, table_index: usize) -> Result<(), E>;

    //async fn add_member(&mut self) -> Member;
    //async fn mut_member(&mut self) -> ();

    //async fn undo_log(&mut self) -> ();
    //async fn edit_log(&mut self) -> ();
    //async fn add_log(&mut self) -> Log;

    //async fn transfer_points(&mut self) -> ();

    //async fn register(&mut self) -> ();
}

fn get_new_index(indices: Vec<u32>) -> u32 {
    let max_index = indices.iter().max();
    let new_index = *max_index.unwrap_or(&0) + 1;
    for i in 1..new_index {
        if !indices.contains(&i) {
            return i;
        }
    }
    new_index
}

/* In-memory only mutation of the structure; a database storage type needs to implement this too. E.g. a JSON impl. can trivially call this and then write to the file. */
impl MahjongDataMutator<Infallible> for MahjongData {
    async fn new_table(&mut self) -> Result<TableData, Infallible> {
        let new_index = get_new_index(self.tables.iter().map(|x| x.table_no).collect::<Vec<u32>>());
        let new_table = TableData {
            table_no: new_index,
            east: 0,
            south: 0,
            west: 0,
            north: 0,
        };

        self.tables.push(new_table.clone());
        Ok(new_table)
    }
    
    async fn mut_table(&mut self, table_index: usize, new_table: TableData) -> Result<(), Infallible> {
        self.tables[table_index] = new_table;
        Ok(())
    }
    
    async fn del_table(&mut self, table_index: usize) -> Result<(), Infallible> {
        let table_no = self.tables.swap_remove(table_index).table_no;
        for td in &mut self.tables {
            if td.table_no > table_no {
                td.table_no -= 1
            }
        }
        Ok(())
    }
}