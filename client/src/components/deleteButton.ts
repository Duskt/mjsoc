import Component, { ComponentParameters } from ".";
import { request } from "../request";

interface DeleteButtonParameters extends Omit<ComponentParameters<'button'>, 'tag'> {
    tableNo: number;
}
export default class DeleteButton extends Component<'button'> {
    constructor(params: DeleteButtonParameters) {
        let onclick = params.other?.onclick || (async (ev) => {
            let r = await request("editTable", { "table_no": params.tableNo }, "DELETE");
            if (!r.redirected) {
                // button < td < tr < table
                if (ev.target instanceof HTMLElement) ev.target.parentElement?.parentElement?.parentElement?.remove();
            }
        });
        let classList = params.classList || ["small-button", "delete-button"];
        let textContent = params.textContent || "X";
        super({
            ...params,
            tag: 'button',
            classList,
            textContent,
            other: {
                ...params.other,
                onclick
            }
        });
    }
}