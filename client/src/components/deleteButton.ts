import Component, { Params } from ".";
import { request } from "../request";

interface DeleteButtonParameters extends Params<"button"> {
    tableNo: number;
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
                // todo: use custom request
                let r = await request(
                    "/tables",
                    { table_no: params.tableNo },
                    "DELETE"
                );
                if (!r.redirected) {
                    window.MJDATA.tables = window.MJDATA.tables.filter(
                        (v) => v.table_no !== params.tableNo
                    );
                    if (params.ondelete) {
                        params.ondelete();
                    }
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
