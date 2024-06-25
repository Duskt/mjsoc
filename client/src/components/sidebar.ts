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
        sidebarDiv.style["width"] = "0%";
        sidebar.style["width"] = "12px";
        sidebarButton.textContent = ">";
    }

    let openSidebar = () => {
        sidebar.style["width"] = "30%";
        sidebarDiv.style["width"] = "100%";
        sidebarButton.textContent = "<";
    }

    closeSidebar();
    sidebarButton.onclick = () => {
        if (sidebarButton.textContent == ">") openSidebar()
        else closeSidebar()
    }
}