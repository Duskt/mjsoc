import Component, { Params } from "../components";
import IconButton from "../components/icons";
import { getMember, POINTS } from "../data";
import { undoLog } from "../request";

export default function logPage() {
    let logTable = document.getElementById("log-table");
    if (!(logTable instanceof HTMLTableElement)) {
        throw Error("Couldn't get log-table <table> element.");
    }
    logTable.replaceWith(
        new LogTable({
            classList: ["info-grid"],
        }).element
    );
}

function getFaanFromPoints(
    points: number,
    n_losers: number,
    win_kind?: WinKind
) {
    if (win_kind === "baozimo") {
        points = points / 3;
    } else if (win_kind === "dachut" || n_losers === 1) {
        points = points / 2;
    } // otherwise winkind is explicitly or implicitly zimo, points=points
    for (let [faan, pts] of POINTS.entries()) {
        if (pts == points) return faan;
    }
    return undefined;
}

class LogTable extends Component<"table"> {
    headerRow: Component<"tr">;
    headers: Component<"th">[];
    logs: LogRow[];
    constructor(params: Params<"table">) {
        super({
            tag: "table",
            ...params,
        });
        this.element.style.marginTop = "40px";
        this.headerRow = new Component({
            tag: "tr",
            parent: this.element,
        });
        this.headers = [];
        this.logs = [];
        this.createHeaders();
        this.renderLogs();
        this.element.addEventListener("mjUndoLog", () => {
            console.log("editlog");
            this.element.innerHTML = "";
            this.renderHeaders();
            this.renderLogs();
        });
    }
    /**
     * Also renders the headers automatically.
     */
    createHeaders() {
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Faan",
            })
        );
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Win type",
            })
        );
        this.headers[1].element.style["width"] = "20%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Winner",
            })
        );
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Losers",
            })
        );
    }
    renderHeaders() {
        let header: Component<"th">;
        for (header of this.headers) {
            this.element.appendChild(header.element);
        }
    }
    renderLogs() {
        this.logs = [];
        let reverseLog = [...window.MJDATA.log].reverse();
        let log: Log;
        for (log of reverseLog) {
            if (log.disabled) continue;
            this.logs.push(
                new LogRow({
                    log,
                    parent: this.element,
                })
            );
        }
    }
}

interface LogRowParams extends Params<"tr"> {
    log: Log;
}

class LogRow extends Component<"tr"> {
    log: Log;
    faanTd: Component<"td">;
    modeTd: Component<"td">;
    toTd: Component<"td">;
    fromTd: Component<"td">;
    disableTd: Component<"td">;
    disableButton: Component<"button">;
    constructor(params: LogRowParams) {
        super({
            tag: "tr",
            ...params,
        });
        this.log = params.log;
        let win_kind = params.log.win_kind;
        this.faanTd = new Component({
            tag: "td",
            parent: this.element,
            textContent: params.log.faan
                ? params.log.faan.toString()
                : getFaanFromPoints(
                      params.log.points,
                      params.log.from.length,
                      win_kind === null ? undefined : win_kind
                  )?.toString() || "???",
        });
        // 自摸 打出 包自摸
        this.modeTd = new Component({
            tag: "td",
            parent: this.element,
            textContent:
                win_kind === "zimo" || params.log.from.length > 1
                    ? "自摸"
                    : win_kind === "dachut"
                    ? "打出"
                    : win_kind === "baozimo"
                    ? "包自摸"
                    : "打出?",
        });
        this.toTd = new Component({
            tag: "td",
            parent: this.element,
            textContent: getMember(params.log.to).name,
        });
        this.fromTd = new Component({
            tag: "td",
            parent: this.element,
            textContent: params.log.from
                .map((mId) => getMember(mId).name)
                .join(", "),
        });
        this.disableTd = new Component({
            tag: "td",
            parent: this.element,
        });
        this.disableTd.element.style.paddingBottom = "0";
        this.disableTd.element.style.border = "none";
        this.disableButton = new IconButton({
            icon: "trash",
            parent: this.disableTd.element,
            onclick: async (ev) => this.disable(),
        });
    }
    disable() {
        undoLog(
            {
                id: this.log.id,
            },
            this.element
        ).then((r) => {
            if (r !== undefined && r.ok) window.sessionStorage.removeItem("undoButton");
        });
    }
}
