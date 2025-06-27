import Component, { Params } from ".";
import EditMembersPanel from "./editMembersPanel";
import MemberGrid from "./memberTable";

export default function renderSidebar() {
    // container of sidebar and the button which opens it
    let sidebar_elem = document.getElementById("sidebar");
    let main_article = document.getElementById("tables");
    if (!(sidebar_elem instanceof HTMLElement)) {
        throw Error("Could not find sidebar");
    }
    if (!(main_article instanceof HTMLElement)) {
        throw Error("Could not find main tables article");
    }
    let sidebar = new Sidebar({
        antagonist: main_article,
        element: sidebar_elem as HTMLDivElement,
    })

    // dialog isn't added as a child of listener
    document.addEventListener("mjEditMember", (ev) => {
        sidebar.membersTable.updateMembers();
        sidebar.editMembersPanel.removeButton.update();
        sidebar.editMembersPanel.register.updateMembers();
    });
    document.addEventListener("mjAddMember", (ev) => {
        sidebar.membersTable.updateMembers();
        sidebar.editMembersPanel.removeButton.update();
        sidebar.editMembersPanel.register.updateMembers();
    });
    sidebar.element.addEventListener("mjRegister", (ev) => {
        // optimize
        sidebar.membersTable.updateMembers();
        sidebar.editMembersPanel.register.input.element.value = "";
    });
    document.addEventListener("mjUndoLog", (ev) => {
        sidebar.membersTable.updateMembers();
    });
}

interface ExpandSidebarButtonParams extends Params<"button"> {
    open: () => void;
    close: () => void;
}

class ExpandSidebarButton extends Component<"button"> {
    isOpen: boolean = false;
    constructor({open, close, ...params}: ExpandSidebarButtonParams) {
        super({
            tag: "button",
            textContent: ">",
            ...params,
        });
    }
}

class ShowAllCheckboxPanel extends Component<"div"> {
    checkbox: Component<"input">;
    constructor(params: Params<"div">) {
        super({
            tag: "div",
            id: "show-all-checkbox-panel",
            textContent: "Show unregistered members?",
            ...params,
        });
        this.checkbox = new Component({
            tag: "input",
            classList: ["register-checkbox"],
            parent: this.element,
            other: {
                title: "Show all members?",
                type: "checkbox",
            },
        });
    }
}

interface SidebarParams extends Params<"div"> {
    antagonist: HTMLElement,
}

class Sidebar extends Component<"div"> {
    antagonist: HTMLElement;
    expandButton: ExpandSidebarButton;
    contents: Component<"div">;
    editMembersPanel: EditMembersPanel;
    showAllCheckboxPanel: ShowAllCheckboxPanel;
    membersTable: MemberGrid;
    constructor({ antagonist, ...params }: SidebarParams) {
        super({
            tag: "div",
            id: "sidebar",
            ...params,
        });
        this.antagonist = antagonist;
        this.contents = new Component({
            tag: "div",
            id: "sidebar-contents",
            parent: this.element,
        });
        this.expandButton = new ExpandSidebarButton({
            open: this.open,
            close: this.close,
            parent: this.element,
        });
        this.editMembersPanel = new EditMembersPanel({
            parent: this.contents.element,
        });
        this.showAllCheckboxPanel = new ShowAllCheckboxPanel({
            parent: this.contents.element,
        });
        this.membersTable = new MemberGrid({
            classList: ["info-grid"],
            parent: this.contents.element,
        });
        this.showAllCheckboxPanel.checkbox.element.onchange = () => {
            this.membersTable.showAbsent =
                this.showAllCheckboxPanel.checkbox.element.checked;
            this.membersTable.updateMembers();
        };
        this.expandButton.element.onclick = () => {
            if (this.expandButton.isOpen) {
                this.close();
                this.expandButton.element.textContent = ">";
            } else {
                this.open();
                this.expandButton.element.textContent = "<";
            }
        };
        this.closeByDefault();
    }
    open() {
        this.expandButton.isOpen = true;
        window.sessionStorage.setItem("sidebar", "open");
        this.element.classList.replace("closed", "open");
        if (window.innerWidth < 1000) {
            this.element.style.width = "100%";
            this.antagonist.style["display"] = "none";
        } else {
            this.element.style.width = "30%";
        }
    }
    close() {
        this.expandButton.isOpen = false;
        window.sessionStorage.setItem("sidebar", "closed");
        this.antagonist.removeAttribute("style");
        this.element.removeAttribute("style"); // source of disgrace
        this.element.classList.replace("open", "closed");
    }
    closeByDefault() {
        this.element.style["transition"] = "none";
        this.element.classList.add("closed");
        if (window.sessionStorage.getItem("sidebar") === "open") {
            this.open();
        }
        setTimeout(() => (this.element.style["transition"] = ""), 1);
    }
}
