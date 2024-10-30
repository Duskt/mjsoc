import Component, { Params } from ".";
import { manualRegister } from "../request";

export default class MemberGrid extends Component<"table"> {
    memberElems: {
        [id: Member["id"]]: HTMLLIElement;
    };
    showAbsent: boolean;
    constructor(params: Params<'table'>) {
        super({
            tag: "table",
            ...params,
        });
        this.memberElems = {};
        this.updateMembers();
        document.addEventListener("mjPointTransfer", () => {
            this.updateMembers();
        });
        this.showAbsent = false;
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
        if (!this.showAbsent) return;
        let present = new Component({
            tag: "th",
            textContent: "Reg.",
            parent: headerRow.element,
        });
        present.element.style.fontSize = "12px";
    }
    updateMembers() {
        this.renderNewHeaders(); // also clears children
        [...window.MJDATA.members]
            .sort((a, b) => {
                if (this.showAbsent) {
                    return (
                        b.tournament.total_points - a.tournament.total_points
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
    renderLi(member: Member) {
        if (!member.tournament.registered && !this.showAbsent) return;
        let row = new Component({
            tag: "tr",
            parent: this.element,
        });
        let name = new Component({
            tag: "td",
            textContent: member.name,
            parent: row.element,
        });
        if (this.showAbsent && member.tournament.registered) {
            name.element.style["fontWeight"] = "bold";
        }
        let pointsTd = new PointsTd({
            points: this.showAbsent
                ? member.tournament.total_points
                : member.tournament.session_points,
            parent: row.element,
        });
        if (!this.showAbsent) {
            return;
        }
        let presentTd = new Component({
            tag: "td",
            parent: row.element,
        });
        let checkbox = new Component({
            tag: "input",
            classList: ["present-checkbox"],
            parent: presentTd.element,
            other: {
                type: "checkbox",
                checked: member.tournament.registered,
                onchange: async () => {
                    await manualRegister({ memberId: member.id });
                },
            },
        });
    }
}

interface PointsTdParams extends Params<'td'> {
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
