import Component, { Params } from "../components";
import HelpHoverTooltip from "../components/helpTooltip";
import IconButton from "../components/icons";
import { getMember, isMember, POINTS } from "../data";
import { AppError } from "../errors";
import { undoLog } from "../request";

const isNatural = (f: string) =>
    Array.from(f.trim()).every((i) => "0123456789".includes(i));
const isInteger = (f: string) =>
    isNatural(f) || (f[0] === "-" && isNatural(f.slice(1)));

type LogFilterPredicate = (log: Log, session_no?: number) => boolean;

const normalizeQueryString = (s: string) => s.trim().toLowerCase();

function getIntegerMatchPredicate(subquery: number): LogFilterPredicate {
    return (l, sn) => l.faan === subquery || sn === subquery;
}

function getNameMatchPredicate(subquery: string): LogFilterPredicate {
    subquery = normalizeQueryString(subquery);
    // get all of the member objects for everyone in log 'from' attr
    let logMemberIds = (l: Log) => l.from.concat(l.to);
    let logMembers = (l: Log) =>
        logMemberIds(l)
            .map(getMember)
            .filter((m) => isMember(m));
    let logMemberNames = (l: Log) =>
        logMembers(l).map((m) => normalizeQueryString(m.name));
    return (l: Log) => logMemberNames(l).includes(subquery);
}

function parseQuery(query: string): LogFilterPredicate {
    // for a query string, split by spaces into subqueries
    // every subquery must match
    // int subquery present in faan / session #
    // str subquery present in name of relevant players
    query = query.trim().toLowerCase();
    // using a predicate closure which contains a bunch of nested predicates fails in JS
    let predicateList: LogFilterPredicate[] = [(l, sn) => true];
    for (let sq of query.split(" ")) {
        if (sq === "") {
            continue;
        }
        if (isInteger(sq)) {
            let predicate: LogFilterPredicate = (l, sn) =>
                getIntegerMatchPredicate(parseInt(sq))(l, sn);
            predicateList.push(predicate);
        } else {
            let predicate: LogFilterPredicate = (l, sn) =>
                getNameMatchPredicate(sq)(l, sn);
            predicateList.push(predicate);
        }
    }
    return (l, sn) => predicateList.every((v) => v(l, sn));
}

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
        classList: ["info-grid", "log"],
        parent: mainChildDiv.element,
    });
    placeholderLogTable.replaceWith(mainChildDiv.element);
    let filterForm = new FilterForm({
        oninput: (ev, value) => {
            logTable.element.innerHTML = "";
            logTable.renderHeaders();
            logTable.renderLogs(parseQuery(value));
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
    help: HelpHoverTooltip;
    oninput: (ev: Event, value: string) => void;
    constructor({ oninput, ...params }: FilterParams) {
        super({
            tag: "form",
            id: "filter-form",
            ...params,
        });
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
        this.help = new HelpHoverTooltip({
            parent: this.element,
            width: "200px",
            message:
                "You can enter search terms such as names (included in log) or numbers (matches session # or faan).\nTerms are separated by spaces and every term must match a log.",
        });
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
        this.headers[0].element.style["width"] = "8%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Faan",
            })
        );
        this.headers[1].element.style["width"] = "8%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Win type",
            })
        );
        this.headers[2].element.style["width"] = "14%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Winner",
            })
        );
        this.headers[3].element.style["width"] = "20%";
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Losers",
            })
        );
        this.headers.push(
            new Component({
                tag: "th",
                parent: this.headerRow.element,
                textContent: "Del.",
            })
        );
        this.headers[5].element.style["width"] = "5%";
    }
    renderHeaders() {
        let header: Component<"th">;
        for (header of this.headers) {
            this.element.appendChild(header.element);
        }
    }
    renderLogs(
        filter: (log: Log, session: number | undefined) => boolean = () => true
    ) {
        this.logs = [];
        let reverseLog = [...window.MJDATA.log].reverse();
        let log: Log;
        let matchedIds: MemberId[] | undefined;
        let session: number | undefined;
        for (log of reverseLog) {
            if (log.disabled) continue;
            session =
                log.datetime === null
                    ? undefined
                    : this.weekMap.get(new Date(log.datetime).toDateString());
            if (!filter(log, session)) continue;
            /* if (memberIds !== undefined) {
                matchedIds = log.from
                    .concat(log.to)
                    .filter((m) => memberIds.includes(m));
                if (matchedIds.length === 0) continue;
            } */
            this.logs.push(
                new LogRow({
                    log,
                    parent: this.element,
                    boldIds: matchedIds,
                    session,
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
            onclick: this.disable,
        });
        this.disableButton.element.style.width = "16px";
        this.disableButton.element.style.paddingBottom = "26px";
    }
    async disable() {
        let r = await undoLog(
            {
                id: this.log.id,
            },
            this.element
        );
        if (r instanceof AppError) return;
        window.sessionStorage.removeItem("undoButton");
    }
}
