import { request } from "../request";
import Dialog from "./focus/dialog";

export default function renderSidebar() {
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (!(sidebar instanceof HTMLElement)) {
        throw Error("Could not find sidebar");
    }
    let sidebarButton = Array.from(sidebar.children).find((v) => v.tagName == 'BUTTON');
    if (!(sidebarButton instanceof HTMLButtonElement)) {
        throw Error("Could not find sidebarButton");
    }
    let sidebarDiv = Array.from(sidebar.children).find((v) => v.tagName == 'DIV');
    if (!(sidebarDiv instanceof HTMLElement)) {
        throw Error("Could not find sidebarDiv");
    }

    let closeSidebar = () => {
        sidebar.classList.replace("open", "closed")
        sidebarButton.textContent = ">";
    }

    let openSidebar = () => {
        sidebar.classList.replace("closed", "open")
        sidebarButton.textContent = "<";
    }

    // close by default (without transition)
    sidebar.style['transition'] = "none";
    sidebar.classList.add("closed");
    sidebar.style['transition'] = "";

    sidebarButton.onclick = () => {
        if (sidebarButton.textContent == ">") openSidebar()
        else closeSidebar()
    }

    let addMemberButton = document.getElementById('add-member');
    if (!(addMemberButton instanceof HTMLButtonElement)) {
        throw Error("no #add-member button");
    }
    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
        throw Error("no form");
    }
    form.onsubmit = async (ev) => {
        ev.preventDefault();
        let name = new FormData(form).get("name");
        if (!name) {
            throw Error("no name");
        }
        console.log(await request('/member', {
            name
        }, 'POST'));
    }

    let dialog = new Dialog({
        tag: 'dialog',
        element: document.getElementsByTagName('dialog')[0],
        activator: addMemberButton
    });
}