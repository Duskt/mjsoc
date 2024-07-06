import Component, { ComponentParameters } from "../components";
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
        return () => {
            this.log("INPUT EVENT!");
        };
    }
    updateTable(tableNo: TableNo): void {
        throw Error("not imp.");
    }
}

function renderPlayerTble(parent: HTMLElement, mahjongTable: TableData) {
    // render a single table element in the parent
    let innerTable = document.createElement("table");
    let innerRows = [
        document.createElement("tr"),
        document.createElement("tr"),
        document.createElement("tr"),
    ];
    // west (in the top position, yes)
    innerRows[0].appendChild(document.createElement("td"));
    let west = new PlayerTag({
        parent: innerRows[0],
        tableNo: mahjongTable.table_no,
        seat: "west",
    });
    innerRows[0].appendChild(document.createElement("td"));
    // north (left); table no; south (right)
    let north = new PlayerTag({
        parent: innerRows[1],
        tableNo: mahjongTable.table_no,
        seat: "north",
    });
    let inner_table_display = document.createElement("td");
    inner_table_display.classList.add("mahjong-table-display");
    inner_table_display.textContent = mahjongTable.table_no.toString();
    innerRows[1].appendChild(inner_table_display);
    let south = new PlayerTag({
        parent: innerRows[1],
        tableNo: mahjongTable.table_no,
        seat: "south",
    });
    // east (bottom)
    innerRows[2].appendChild(document.createElement("td"));
    let east = new PlayerTag({
        parent: innerRows[2],
        tableNo: mahjongTable.table_no,
        seat: "east",
    });
    let deleteButtonCell = document.createElement("td");
    let deleteButton = new DeleteButton({
        parent: deleteButtonCell,
        tableNo: mahjongTable.table_no,
    });
    innerRows[2].appendChild(deleteButtonCell);
    /*
    let players = [east, south, west, north];
    // listen to inputs within this table so we can update table data across all of them
    innerTable.addEventListener('input', (ev) => {

        // find the input and thus player corresponding to the event target
        let target = ev.target;
        if (!(target instanceof HTMLElement)) return;
        let input = players.map((v) => v.nameTag.element).find((v) => v.isSameNode(target));
        if (!input) {
            console.error("Input registered in table outside of a nameTag input at:", ev.target);
            throw new Error("unidentified input in table update");
        }
        let player = players.find((v) => v.nameTag.element == input);
        if (!player) {
            console.error("Could not identify the player this nameTag belongs to:", input);
            throw new Error("undefined player in table update");
        }
        for (const otherPlayer of players.filter((v) => v != player)) {
            // update the other players with the new tabledata
            otherPlayer.update(player.table);
        }
    })
    */

    // add the rows to the table and return the table
    innerRows.forEach((i) => innerTable.appendChild(i));
    return innerTable;
}
