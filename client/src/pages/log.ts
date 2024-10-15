import Component, { ComponentParameters } from "../components";

export default function logPage() {
    let logTable = document.getElementById("log-table");
    if (!(logTable instanceof HTMLTableElement)) {
        throw Error("Couldn't get log-table <table> element.");
    }
    logTable.classList.add("info-grid");
    renderLogsTable(logTable);
}

function renderLogsTable(parent: HTMLTableElement) {
    // clear the table
    parent.innerHTML = "";
    // render headings
    let headerRow = document.createElement("tr");
    parent.appendChild(headerRow);
    let points = document.createElement("th");
    points.textContent = "Points won (per loser)";
    points.style["width"] = "20%";
    headerRow.appendChild(points);
    let winner = document.createElement("th");
    winner.textContent = "Winner";
    headerRow.appendChild(winner);
    let losers = document.createElement("th");
    losers.textContent = "Loser(s)";
    headerRow.appendChild(losers);
    // re-render all logs
    for (let pt of window.MJDATA.log) {
        let logRow = new LogRow({
            parent,
            transfer: pt,
        });
    }
}

interface LogRowParams extends Omit<ComponentParameters<"tr">, "tag"> {
    transfer: PointTransfer;
}

class LogRow extends Component<"tr"> {
    points: Component<"td">;
    to: Component<"td">;
    from: Component<"td">;
    constructor(params: LogRowParams) {
        super({
            tag: "tr",
            ...params,
        });
        this.points = new Component({
            tag: "td",
            parent: this.element,
            textContent: params.transfer.points.toString(),
        });
        this.to = new Component({
            tag: "td",
            parent: this.element,
            textContent: memberNameFromId(params.transfer.to),
        });
        this.from = new Component({
            tag: "td",
            parent: this.element,
            textContent: params.transfer.from
                .map((mId) => memberNameFromId(mId))
                .join(","),
        });
    }
}

// todo: correctly localise util functions
function memberNameFromId(id: MemberId, fallback: string = "ERROR"): string {
    return window.MJDATA.members.find((m) => m.id === id)?.name || fallback;
}
