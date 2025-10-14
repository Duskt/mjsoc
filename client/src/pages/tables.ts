import Component, { Params } from '../components';
import DeleteButton from '../components/deleteButton';
import IconButton, { CircleButton } from '../components/icons';
import { InputListener, InputListenerParameters } from '../components/input/listener';
import Legend from '../components/legendPanel';
import PlayerTag from '../components/player';
import { allocateSeats, shuffleSeats } from '../components/seatingUtils';
import renderSidebar from '../components/sidebar';
import { pointBounce } from '../components/successAnim';
import { addTable, undoLog } from '../request';

export default function tables() {
    // the tables with players on are, confusingly, ordered into a table of tables
    renderTables();
    // the left sidebar contains leaderboard and player info
    renderSidebar();
    renderHeader();
    document.addEventListener('mjEditMember', () => renderTables());
    document.addEventListener('mjResetSession', () => {
        renderSidebar();
        renderTables();
    });
    document.addEventListener('mjRegister', () => {
        renderTables();
    });
    document.addEventListener('mjAddTable', () => renderTables());
}

function renderHeader() {
    let headerBar = document.getElementById('header-bar');
    if (headerBar == undefined) {
        throw Error('No element with header-bar id');
    }
    let headerToolbar = new Component({
        tag: 'span',
        parent: headerBar,
    });
    let sit = new IconButton({
        icon: 'fill',
        parent: headerToolbar.element,
        onclick: async (ev) => {
            await allocateSeats(false, true, sit.element);
            renderTables();
        },
        other: {
            title: 'Fill seats with players',
        },
    });

    let shuffle = new IconButton({
        icon: 'shuffle',
        parent: headerToolbar.element,
        onclick: async (ev) => {
            await shuffleSeats(shuffle.element);
            renderTables();
            let tablesGrid = document.getElementById('table');
            if (!tablesGrid) throw new Error("Couldn't find #table");
            tablesGrid.style.animation = 'shake 0.2s';
            window.setTimeout(() => (tablesGrid.style.animation = ''), 200);
        },
        other: {
            title: 'Randomize seating',
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
    let table_table = document.getElementById('table');
    if (!table_table) throw Error('No element with the table id is present.');
    // clear for re-render
    table_table.innerHTML = '';
    let tables: TableData[] = [...window.MJDATA.tables];
    tables = tables.sort((a, b) => a.table_no - b.table_no);
    try {
        tables = tables.concat(
            ...JSON.parse(window.sessionStorage.getItem('savedTables') || '[]').sort(
                (a: TableData, b: TableData) => b.table_no - a.table_no,
            ),
        );
    } catch {}
    let tablesAndNewButton = (tables as (TableData | undefined)[]).concat(undefined);
    let current_row = document.createElement('tr');
    let n_cols = 3; //Math.ceil(Math.sqrt(tablesAndNewButton.length));
    let index = 0;
    let td = document.createElement('td');
    for (const i of tablesAndNewButton) {
        if (index >= n_cols) {
            table_table.appendChild(current_row);
            current_row = document.createElement('tr');
            index = 0;
        }
        if (i === undefined) {
            let createTableButton = new CircleButton({
                textContent: '+',
                parent: td,
                classList: ['icon-button', 'create-table'],
                other: {
                    onclick: async (ev) => {
                        let r = await addTable(createTableButton.element);
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
        td = document.createElement('td');
        index++;
    }
    table_table.appendChild(current_row);
}

interface GameTableParameters extends Omit<InputListenerParameters<'table'>, 'tag'> {
    table: TableData;
}

class GameTable extends InputListener<'table'> {
    tableNo: TableNo;
    players: PlayerTag[];
    undoButton?: IconButton;
    buttonPanel: ButtonPanel;
    innerTableDisplay: Component<'td'>;
    constructor(params: GameTableParameters) {
        super({
            ...params,
            tag: 'table',
        });
        this.tableNo = params.table.table_no;
        let blank = (v: HTMLElement) => v.appendChild(document.createElement('td'));
        let innerRows = [
            document.createElement('tr'),
            document.createElement('tr'),
            document.createElement('tr'),
        ];
        innerRows.forEach((i) => this.element.appendChild(i));
        // top row
        blank(innerRows[0]);
        let west = new PlayerTag({
            parent: innerRows[0],
            tableNo: params.table.table_no,
            seat: 'west',
            disabled: this.tableNo < 0,
        });
        blank(innerRows[0]);
        // middle row
        let north = new PlayerTag({
            parent: innerRows[1],
            tableNo: params.table.table_no,
            seat: 'north',
            disabled: this.tableNo < 0,
        });
        this.innerTableDisplay = new Component({
            tag: 'td',
            classList: ['mahjong-table-display'],
            textContent: this.tableNo >= 0 ? this.tableNo.toString() : 'S',
            parent: innerRows[1],
        });
        this.buttonPanel = new ButtonPanel({
            table: params.table,
            parent: this.innerTableDisplay.element,
        });
        let south = new PlayerTag({
            parent: innerRows[1],
            tableNo: params.table.table_no,
            seat: 'south',
            disabled: this.tableNo < 0,
        });
        // bottom row
        blank(innerRows[2]);
        let east = new PlayerTag({
            parent: innerRows[2],
            tableNo: params.table.table_no,
            seat: 'east',
            disabled: this.tableNo < 0,
        });
        this.renderDeleteCell(innerRows[2]);
        this.players = [east, south, west, north];
        this.element.addEventListener('mjPointTransfer', (ev) => this.animatePointTransfer(ev));
        // upon pt transfer, add the undo button to this table
        document.addEventListener('mjPointTransfer', (ev) => {
            let log = ev.detail;
            if (ev.target instanceof HTMLElement && this.element.contains(ev.target)) {
                this.buttonPanel.toggleUndoButton(log.id);
            } else {
                this.buttonPanel.toggleUndoButton(undefined);
            }
        });
        this.element.addEventListener('mjEditTable', () =>
            this.buttonPanel.toggleUndoButton(undefined),
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
        let deleteButtonCell = document.createElement('td');
        let deleteButton = new DeleteButton({
            parent: deleteButtonCell,
            tableNo: this.tableNo,
            ondelete: () => {
                renderTables();
            },
        });
        parent.appendChild(deleteButtonCell);
    }
    generateListener(): EventListener {
        return (ev: Event) => {
            for (const player of this.players) {
                player.updateWinButton();
            }
        };
    }
    updateTable(tableNo: TableNo): void {
        throw Error('not imp.');
    }
}

interface ButtonPanelParams extends Params<'div'> {
    table: TableData;
}

class ButtonPanel extends Component<'div'> {
    table: TableData;
    undoButton?: IconButton;
    saveButton: IconButton;
    constructor(params: ButtonPanelParams) {
        super({
            tag: 'div',
            classList: ['button-panel'],
            ...params,
        });
        this.table = params.table;
        this.saveButton = new IconButton({
            icon: 'save',
            classList: ['icon-button', 'save-button'],
            parent: this.element,
            disabled: this.table.table_no < 0,
            onclick: (ev) => {
                // put in sessionstorage
                let ssTables: TableData[] = JSON.parse(
                    window.sessionStorage.getItem('savedTables') || '[]',
                );
                let newTable = { ...this.table };
                newTable.table_no = (Math.min(0, ...ssTables.map((t) => t.table_no)) -
                    1) as TableNo;
                ssTables.push(newTable);
                window.sessionStorage.setItem('savedTables', JSON.stringify(ssTables));
                let event = new CustomEvent('mjAddTable', {
                    detail: this.table,
                    bubbles: true,
                });
                this.saveButton.element.dispatchEvent(event);
            },
        });
        // render undoButton from sessionStorage
        let [logId, logTableNo] = (window.sessionStorage.getItem('undoButton') || '|').split('|');
        if (logTableNo && parseInt(logTableNo) === this.table.table_no) {
            this.toggleUndoButton(parseInt(logId));
        }
        // upon log edit from anywhere, remove undo button
        document.addEventListener('mjUndoLog', (ev) => {
            this.toggleUndoButton(undefined);
        });
    }
    toggleUndoButton(logId: Log['id'] | undefined) {
        if (this.undoButton) this.undoButton.element.remove();
        if (logId === undefined) {
            // don't remove sessionStorage - another table might have set their undoButton
            return;
        }
        window.sessionStorage.setItem('undoButton', `${logId}|${this.table.table_no}`);
        this.undoButton = new IconButton({
            icon: 'undo',
            parent: this.element,
            onclick: async (ev) => {
                let log = window.MJDATA.log.find((l) => l.id == logId);
                if (log === undefined) {
                    alert(
                        "That log couldn't be found - the webpage might have disconnected without uploading your win. Check with a member of the council; sorry!",
                    );
                    throw new Error('log not found');
                }
                await undoLog(
                    {
                        id: logId,
                    },
                    // ! because we're setting it here. idk what to say
                    this.undoButton!.element,
                );
                window.sessionStorage.removeItem('undoButton');
            },
        });
    }
}
