import Component, { ComponentParameters } from ".";
import { editMemberList, manualRegister, request } from "../request";
import Dialog from "./input/focus/dialog";
import { DropdownButton } from "./input/focus/dropdown";

export default function renderSidebar() {
    // container of sidebar and the button which opens it
    let sidebar = document.getElementById("sidebar");
    let main_article = document.getElementById("tables");
    if (!(sidebar instanceof HTMLElement)) {
        throw Error("Could not find sidebar");
    }
    if (!(main_article instanceof HTMLElement)) {
        throw Error("Could not find main tables article");
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
        main_article.removeAttribute("style");
        sidebar.removeAttribute("style"); // source of disgrace
        sidebar.classList.replace("open", "closed");
        sidebarButton.element.textContent = ">";
    };

    let openSidebar = () => {
        sidebar.classList.replace("closed", "open");
        if (window.innerWidth < 800) {
            sidebar.style["width"] = "100%";
            main_article.style["display"] = "none";
        } else {
            sidebar.style["width"] = "30%";
        }
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

    let editMembersBar = new EditMembersBar({ parent: innerSidebar.element });

    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
        throw Error("no form");
    }
    let dialog = new Dialog({
        tag: "dialog",
        element: document.getElementsByTagName("dialog")[0],
        activator: editMembersBar.addMemberButton.element,
    });
    let memberList = new MemberGrid({
        tag: "table",
        parent: innerSidebar.element,
        classList: ["info-grid"],
    });

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
                        onclick: async (ev: MouseEvent) =>
                            editMemberList({ name: m.name }, "DELETE"),
                    },
                }).element
        ));
    updateRemoveMemberButton();
    document.addEventListener("mjEditMember", (ev) => {
        memberList.updateMembers();
        updateRemoveMemberButton();
        // todo: add event info to only do this for post?
        dialog.deactivate();
    });

    let overrideContainer = new OverrideContainer({
        parent: innerSidebar.element,
    });

    form.onsubmit = async (ev) => {
        ev.preventDefault();
        let name = new FormData(form).get("name")?.toString();
        if (!name) {
            throw Error("no name");
        }
        await editMemberList({ name }, "POST");
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
            .sort(
                (a, b) =>
                    b.tournament.session_points - a.tournament.session_points
            )
            .forEach((m) => this.renderLi(m));
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
            textContent:
                member.name + (member.tournament.registered ? "!" : ""),
            parent: row.element,
        });
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

interface EditMembersBarParams
    extends Omit<ComponentParameters<"div">, "tag"> {}

class EditMembersBar extends Component<"div"> {
    register: Register;
    addMemberButton: Component<"button">;
    constructor(params: EditMembersBarParams) {
        super({
            tag: "div",
            ...params,
        });
        this.element.style["display"] = "flex";
        this.register = new Register({ parent: this.element });
        this.addMemberButton = new Component({
            tag: "button",
            classList: ["member-button"],
            parent: this.element,
            textContent: "+",
            other: {
                id: "add-member",
            },
        });
    }
}

class Register extends Component<"form"> {
    label: Component<"label">;
    input: Component<"input">;
    datalist: Component<"datalist">;
    constructor(params: Omit<ComponentParameters<"form">, "tag">) {
        super({
            tag: "form",
            classList: ["register"],
            ...params,
        });
        this.label = new Component({
            tag: "label",
            textContent: "Register",
            parent: this.element,
            other: {
                htmlFor: "register",
            },
        });
        this.datalist = new Component({
            tag: "datalist",
            parent: this.element,
            other: {
                id: "registerList",
            },
        });
        // add options
        this.input = new Component({
            tag: "input",
            parent: this.element,
            other: {
                id: "register",
            },
        });
        this.input.element.setAttribute("list", "registerList");
        this.input.element.style["fontSize"] = "14px";
        this.element.onsubmit = (ev) => {
            ev.preventDefault();
            let memberId = window.MJDATA.members.find(
                (m) => m.name == this.input.element.value.trim()
            )?.id;
            if (memberId === undefined) throw new Error("no id AJDSBFI");
            manualRegister({ memberId });
        };
    }
}
