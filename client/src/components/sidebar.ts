import Component, { ComponentParameters } from ".";
import { request } from "../request";
import Dialog from "./input/focus/dialog";
import { DropdownButton } from "./input/focus/dropdown";

async function removeMember(mem: Member) {
    let r = await request("/members", { name: mem.name }, "DELETE");
    if (r.ok) {
        let index = window.MJDATA.members.indexOf(mem);
        window.MJDATA.members.splice(index, 1);
        for (let t of window.MJDATA.tables) {
            if (t.east === mem.id) t.east = 0;
            if (t.south === mem.id) t.south = 0;
            if (t.west === mem.id) t.west = 0;
            if (t.north === mem.id) t.north = 0;
        }
        return true;
    }
    return false;
}

export default function renderSidebar(onMemberChange: () => void = () => {}) {
    // container of sidebar and the button which opens it
    let sidebar = document.getElementById("sidebar");
    if (!(sidebar instanceof HTMLElement)) {
        throw Error("Could not find sidebar");
    }
    // the actual inner part of the sidebar
    let innerSidebar = new Component({
        tag: "div",
        parent: sidebar,
    });
    let sidebarButton = new Component({
        tag: "button",
        textContent: ">",
        parent: sidebar,
    });

    let closeSidebar = () => {
        sidebar.classList.replace("open", "closed");
        sidebarButton.element.textContent = ">";
    };

    let openSidebar = () => {
        sidebar.classList.replace("closed", "open");
        sidebarButton.element.textContent = "<";
    };

    // close by default (without transition)
    sidebar.style["transition"] = "none";
    sidebar.classList.add("closed");
    setTimeout(() => (sidebar.style["transition"] = ""), 1);

    sidebarButton.element.onclick = () => {
        if (sidebarButton.element.textContent == ">") openSidebar();
        else closeSidebar();
    };

    let addMemberButton = new Component({
        tag: "button",
        classList: ["member-button"],
        parent: innerSidebar.element,
        textContent: "Add a new member",
        other: {
            id: "add-member",
        },
    });
    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
        throw Error("no form");
    }
    let dialog = new Dialog({
        tag: "dialog",
        element: document.getElementsByTagName("dialog")[0],
        activator: addMemberButton.element,
    });
    let memberList = new MemberGrid({
        tag: "table",
        classList: ["member-grid"],
    });
    addMemberButton.element.insertAdjacentElement(
        "afterend",
        memberList.element
    );

    let removeMemberButton = new DropdownButton({
        textContent: "Remove a member",
        classList: ["member-button"],
        parent: innerSidebar.element,
        options: [],
    });
    let updateRemoveMemberButton = () =>
        (removeMemberButton.dropdown.options = window.MJDATA.members.map(
            (m) =>
                new Component({
                    tag: "button",
                    textContent: m.name,
                    other: {
                        onclick: async (ev: MouseEvent) => {
                            if (await removeMember(m)) {
                                memberList.updateMembers();
                                onMemberChange();
                            }
                        },
                    },
                }).element
        ));
    updateRemoveMemberButton();

    let overrideContainer = new OverrideContainer({
        parent: innerSidebar.element,
    });

    form.onsubmit = (ev) => {
        ev.preventDefault();
        let name = new FormData(form).get("name");
        if (!name) {
            throw Error("no name");
        }
        request("/members", { name }, "POST").then((v) => {
            if (v.ok)
                v.json().then((v: Member) => {
                    window.MJDATA.members.push(v);
                    memberList.renderLi(v);
                    onMemberChange();
                    updateRemoveMemberButton();
                });
        });
        dialog.deactivate();
    };
}

abstract class MemberList<
    K extends keyof HTMLElementTagNameMap
> extends Component<K> {
    memberElems: {
        [id: Member["id"]]: HTMLLIElement;
    };
    constructor(params: ComponentParameters<K>) {
        super(params);
        this.memberElems = {};
        this.updateMembers();
        document.addEventListener("mjPointTransfer", () => {
            this.updateMembers();
        });
    }
    abstract renderLi(member: Member): void;
    updateMembers() {
        // clear
        this.memberElems = {};
        while (this.element.lastChild) {
            this.element.removeChild(this.element.lastChild);
        }
        [...window.MJDATA.members]
            .sort((a, b) => b.points - a.points)
            .forEach((m) => this.renderLi(m));
    }
}

class UlMemberList extends MemberList<"ul"> {
    renderLi(member: Member) {
        let melem = document.createElement("li");
        melem.textContent = `${member.name}: ${member.points}`;
        this.memberElems[member.id] = melem;
        this.element.appendChild(melem);
        return melem;
    }
}

class MemberGrid extends MemberList<"table"> {
    renderLi(member: Member) {
        let row = new Component({
            tag: "tr",
            parent: this.element,
        });
        let name = new Component({
            tag: "td",
            textContent: member.name,
            parent: row.element,
        });
        let highlight =
            member.points > 0
                ? "green"
                : member.points === 0
                ? "yellow"
                : "red";
        let points = new Component({
            tag: "td",
            textContent: member.points.toString(),
            parent: row.element,
        });
        points.element.style["backgroundColor"] = highlight;
    }
}

interface ToggleComponentParameters<K extends keyof HTMLElementTagNameMap>
    extends ComponentParameters<K> {
    mode: "block";
}

class ToggleComponent<
    K extends keyof HTMLElementTagNameMap
> extends Component<K> {
    hidden: boolean;
    mode: ToggleComponentParameters<K>["mode"];
    children: HTMLCollection;
    constructor(params: ToggleComponentParameters<K>) {
        super(params);
        this.hidden = false;
        this.mode = params.mode;
        this.children = document.createDocumentFragment().children;
    }

    show() {
        this.hidden = false;
        for (let item of Array.from(this.children)) {
            this.element.appendChild(item);
        }
        this.element.style["display"] = this.mode;
    }

    hide() {
        this.hidden = true;
        this.children = this.element.children;
        while (this.element.lastChild) {
            this.element.removeChild(this.element.lastChild);
        }
        this.element.style["display"] = "none";
    }

    toggle() {
        if (this.hidden) {
            this.show();
        } else {
            this.hide();
        }
    }
}

/** A container for the advanced option of manually overriding
 * the player data. Opens and closes with a regular toggled (not Focus)
 * button.
 */
class OverrideContainer extends Component<"div"> {
    toggleButton: Component<"button">;
    overridePanel: ToggleComponent<"div">;
    editContent: Component<"textarea">;
    submitButton: Component<"button">;
    constructor(params: Omit<ComponentParameters<"div">, "tag">) {
        super({
            tag: "div",
            classList: ["override-panel"],
            ...params,
        });
        this.toggleButton = new Component({
            tag: "button",
            textContent: "Advanced override panel",
            parent: this.element,
            classList: ["override-toggle"],
        });
        this.overridePanel = new ToggleComponent({
            tag: "div",
            mode: "block",
            parent: this.element,
        });
        this.editContent = new Component({
            tag: "textarea",
            parent: this.overridePanel.element,
        });
        this.submitButton = new Component({
            tag: "button",
            parent: this.overridePanel.element,
        });

        this.overridePanel.hide();
        // need to pass anon func otherwise the toggle's scope holds 'this' as the toggleButton
        this.toggleButton.element.onclick = () => this.overridePanel.toggle;
    }
}
