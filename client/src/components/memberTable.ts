import Component, { Params } from ".";
import { AppError } from "../errors";
import { editMember, manualRegister } from "../request";
import FocusNode from "./input/focus/focusNode";
import { isSat } from "./seatingUtils";

export default class MemberGrid extends Component<"table"> {
    memberElems: {
        [id: Member["id"]]: [Component<"tr">, NameTd]; // parent row, name, crown
    } = {};
    showAbsent: boolean;
    crowns: Component<"span">[] = [];
    constructor(params: Params<"table">) {
        super({
            tag: "table",
            ...params,
        });
        this.updateMembers();
        this.showAbsent = false;
        document.addEventListener("mjPointTransfer", (ev) => {
            this.updateMembers();
        });
        document.addEventListener("mjEditTable", (ev) => {
            this.updateSatMembers();
        });
    }
    renderNewHeaders() {
        this.element.innerHTML = "";
        let headerRow = new Component({
            tag: "tr",
            parent: this.element,
        });
        let name = new Component({
            tag: "th",
            textContent: "Name",
            parent: headerRow.element,
        });
        let points = new Component({
            tag: "th",
            textContent: this.showAbsent ? "Total" : "Pts.",
            parent: headerRow.element,
        });
        let regCount = window.MJDATA.members.filter(
            (m) => m.tournament.registered
        ).length;
        let present = new Component({
            tag: "th",
            textContent: `Reg. (${regCount})`,
            parent: headerRow.element,
        });
        present.element.style.width = "10px";
        present.element.style.fontSize = "12px";
    }
    updateMembers() {
        this.renderNewHeaders(); // also clears children
        [...window.MJDATA.members]
            .sort((a, b) => {
                if (this.showAbsent) {
                    return (
                        b.tournament.total_points +
                        b.tournament.session_points -
                        (a.tournament.total_points +
                            a.tournament.session_points)
                    );
                } else {
                    return (
                        b.tournament.session_points -
                        a.tournament.session_points
                    );
                }
            })
            .forEach((m) => this.renderMember(m));
        this.renderWinnerCrowns();
    }
    updateSatMembers() {
        let mId: any;
        let td: NameTd;
        for (mId in this.memberElems) {
            td = this.memberElems[mId][1];
            if (td.member.tournament.registered) {
                if (!isSat(td.member)) {
                    td.element.style.color = "red";
                    td.element.style.fontWeight = "bold";
                } else if (this.showAbsent) {
                    td.element.style.color = "";
                    td.element.style.fontWeight = "bold";
                } else {
                    td.element.style.color = "";
                    td.element.style.fontWeight = "";
                }
            } else {
                td.element.style.color = "";
                td.element.style.fontWeight = "";
            }
        }
    }
    renderWinnerCrowns() {
        this.crowns.forEach((c) => c.element.remove());
        this.crowns = [];
        let maxPts = Math.max(
            ...window.MJDATA.members.map(
                (m) => m.tournament.session_points + m.tournament.total_points
            )
        );
        let winners = window.MJDATA.members.filter(
            (m) =>
                m.tournament.session_points + m.tournament.total_points ===
                maxPts
        );
        let wMember: Member;
        for (wMember of winners) {
            let wRow = (this.memberElems[wMember.id] || [undefined, undefined])[0];
            if (wRow === undefined) continue;
            this.renderCrown(wRow);
        }
    }
    renderCrown(row: Component<"tr">) {
        row.element.style.position = "relative";
        let crown = new Component({
            tag: "span",
            textContent: "👑",
            classList: ["winner-crown"],
            parent: row.element,
        });
        this.crowns.push(crown);
    }
    renderMember(member: Member) {
        if (!member.tournament.registered && !this.showAbsent) return;
        let row = new Component({
            tag: "tr",
            parent: this.element,
        });
        let name = new NameTd(member, {
            parent: row.element,
        });
        if (member.tournament.registered) {
            if (!isSat(member)) {
                name.element.style.color = "red";
                name.element.style.fontWeight = "bold";
            } else if (this.showAbsent) {
                name.element.style.fontWeight = "bold";
            }
        }
        let pointsTd = new PointsTd({
            points: this.showAbsent
                ? member.tournament.total_points +
                  member.tournament.session_points
                : member.tournament.session_points,
            parent: row.element,
        });
        let presentTd = new Component({
            tag: "td",
            parent: row.element,
        });
        presentTd.element.style.padding = "0";
        let checkbox = new Component({
            tag: "input",
            classList: ["present-checkbox"],
            parent: presentTd.element,
            other: {
                type: "checkbox",
                checked: member.tournament.registered,
                onchange: async () => {
                    let r = await manualRegister(
                        { memberId: member.id },
                        true, // leaveTables
                        checkbox.element
                    );
                    if (!r) {
                        alert("Please try again.");
                        window.location.reload();
                    }
                },
            },
        });
        this.memberElems[member.id] = [row, name]
    }
}

interface PointsTdParams extends Params<"td"> {
    points: number;
}

class PointsTd extends Component<"td"> {
    constructor(params: PointsTdParams) {
        super({
            tag: "td",
            textContent: params.points.toString(),
            ...params,
        });
        this.element.style["backgroundColor"] =
            params.points > 0
                ? "green"
                : params.points === 0
                ? "yellow"
                : "red";
    }
}

class NameTd extends FocusNode<"td"> {
    member: Member;
    input: Component<"input">;
    keyListener: (ev: KeyboardEvent) => void;
    dblclickListener: (ev: MouseEvent) => void;
    constructor(member: Member, params: Params<"td">) {
        super({
            tag: "td",
            textContent: member.name,
            ...params,
        });
        this.member = member;
        this.input = new Component({
            tag: "input",
            other: {
                value: member.name,
            },
        });
        this.input.element.style.fontSize = "16px";
        this.input.element.style.margin = "0";
        this.input.element.style.width = "90%";
        this.keyListener = async (ev) => {
            if (ev.key === "Enter") {
                let r = await editMember({
                    id: member.id,
                    newMember: {
                        id: member.id,
                        name: this.input.element.value,
                        tournament: member.tournament,
                        council: member.council,
                    },
                });
                if (r instanceof AppError) return;
            }
            if (ev.key === "Escape" || ev.key === "Enter") {
                this.deactivate();
            }
        };
        this.dblclickListener = (ev) => {
            this.activate();
        };
        this.element.addEventListener("dblclick", this.dblclickListener);
    }
    activate(): this {
        super.activate();
        this.element.style.padding = "0";
        this.element.innerHTML = "";
        this.element.appendChild(this.input.element);
        this.input.element.addEventListener("keydown", this.keyListener);
        this.input.element.focus();
        return this;
    }
    deactivate(): this {
        super.deactivate();
        this.input.element.removeEventListener("keydown", this.keyListener);
        this.element.innerHTML = "";
        this.element.style.padding = "";
        this.element.textContent = this.member.name;
        return this;
    }
}
