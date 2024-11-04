import Component, { Params } from ".";
import {
    addMember,
    editMember,
    manualRegister,
    resetSession,
} from "../request";
import IconButton from "./icons";
import Dialog, { ConfirmationDialog } from "./input/focus/dialog";
import {
    DropdownButton,
    DropdownButtonParameters,
} from "./input/focus/dropdown";
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
        window.sessionStorage.setItem("sidebar", "closed");
        main_article.removeAttribute("style");
        sidebar.removeAttribute("style"); // source of disgrace
        sidebar.classList.replace("open", "closed");
        sidebarButton.element.textContent = ">";
    };

    let openSidebar = () => {
        window.sessionStorage.setItem("sidebar", "open");
        sidebar.classList.replace("closed", "open");
        if (window.innerWidth < 900) {
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
    if (window.sessionStorage.getItem("sidebar") === "open") {
        openSidebar();
    }
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
    let addMemberDialog = document.getElementById("add-member-dialog");
    if (!(addMemberDialog instanceof HTMLDialogElement))
        throw new Error("Couldn't find add member dialog");
    let dialog = new Dialog({
        element: addMemberDialog,
        activator: editMembersBar.addButton,
    });
    let memberList = new MemberGrid({
        parent: innerSidebar.element,
        classList: ["info-grid"],
    });

    // dialog isn't added as a child of listener
    document.addEventListener("mjEditMember", (ev) => {
        memberList.updateMembers();
        editMembersBar.removeButton.update();
        editMembersBar.register.updateMembers();
    });
    document.addEventListener("mjAddMember", (ev) => {
        memberList.updateMembers();
        editMembersBar.removeButton.update();
        editMembersBar.register.updateMembers();
    });
    sidebar.addEventListener("mjRegister", (ev) => {
        // optimize
        memberList.updateMembers();
        editMembersBar.register.input.element.value = "";
    });

    form.onsubmit = async (ev) => {
        ev.preventDefault();
        let name = new FormData(form).get("name")?.toString();
        if (!name) {
            throw Error("no name");
        }
        await addMember({ name }, form);
    };
    form.addEventListener("mjAddMember", () => dialog.deactivate());
    editMembersBar.checkbox.element.onchange = () => {
        memberList.showAbsent = editMembersBar.checkbox.element.checked;
        memberList.updateMembers();
    };
}

class EditMembersBar extends Component<"div"> {
    register: Register;
    topDiv: Component<"div">;
    resetButton: IconButton;
    bottomDiv: Component<"div">;
    addButton: Component<"button">;
    removeButton: RemoveMemberButton;
    checkbox: Component<"input">;
    constructor(params: Params<"div">) {
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
                title: "Show all members?",
                type: "checkbox",
            },
        });
        this.resetButton = new IconButton({
            icon: "reset",
            parent: this.topDiv.element,
            other: {
                title: "Reset the session (prompted to confirm)",
            },
        });
        this.resetButton.element.style.margin = "10px";
        let confirmation = new ConfirmationDialog({
            activator: this.resetButton,
            parent: this.topDiv.element, // NOT INSIDE THE BUTTON otherwise it will reactivate itself
            message:
                "Are you sure you want to reset the session?\n\nThis will sum the current points to each member's total points. This cannot be undone. It will also mark everyone as absent.",
            onconfirm: (ev) => resetSession(),
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
                            editMember({ id: m.id }, this.element),
                    },
                }).element
        );
    }
}

class Register extends Component<"form"> {
    label: Component<"label">;
    input: Component<"input">;
    datalist: Component<"datalist">;
    constructor(params: Params<"form">) {
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
            let r = manualRegister({ memberId }, this.input.element);
            r.then((success) => {
                if (!success) {
                    alert("Please try again.");
                    window.location.reload;
                }
            });
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
