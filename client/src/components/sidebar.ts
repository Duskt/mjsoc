import Component, { ComponentParameters } from ".";
import { editMemberList, manualRegister, request } from "../request";
import IconButton from "./icons";
import Dialog from "./input/focus/dialog";
import {
    DropdownButton,
    DropdownButtonParameters,
} from "./input/focus/dropdown";
import ToggleComponent from "./input/toggle";
import MemberGrid from "./memberTable";

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
        activator: editMembersBar.addButton.element,
    });
    let memberList = new MemberGrid({
        tag: "table",
        parent: innerSidebar.element,
        classList: ["info-grid"],
    });

    document.addEventListener("mjEditMember", (ev) => {
        memberList.updateMembers();
        editMembersBar.removeButton.update();
        editMembersBar.register.updateMembers();
        // todo: add event info to only do this for post?
        dialog.deactivate();
    });
    document.addEventListener("mjRegister", (ev) => {
        memberList.updateMembers();
        editMembersBar.register.input.element.value = "";
    });

    form.onsubmit = async (ev) => {
        ev.preventDefault();
        let name = new FormData(form).get("name")?.toString();
        if (!name) {
            throw Error("no name");
        }
        await editMemberList({ name }, "POST");
    };
    editMembersBar.checkbox.element.onchange = () => {
        memberList.showAbsent = editMembersBar.checkbox.element.checked;
        memberList.updateMembers();
    };
}

interface EditMembersBarParams
    extends Omit<ComponentParameters<"div">, "tag"> {}

class EditMembersBar extends Component<"div"> {
    register: Register;
    topDiv: Component<"div">;
    resetButton: Component<"button">;
    bottomDiv: Component<"div">;
    addButton: Component<"button">;
    removeButton: RemoveMemberButton;
    checkbox: Component<"input">;
    constructor(params: EditMembersBarParams) {
        super({
            tag: "div",
            ...params,
        });
        this.topDiv = new Component({
            tag: "div",
            parent: this.element,
        });
        this.register = new Register({ parent: this.topDiv.element });
        this.checkbox = new Component({
            tag: "input",
            parent: this.topDiv.element,
            classList: ["register-checkbox"],
            other: {
                type: "checkbox",
            },
        });
        this.resetButton = new IconButton({
            icon: "reset",
            parent: this.topDiv.element,
        });
        this.bottomDiv = new Component({
            tag: "div",
            parent: this.element,
        });
        this.addButton = new Component({
            tag: "button",
            classList: ["member-button"],
            parent: this.bottomDiv.element,
            textContent: "New member",
            other: {
                id: "add-member",
            },
        });
        this.removeButton = new RemoveMemberButton({
            parent: this.bottomDiv.element,
        });
        this.topDiv.element.style["display"] = "flex";
        this.bottomDiv.element.style["display"] = "flex";
    }
}

class RemoveMemberButton extends DropdownButton {
    constructor(params: DropdownButtonParameters) {
        super({
            textContent: "Delete member",
            classList: ["member-button"],
            options: [],
            ...params,
        });
        this.update();
    }
    update() {
        this.dropdown.options = window.MJDATA.members.map(
            (m) =>
                new Component({
                    tag: "button",
                    textContent: m.name,
                    other: {
                        onclick: async (ev: MouseEvent) =>
                            editMemberList({ name: m.name }, "DELETE"),
                    },
                }).element
        );
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
        this.updateMembers();
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
    updateMembers() {
        this.datalist.element.innerHTML = "";
        let member: Member;
        for (member of window.MJDATA.members) {
            this.renderOption(member);
        }
    }
    renderOption(member: Member) {
        let option = new Component({
            tag: "option",
            parent: this.datalist.element,
            textContent: member.name,
        });
    }
}
