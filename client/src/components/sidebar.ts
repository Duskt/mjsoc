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

    sidebar.classList.add("closed");
    sidebarButton.onclick = () => {
        if (sidebarButton.textContent == ">") openSidebar()
        else closeSidebar()
    }
}