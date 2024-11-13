import Component, { Params } from "../components";
import IconButton from "../components/icons";
import { getMember, POINTS } from "../data";
import { undoLog } from "../request";

export default function logPage() {
    let placeholderLogTable = document.getElementById("log-table");
    if (!(placeholderLogTable instanceof HTMLTableElement)) {
        throw Error("Couldn't get log-table <table> element.");
    }
    let mainChildDiv = new Component({
        tag: "div",
    });
    mainChildDiv.element.style.width = "100%";
    let logTable = new LogTable({
        classList: ["info-grid"],
        parent: mainChildDiv.element,
    });
    placeholderLogTable.replaceWith(mainChildDiv.element);
    let filterForm = new FilterForm({
        oninput: (ev, value) => {
            let members: Member[] | undefined;
            if (value.trim() !== "") {
                members = window.MJDATA.members.filter((m) =>
                    m.name.trim().includes(value.trim())
                );
            }
            logTable.element.innerHTML = "";
            logTable.renderHeaders();
            logTable.renderLogs(
                members === undefined ? members : members.map((m) => m.id)
            );
        },
    });
    logTable.element.insertAdjacentElement("beforebegin", filterForm.element);
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

interface FilterParams extends Params<"form"> {
    oninput: (ev: Event, value: string) => void;
}

class FilterForm extends Component<"form"> {
    input: Component<"input">;
    label: Component<"label">;
    oninput: (ev: Event, value: string) => void;
    constructor({ oninput, ...params }: FilterParams) {
        super({
            tag: "form",
            ...params,
        });
        this.element.style.flexDirection = "row";
        this.element.style.justifyContent = "center";
        this.element.style.width = "100%";
        this.element.style.maxWidth = "initial";
        this.label = new Component({
            tag: "label",
            textContent: "Filter:",
            parent: this.element,
        });
        this.oninput = oninput;
        this.input = new Component({
            tag: "input",
            parent: this.element,
            other: {
                placeholder: "Enter a name",
            },
        });
        this.input.element.style.width = "auto";
        this.input.element.style.fontSize = "12px";
        this.input.element.oninput = (ev) =>
            this.oninput(ev, this.input.element.value);
    }
}

class LogTable extends Component<"table"> {
    headerRow: Component<"tr">;
    headers: Component<"th">[];
    logs: LogRow[];
    weekMap: Map<string, number>;
    constructor(params: Params<"table">) {
        super({
            tag: "table",
            ...params,
        });
        this.element.style.marginTop = "10px";
        this.element.style.marginInline = "20px";
        this.element.style.width = "100%";
        this.headerRow = new Component({
            tag: "tr",
            parent: this.element,
        });
        this.weekMap = new Map();
        let sessionNo = 1;
        let date: string;
        window.MJDATA.log
            .map((l) => l.datetime)
            .filter((d) => d !== null)
            .sort()
            .forEach((d) => {
                date = new Date(d).toDateString();
                if (this.weekMap.has(date)) return;
                this.weekMap.set(date, sessionNo);
                sessionNo++;
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
                textContent: "Session",
            })
        );
        this.headers[0].element.style["width"] = "5%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Faan",
            })
        );
        this.headers[1].element.style["width"] = "5%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Win type",
            })
        );
        this.headers[2].element.style["width"] = "10%";
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
    renderLogs(memberIds?: MemberId[]) {
        this.logs = [];
        let reverseLog = [...window.MJDATA.log].reverse();
        let log: Log;
        let matchedIds: MemberId[] | undefined;
        for (log of reverseLog) {
            if (log.disabled) continue;
            if (memberIds !== undefined) {
                matchedIds = log.from
                    .concat(log.to)
                    .filter((m) => memberIds.includes(m));
                if (matchedIds.length === 0) continue;
            }
            this.logs.push(
                new LogRow({
                    log,
                    parent: this.element,
                    boldIds: matchedIds,
                    session:
                        log.datetime === null
                            ? undefined
                            : this.weekMap.get(
                                  new Date(log.datetime).toDateString()
                              ),
                })
            );
        }
    }
}

interface LogRowParams extends Params<"tr"> {
    log: Log;
    boldIds?: MemberId[];
    session?: number;
}

class LogRow extends Component<"tr"> {
    log: Log;
    dateTd: Component<"td">;
    faanTd: Component<"td">;
    modeTd: Component<"td">;
    toTd: Component<"td">;
    fromTd: Component<"td">;
    disableTd: Component<"td">;
    disableButton: Component<"button">;
    constructor({
        session = undefined,
        boldIds = [],
        ...params
    }: LogRowParams) {
        super({
            tag: "tr",
            ...params,
        });
        this.log = params.log;
        let win_kind = params.log.win_kind;
        this.dateTd = new Component({
            tag: "td",
            parent: this.element,
            textContent:
                session === undefined
                    ? params.log.datetime === null
                        ? "(Date unknown)"
                        : new Date(params.log.datetime).toDateString()
                    : session.toString(),
        });
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
        if (boldIds.includes(params.log.to))
            this.toTd.element.style.fontWeight = "bold";
        this.fromTd = new Component({
            tag: "td",
            parent: this.element,
        });
        let mId: MemberId;
        let memberSpan: HTMLSpanElement | undefined;
        for (mId of params.log.from) {
            if (memberSpan !== undefined)
                this.fromTd.element.appendChild(document.createTextNode(", "));
            memberSpan = document.createElement("span");
            memberSpan.textContent = getMember(mId).name;
            if (boldIds.includes(mId)) memberSpan.style.fontWeight = "bold";
            this.fromTd.element.appendChild(memberSpan);
        }
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
            if (r !== undefined && r.ok)
                window.sessionStorage.removeItem("undoButton");
        });
    }
}
