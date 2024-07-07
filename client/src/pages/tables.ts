import DeleteButton from "../components/deleteButton";
import {
    InputListener,
    InputListenerParameters,
} from "../components/input/listener";
import PlayerTag from "../components/player";
import renderSidebar from "../components/sidebar";
import { UsesTable } from "../data";

export default function tables() {
    let table_table = document.getElementById("table");
    if (!table_table) throw Error("No element with the table id is present.");
    let current_row = document.createElement("tr");
    let n_cols = Math.ceil(Math.sqrt(window.MJDATA.tables.length));
    let index = 0;
    let td = document.createElement("td");
    for (const i of window.MJDATA.tables) {
        index++;
        if (index > n_cols) {
            table_table.appendChild(current_row);
            current_row = document.createElement("tr");
            index = 0;
        }
        let gameTable = new GameTable({
            parent: td,
            table: i,
        });
        current_row.appendChild(td);
        td = document.createElement("td");
    }
    table_table.appendChild(current_row);
    renderSidebar();
}

interface GameTableParameters
    extends Omit<InputListenerParameters<"table">, "tag"> {
    table: TableData;
}

class GameTable extends UsesTable(InputListener<"table">) {
    tableNo: TableNo;
    players: PlayerTag[];
    constructor(params: GameTableParameters) {
        super({
            ...params,
            tag: "table",
            debug: true,
        });
        this.tableNo = params.table.table_no;
        let blank = (v: HTMLElement) =>
            v.appendChild(document.createElement("td"));
        let innerRows = [
            document.createElement("tr"),
            document.createElement("tr"),
            document.createElement("tr"),
        ];
        innerRows.forEach((i) => this.element.appendChild(i));
        // top row
        blank(innerRows[0]);
        let west = new PlayerTag({
            parent: innerRows[0],
            tableNo: params.table.table_no,
            seat: "west",
        });
        blank(innerRows[0]);
        // middle row
        let north = new PlayerTag({
            parent: innerRows[1],
            tableNo: params.table.table_no,
            seat: "north",
        });
        this.renderTableDisplay(innerRows[1]);
        let south = new PlayerTag({
            parent: innerRows[1],
            tableNo: params.table.table_no,
            seat: "south",
        });
        // bottom row
        blank(innerRows[2]);
        let east = new PlayerTag({
            parent: innerRows[2],
            tableNo: params.table.table_no,
            seat: "east",
        });
        this.renderDeleteCell(innerRows[2]);
        this.players = [east, south, west, north];
    }
    renderDeleteCell(parent: HTMLElement) {
        let deleteButtonCell = document.createElement("td");
        let deleteButton = new DeleteButton({
            parent: deleteButtonCell,
            tableNo: this.tableNo,
        });
        parent.appendChild(deleteButtonCell);
    }
    renderTableDisplay(parent: HTMLElement) {
        let inner_table_display = document.createElement("td");
        inner_table_display.classList.add("mahjong-table-display");
        inner_table_display.textContent = this.tableNo.toString();
        parent.appendChild(inner_table_display);
    }
    generateListener(): EventListener {
        return (ev: Event) => {
            for (const player of this.players) {
                player.updateWinButton();
            }
        };
    }
    updateTable(tableNo: TableNo): void {
        throw Error("not imp.");
    }
}
