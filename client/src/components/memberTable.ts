import Component, { Params } from ".";
import { editMember, manualRegister } from "../request";
import FocusNode from "./input/focus/focusNode";
import { isSat } from "./seatingUtils";

export default class MemberGrid extends Component<"table"> {
    memberElems: {
        [id: Member["id"]]: HTMLLIElement;
    };
    nameTds: NameTd[] = [];
    showAbsent: boolean;
    constructor(params: Params<"table">) {
        super({
            tag: "table",
            ...params,
        });
        this.memberElems = {};
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
            .forEach((m) => this.renderLi(m));
    }
    updateSatMembers() {
        let td: NameTd;
        for (td of this.nameTds) {
            if (isSat(td.member)) {
                td.element.style.color = "black";
            } else {
                td.element.style.color = "red";
            }
        }
    }
    renderLi(member: Member) {
        if (!member.tournament.registered && !this.showAbsent) return;
        let row = new Component({
            tag: "tr",
            parent: this.element,
        });
        let name = new NameTd(member, {
            parent: row.element,
        });
        this.nameTds.push(name);
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
                if (!r.ok) {
                    alert(
                        "An unknown error occurred trying to delete this member."
                    );
                    return;
                }
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
