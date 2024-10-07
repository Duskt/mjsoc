import Component, { ComponentParameters } from ".";
import { request } from "../request";
import Dialog from "./input/focus/dialog";
import { DropdownButton } from "./input/focus/dropdown";

export default function renderSidebar() {
    let sidebar = document.getElementsByClassName("sidebar")[0];
    if (!(sidebar instanceof HTMLElement)) {
        throw Error("Could not find sidebar");
    }
    let sidebarButton = Array.from(sidebar.children).find(
        (v) => v.tagName == "BUTTON"
    );
    if (!(sidebarButton instanceof HTMLButtonElement)) {
        throw Error("Could not find sidebarButton");
    }
    let sidebarDiv = Array.from(sidebar.children).find(
        (v) => v.tagName == "DIV"
    );
    if (!(sidebarDiv instanceof HTMLElement)) {
        throw Error("Could not find sidebarDiv");
    }

    let closeSidebar = () => {
        sidebar.classList.replace("open", "closed");
        sidebarButton.textContent = ">";
    };

    let openSidebar = () => {
        sidebar.classList.replace("closed", "open");
        sidebarButton.textContent = "<";
    };

    // close by default (without transition)
    sidebar.style["transition"] = "none";
    sidebar.classList.add("closed");
    setTimeout(() => (sidebar.style["transition"] = ""), 1);

    sidebarButton.onclick = () => {
        if (sidebarButton.textContent == ">") openSidebar();
        else closeSidebar();
    };

    let addMemberButton = document.getElementById("add-member");
    if (!(addMemberButton instanceof HTMLButtonElement)) {
        throw Error("no #add-member button");
    }
    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
        throw Error("no form");
    }
    let dialog = new Dialog({
        tag: "dialog",
        element: document.getElementsByTagName("dialog")[0],
        activator: addMemberButton,
    });
    let memberList = new MemberList({
        tag: "ul",
    });
    addMemberButton.insertAdjacentElement("afterend", memberList.element);

    let removeMemberButton = new DropdownButton({
        textContent: "Remove a member",
        classList: ["member-button"],
        parent: sidebarDiv,
        options: window.MJDATA.members.map(
            (m) =>
                new Component({
                    tag: "button",
                    textContent: m.name,
                    other: {
                        onclick: async (ev: MouseEvent) => {
                            let r = await request(
                                "/members",
                                { name: m.name },
                                "DELETE"
                            );
                            if (r.ok) {
                                let index = window.MJDATA.members.indexOf(m);
                                window.MJDATA.members.splice(index, 1);
                                memberList.updateMembers();
                                // todo: update tables with delete
                            }
                        },
                    },
                }).element
        ),
    });

    let overrideContainer = new OverrideContainer({
        parent: sidebarDiv,
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
                    //todo: update tables with addition
                });
        });
        dialog.deactivate();
    };
}

class MemberList extends Component<"ul"> {
    memberElems: {
        [id: Member["id"]]: HTMLLIElement;
    };
    constructor(params: ComponentParameters<"ul">) {
        super(params);
        this.memberElems = {};
        window.MJDATA.members.forEach((m) => this.renderLi(m));
    }
    renderLi(member: Member) {
        let melem = document.createElement("li");
        melem.textContent = `${member.name}: ${member.points}`;
        this.memberElems[member.id] = melem;
        this.element.appendChild(melem);
        return melem;
    }
    updateMembers() {
        // clear
        this.memberElems = {};
        while (this.element.lastChild) {
            this.element.removeChild(this.element.lastChild);
        }
        window.MJDATA.members.forEach((m) => this.renderLi(m));
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
