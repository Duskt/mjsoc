import Component, { Params } from "../components";
import IconButton from "../components/icons";
import { getMember, POINTS } from "../data";

export default function logPage() {
    let logTable = document.getElementById("log-table");
    if (!(logTable instanceof HTMLTableElement)) {
        throw Error("Couldn't get log-table <table> element.");
    }
    logTable.classList.add("info-grid");
    renderLogsTable(logTable);
}

function getFaanFromPoints(points: number, n_losers: number) {
    if (n_losers == 1) {
        points = points / 2;
    }
    for (let [faan, pts] of POINTS.entries()) {
        if (pts == points) return faan;
    }
    return undefined;
}

function renderLogsTable(parent: HTMLTableElement) {
    // clear the table
    parent.innerHTML = "";
    // render headings
    let headerRow = document.createElement("tr");
    parent.appendChild(headerRow);
    let faan = document.createElement("th");
    faan.textContent = "Faan";
    headerRow.appendChild(faan);
    let points = document.createElement("th");
    points.textContent = "Points /n";
    points.style["width"] = "20%";
    headerRow.appendChild(points);
    let winner = document.createElement("th");
    winner.textContent = "Winner";
    headerRow.appendChild(winner);
    let losers = document.createElement("th");
    losers.textContent = "Loser(s)";
    headerRow.appendChild(losers);
    // re-render all logs
    let reverseLog = window.MJDATA.log;
    reverseLog.reverse();
    for (let l of reverseLog) {
        let logRow = new LogRow({
            parent,
            log: l,
        });
    }
}

interface LogRowParams extends Params<"tr"> {
    log: Log;
}

class LogRow extends Component<"tr"> {
    faan: Component<"td">;
    points: Component<"td">;
    to: Component<"td">;
    from: Component<"td">;
    disable: Component<"td">;
    constructor(params: LogRowParams) {
        super({
            tag: "tr",
            ...params,
        });
        this.faan = new Component({
            tag: "td",
            parent: this.element,
            textContent:
                getFaanFromPoints(
                    params.log.points,
                    params.log.from.length
                )?.toString() || "???",
        });
        this.points = new Component({
            tag: "td",
            parent: this.element,
            textContent: params.log.points.toString(),
        });
        this.to = new Component({
            tag: "td",
            parent: this.element,
            textContent: getMember(params.log.to).name,
        });
        this.from = new Component({
            tag: "td",
            parent: this.element,
            textContent: params.log.from
                .map((mId) => getMember(mId).name)
                .join(","),
        });
        this.disable = new Component({
            tag: "td",
            // TODO parent: this.element,
        });
        this.disable.element.style.paddingBottom = "0";
        this.disable.element.style.border = "none";
        let disableButton = new IconButton({
            icon: "trash",
            parent: this.disable.element,
            onclick: (ev) => alert("del"),
        });
    }
}
