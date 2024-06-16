import { request } from "../util";

export default function renderDeleteButton(parent: HTMLTableCellElement, tableNo: number) {
    let deleteButton = document.createElement('button');
    deleteButton.textContent = "X";
    deleteButton.style["padding"] = "1px";
    deleteButton.onclick = async (ev) => {
        let r = await request("editTable", { "table_no": tableNo }, "DELETE");
        console.log(r);
        if (r) {
            // @ts-ignore button < td < tr < table
            deleteButton.parentElement.parentElement.parentElement.remove();
        }
    }
    parent.appendChild(deleteButton);
}