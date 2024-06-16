import renderDeleteButton from "../components/deleteButton";
import renderPlayerNameTag from "../components/player";

export default function onPageRequest() {
    let table_table = document.getElementById('table');
    if (!table_table) throw Error("No element with the table id is present.");
    let current_row = document.createElement('tr');
    let n_cols = Math.ceil(Math.sqrt(window.MJDATA.tables.length));
    let index = 0;
    let td = document.createElement('td');
    for (const i of window.MJDATA.tables) {
        index++;
        if (index > n_cols) {
            table_table.appendChild(current_row);
            current_row = document.createElement('tr');
            index = 0;
        }
        td.appendChild(renderPlayerTable(td, i));
        current_row.appendChild(td);
        td = document.createElement('td');
    }
    table_table.appendChild(current_row);
}

function renderPlayerTable(parent: HTMLElement, mahjongTable: TableData) {
    // render a single table element in the parent 
    let innerTable = document.createElement('table');
    let innerRows = [document.createElement('tr'), document.createElement('tr'), document.createElement('tr')]
    // west (in the top position, yes)
    innerRows[0].appendChild(document.createElement('td'));
    renderPlayerNameTag(innerRows[0], mahjongTable.table_no, "west", mahjongTable.west);
    innerRows[0].appendChild(document.createElement('td'));
    // north (left); table no; south (right)
    renderPlayerNameTag(innerRows[1], mahjongTable.table_no, "north", mahjongTable.north);
    let inner_table_display = document.createElement("td");
    inner_table_display.classList.add("mahjong-table-display")
    inner_table_display.textContent = mahjongTable.table_no.toString();
    innerRows[1].appendChild(inner_table_display)
    renderPlayerNameTag(innerRows[1], mahjongTable.table_no, "south", mahjongTable.south);
    // east (bottom)
    innerRows[2].appendChild(document.createElement('td'));
    renderPlayerNameTag(innerRows[2], mahjongTable.table_no, "east", mahjongTable.east);
    let deleteButtonCell = document.createElement('td');
    renderDeleteButton(deleteButtonCell, mahjongTable.table_no);
    innerRows[2].appendChild(deleteButtonCell);

    // add the rows to the table and return the table
    for (const i of innerRows) {
        innerTable.appendChild(i);
    }
    return innerTable;
}