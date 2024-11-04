import Component from "../components";
import DeleteButton from "../components/deleteButton";
import IconButton from "../components/icons";
import {
    InputListener,
    InputListenerParameters,
} from "../components/input/listener";
import Legend from "../components/legendPanel";
import PlayerTag from "../components/player";
import { allocateSeats, shuffleSeats } from "../components/seatingUtils";
import renderSidebar from "../components/sidebar";
import { pointBounce } from "../components/successAnim";
import { UsesTable } from "../data";
import { request } from "../request";

export default function tables() {
    // the tables with players on are, confusingly, ordered into a table of tables
    renderTables();
    // the left sidebar contains leaderboard and player info
    renderSidebar();
    renderHeader();
    document.addEventListener("mjEditMember", () => renderTables());
    document.addEventListener("mjResetSession", () => {
        renderSidebar();
        renderTables();
    });
    document.addEventListener("mjRegister", () => {
        renderTables();
    });
}

function renderHeader() {
    let headerBar = document.getElementById("header-bar");
    if (headerBar == undefined) {
        throw Error("No element with header-bar id");
    }
    let sit = new IconButton({
        icon: "fill",
        onclick: async (ev) => {
            await allocateSeats();
            renderTables();
        },
        other: {
            title: "Fill seats with players",
        },
    });

    headerBar.children[0].insertAdjacentElement("beforebegin", sit.element);
    let shuffle = new IconButton({
        icon: "shuffle",
        parent: headerBar,
        onclick: async (ev) => {
            await shuffleSeats();
            renderTables();
            let tablesGrid = document.getElementById("table");
            if (!tablesGrid) throw new Error("Couldn't find #table");
            tablesGrid.style.animation = "shake 0.2s";
            window.setTimeout(() => (tablesGrid.style.animation = ""), 200);
            legendPanel.roundWind.updateWind();
            legendPanel.roundWind.setLock();
        },
        other: {
            title: "Randomize seating",
        },
    });
    let legendPanel = new Legend({
        parent: headerBar,
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
    let n_cols = 3; //Math.ceil(Math.sqrt(tables.length));
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
        this.element.addEventListener("mjPointTransfer", (ev) =>
            this.animatePointTransfer(ev)
        );
    }
    animatePointTransfer(ev: CustomEvent<Log>) {
        let winner = this.findPlayerTag(ev.detail.to);
        if (!winner) return;
        pointBounce(winner, ev.detail.points * ev.detail.from.length, {
            wind: winner.seat,
        });
        let loserId: MemberId;
        for (loserId of ev.detail.from) {
            let loser = this.findPlayerTag(loserId);
            if (!loser) continue;
            pointBounce(loser, -ev.detail.points, { wind: loser.seat });
        }
    }
    findPlayerTag(memberId: MemberId) {
        let p: PlayerTag;
        for (p of this.players) {
            if (p.memberId === memberId) {
                return p;
            }
        }
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
