import Component, { Params } from ".";
import { deleteTable } from "../request";

interface DeleteButtonParameters extends Params<"button"> {
    tableNo: TableNo;
    ondelete?: () => void;
}
export default class DeleteButton extends Component<"button"> {
    constructor(params: DeleteButtonParameters) {
        let onclick =
            params.other?.onclick ||
            (async (ev) => {
                if (params.tableNo < 0) {
                    window.sessionStorage.setItem(
                        "savedTables",
                        JSON.stringify(
                            JSON.parse(
                                window.sessionStorage.getItem("savedTables") ||
                                    "[]"
                            ).filter(
                                (v: TableData) => v.table_no !== params.tableNo
                            )
                        )
                    );
                    if (params.ondelete) {
                        params.ondelete();
                    }
                    return;
                }
                let r = await deleteTable({table_no: params.tableNo});
                if (r.ok && params.ondelete) {
                    params.ondelete();
                }
            });
        let classList = params.classList || ["small-button", "delete-button"];
        let textContent = params.textContent || "X";
        super({
            ...params,
            tag: "button",
            classList,
            textContent,
            other: {
                ...params.other,
                onclick,
            },
        });
    }
}
