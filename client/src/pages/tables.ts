import Component from "../components";
import DeleteButton from "../components/deleteButton";
import IconButton from "../components/icons";
import {
    InputListener,
    InputListenerParameters,
} from "../components/input/listener";
import PlayerTag from "../components/player";
import { allocateSeats, shuffleSeats } from "../components/seatingUtils";
import renderSidebar from "../components/sidebar";
import { UsesTable } from "../data";
import { request } from "../request";

export default function tables() {
    // the tables with players on are, confusingly, ordered into a table of tables
    renderTables();
    document.addEventListener("mjEditMember", (ev) => renderTables());
    // the left sidebar contains leaderboard and player info
    renderSidebar();
    renderHeader();
}

function renderHeader() {
    let headerBar = document.getElementById("header-bar");
    if (headerBar == undefined) {
        throw Error("No element with header-bar id");
    }
    let sit = new IconButton({
        icon: "fill",
        other: {
            onclick: async (ev) => {
                await allocateSeats();
                renderTables();
            },
        },
    });
    
    headerBar.children[0].insertAdjacentElement("beforebegin", sit.element);
    let shuffle = new IconButton({
        icon: "shuffle",
        parent: headerBar,
        other: {
            onclick: async (ev) => {
                await shuffleSeats();
                renderTables();
            },
        },
    });
}

/* Renders (or updates) all of the tables at once.
 * Order the tables into the table_table with an appropriate number of columns
 * and rows. Prefer an extra column to an extra row when a square cannot be used.

 * First get the number of columns: the ceiling of the sqrt (e.g. 2-> ?x2, 4 -> ?x2, 6 -> ?x3)
 * then infer rows. Then fill the rows from the left!
 * An extra table is added into n_tables, which will be used for the '+' (create table) button.
**/
function renderTables() {
    let table_table = document.getElementById("table");
    if (!table_table) throw Error("No element with the table id is present.");
    // clear for re-render
    table_table.innerHTML = "";
    let tables: (TableData | undefined)[] = [];
    // mjdata.tables sorted by table_no
    let sorted_tabledata = [...window.MJDATA.tables].sort(
        (a, b) => a.table_no - b.table_no
    );
    tables = tables.concat(sorted_tabledata).concat([undefined]);

    let current_row = document.createElement("tr");
    let n_cols = Math.ceil(Math.sqrt(tables.length));
    let index = 0;
    let td = document.createElement("td");
    for (const i of tables) {
        if (index >= n_cols) {
            table_table.appendChild(current_row);
            current_row = document.createElement("tr");
            index = 0;
        }
        if (i === undefined) {
            let createTableButton = new Component({
                tag: "button",
                textContent: "+",
                parent: td,
                classList: ["create-table"],
                other: {
                    onclick: async (ev) => {
                        let r = await request("/tables", {}, "POST");
                        window.MJDATA.tables.push(await r.json());
                        renderTables();
                    },
                },
            });
        } else {
            let gameTable = new GameTable({
                parent: td,
                table: i,
            });
        }
        current_row.appendChild(td);
        td = document.createElement("td");
        index++;
    }
    table_table.appendChild(current_row);
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
            ondelete: () => {
                renderTables();
            },
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
