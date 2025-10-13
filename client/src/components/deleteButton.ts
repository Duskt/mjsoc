import Component, { Params } from '.';
import { AppError } from '../errors';
import { deleteTable } from '../request';
import { CircleButton } from './icons';

interface DeleteButtonParameters extends Params<'button'> {
    tableNo: TableNo;
    ondelete?: () => void;
}

export default class DeleteButton extends CircleButton {
    constructor(params: DeleteButtonParameters) {
        let onclick =
            params.other?.onclick ||
            (async (ev) => {
                if (params.tableNo < 0) {
                    window.sessionStorage.setItem(
                        'savedTables',
                        JSON.stringify(
                            JSON.parse(window.sessionStorage.getItem('savedTables') || '[]').filter(
                                (v: TableData) => v.table_no !== params.tableNo,
                            ),
                        ),
                    );
                    if (params.ondelete) {
                        params.ondelete();
                    }
                    return;
                }
                let r = await deleteTable({ table_no: params.tableNo });
                if (r instanceof AppError) return;
                if (params.ondelete !== undefined) {
                    params.ondelete();
                }
            });
        super({
            ...params,
            classList: ['delete-button', 'icon-button'],
            textContent: 'x',
            other: {
                ...params.other,
                onclick,
            },
        });
    }
}
