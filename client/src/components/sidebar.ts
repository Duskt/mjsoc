import Component, { ComponentParameters } from ".";
import { request } from "../request";
import Dialog from "./input/focus/dialog";

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
                    //todo: update nameTags
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
}
