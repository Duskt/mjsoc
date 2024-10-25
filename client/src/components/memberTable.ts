import Component, { ComponentParameters } from ".";
import { manualRegister } from "../request";

abstract class MemberList<
    K extends keyof HTMLElementTagNameMap
> extends Component<K> {
    memberElems: {
        [id: Member["id"]]: HTMLLIElement;
    };
    showAbsent: boolean;
    constructor(params: ComponentParameters<K>) {
        super(params);
        this.memberElems = {};
        this.updateMembers();
        document.addEventListener("mjPointTransfer", () => {
            this.updateMembers();
        });
        this.showAbsent = false;
    }
    abstract renderLi(member: Member): void;
    updateMembers() {
        // clear
        this.memberElems = {};
        while (this.element.lastChild) {
            this.element.removeChild(this.element.lastChild);
        }
        [...window.MJDATA.members]
            .sort(
                (a, b) =>
                    b.tournament.session_points - a.tournament.session_points
            )
            .forEach((m) => this.renderLi(m));
    }
}

export default class MemberGrid extends MemberList<"table"> {
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
        let highlight =
            member.tournament.session_points > 0
                ? "green"
                : member.tournament.session_points === 0
                ? "yellow"
                : "red";
        let points = new Component({
            tag: "td",
            textContent: member.tournament.session_points.toString(),
            parent: row.element,
        });
        points.element.style["backgroundColor"] = highlight;
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
