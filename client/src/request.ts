import Component from './components';
import { getMember, isMember, updateMembers } from './data';
import { AppError, NetworkError, CodeError } from './errors';

const MJ_EVENT_PREFIX = 'mj';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface SuccessfulResponse extends Response {
    ok: true;
}
function respSuccessful(r: Response): r is SuccessfulResponse {
    return r.ok;
}

class ErrorPanel {
    panelContainer: Component<'div'>;
    panelSummary?: Component<'p'>;
    panelMessage: Component<'p'>;
    errorIcon: Component<'span'>;
    constructor(err: AppError) {
        this.panelContainer = new Component({
            tag: 'div',
            classList: ['error-panel'],
        });
        if (err.summary !== undefined) {
            this.panelSummary = new Component({
                tag: 'p',
                textContent: err.summary,
                classList: ['summary'],
                parent: this.panelContainer.element,
            });
        }
        this.panelMessage = new Component({
            tag: 'p',
            textContent: err.message,
            parent: this.panelContainer.element,
        });
        this.errorIcon = new Component({
            tag: 'span',
            textContent: '❌',
        });
    }
    attach(parent: HTMLElement) {
        if (parent.children.length > 0) {
            console.warn("ErrorPanel shouldn't be attached to non-empty parent.");
        }
        parent.appendChild(this.panelContainer.element);
        parent.appendChild(this.errorIcon.element);
        return this;
    }
    remove() {
        this.errorIcon.element.remove();
        this.panelContainer.element.remove();
        return undefined;
    }
}

export class RequestIndicator extends Component<'div'> {
    transitionTimer?: number;
    errorPanel?: ErrorPanel;
    msShowFail = 5000;
    msShowSuccess = 1000;
    minSkipLoadingDelay = 100; // when sending a request, wait 100ms before showing the loading icon, otherwise jump straight to the result
    constructor() {
        super({
            tag: 'div',
            classList: ['request-indicator'],
            parent: document.body,
        });
    }
    reset() {
        if (this.errorPanel !== undefined) {
            this.errorPanel = this.errorPanel.remove();
        }
        this.element.textContent = '';
        clearTimeout(this.transitionTimer);
    }
    appear() {
        this.element.style.transition = 'none';
        this.element.style.opacity = '1';
        this.element.offsetHeight; // flush css changes
        this.element.style.transition = '';
    }
    load() {
        this.reset();
        this.appear();
        this.transitionTimer = setTimeout(() => {
            this.element.classList.value = 'loading request-indicator';
        }, this.minSkipLoadingDelay);
    }
    fail(err: AppError) {
        this.reset();
        this.element.classList.value = 'failure request-indicator';
        this.errorPanel = new ErrorPanel(err).attach(this.element);
        this.transitionTimer = setTimeout(() => {
            this.element.style.opacity = '0';
        }, this.msShowFail);
    }
    success() {
        this.reset();
        this.element.classList.value = 'success request-indicator';
        this.element.textContent = '✅';
        this.transitionTimer = setTimeout(() => {
            this.element.style.opacity = '0';
        }, this.msShowSuccess);
    }
}

var RequestController = {
    lastRequest: 0,
    minDelay: 200,
    indicator: new RequestIndicator(),
    update() {
        let d = Date.now();
        let valid = d - this.lastRequest < this.minDelay;
        this.lastRequest = d;
        return valid;
    },
    blockRequest(): AppError {
        console.warn('Requests sent too fast.');
        // don't display error panel; the previous error has all the message
        return new NetworkError({});
    },
    handleRejection(r: TypeError | DOMException): AppError {
        let err = new CodeError({
            summary: 'Server communication (fetch) error',
            error: r,
        });
        this.indicator.fail(err);
        return err;
    },
    handleBadResponse(r: Response): AppError {
        let err = new CodeError({ summary: 'Server response error', debug: r });
        this.indicator.fail(err);
        return err;
    },

    async request(
        path: string,
        payload: any,
        method: RequestMethod = 'POST',
        rate_exemption: boolean = true, // TODO: change back to false
    ): Promise<SuccessfulResponse | AppError> {
        // update regardless, only warn if not exempt
        if (this.update() && !rate_exemption) {
            return this.blockRequest();
        }
        this.indicator.load();
        let url = `${window.origin}/` + (path[0] != '/' ? path : path.slice(1));
        let promise = fetch(url, {
            method,
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
        });
        return promise.then((r) => {
            if (!respSuccessful(r)) return this.handleBadResponse(r);
            this.indicator.success();
            return r;
        }, this.handleRejection);
        // todo: some redirecting stuff
        /*if (r.redirected && method != "GET") {
        let oldHref = window.location.href;
        let redirectHref = r.url;
        // observe for the redirect back and resend the request, then go back to starting page
        const observer = new MutationObserver(mutations => {
            if (redirectHref != window.location.href) {
                console.debug("redirect mutation detected, resending request");
                fetch(url, {
                    method,
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8"
                    }
                });
                console.debug("disconnecting after going back to ", oldHref);
                observer.disconnect();
                window.location.replace(oldHref);
            }
        });
        window.location.replace(redirectHref);
    }*/
    },
};

/**
 *
 * @param payload
 * @returns Response
 */
export async function pointTransfer(payload: Log, target: HTMLElement | Document = document) {
    let r = await RequestController.request('/members/transfer', payload, 'POST');
    if (r instanceof AppError) return r;
    window.MJDATA.log.push(payload);
    updateMembers(await r.json());
    let event: PointTransferEvent = new CustomEvent('mjPointTransfer', {
        detail: payload,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

/**
 *
 * @param payload
 * @param leaveTables Whether to remove a member who was UNregistered from all real tables
 * @param target
 * @returns
 */
export async function manualRegister(
    payload: { memberId: MemberId },
    leaveTables: boolean,
    target: HTMLElement | Document = document,
) {
    let r = await RequestController.request('/register', { member_id: payload.memberId }, 'POST');
    if (r instanceof AppError) return r;
    let present: boolean = await r.json();
    window.MJDATA.members = window.MJDATA.members.map((member) => {
        if (member.id === payload.memberId) {
            member.tournament.registered = present;
        }
        return member;
    });
    if (leaveTables && !present) {
        // TODO: is this the best way to exempt this request from the rate controller?
        RequestController.lastRequest = 0;
        replaceMemberOnTables(payload.memberId, 0, target);
    }
    let event: RegisterEvent = new CustomEvent('mjRegister', {
        detail: payload.memberId,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return true;
}

export function replaceMemberOnTable(table: TableData, oldId: MemberId, newId: MemberId | 0) {
    let success = false;
    if (table.east === oldId) {
        table.east = newId;
        success = true;
    }
    if (table.south === oldId) {
        table.south = newId;
        success = true;
    }
    if (table.west === oldId) {
        table.west = newId;
        success = true;
    }
    if (table.north === oldId) {
        table.north = newId;
        success = true;
    }
    return success;
}

/**
 * Iterate through all the UNSAVED tables and make edits as necessary to
 * replace one member ID with another in any places they're sat.
 * @param oldId
 * @param newId
 */
export async function replaceMemberOnTables(
    oldId: MemberId,
    newId: MemberId | 0,
    target: HTMLElement | Document = document,
) {
    let table: TableData;
    let edits: TableEdit[] = [];
    for (table of window.MJDATA.tables) {
        if (replaceMemberOnTable(table, oldId, newId)) {
            edits.push({ tableNo: table.table_no, newTable: table });
        }
    }
    await editTable(edits, target);
}

export async function editMember(
    payload: {
        id: MemberId;
        newMember?: Member;
    },
    target: HTMLElement | Document = document,
) {
    let mode: 'DELETE' | 'PUT' = payload.newMember === undefined ? 'DELETE' : 'PUT';
    let oldMember = getMember(payload.id);
    if (!isMember(oldMember)) {
        let err = new CodeError({
            summary: "Couldn't find the player being modified",
            debug: { payload, target, oldMember },
        });
        RequestController.indicator.fail(err);
        return err;
    }

    let r = await RequestController.request(
        '/members',
        {
            id: payload.id,
            new_member: payload.newMember,
        },
        mode,
    );
    if (r instanceof AppError) return r;
    let index = window.MJDATA.members.indexOf(oldMember);
    let newId: MemberId | 0;
    if (payload.newMember === undefined) {
        window.MJDATA.members.splice(index, 1);
        newId = 0;
    } else {
        window.MJDATA.members[index] = payload.newMember;
        newId = payload.newMember.id;
    }
    // replace tables with new ID (including backend request)
    replaceMemberOnTables(oldMember.id, newId);
    // replace session savedTables with new ID (no backend)
    let savedTables = JSON.parse(window.sessionStorage.getItem('savedTables') || '[]');
    for (let t of savedTables) {
        replaceMemberOnTable(t, oldMember.id, newId);
    }
    window.sessionStorage.setItem('savedTables', JSON.stringify(savedTables));

    let event: EditMemberEvent = new CustomEvent('mjEditMember', {
        detail: {
            id: oldMember.id,
            new_member: payload.newMember === undefined ? {} : payload.newMember,
        },
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function addMember(
    payload: { name: string },
    target: HTMLElement | Document = document,
) {
    let r = await RequestController.request('/members', payload);
    if (r instanceof AppError) return r;
    let newMember = await r.json();
    window.MJDATA.members.push(newMember);
    let event: AddMemberEvent = new CustomEvent('mjAddMember', {
        detail: newMember,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

const ResetSessionEvent = new Event(`${MJ_EVENT_PREFIX}ResetSession`);

export async function resetSession() {
    let r = await RequestController.request('/week', null, 'DELETE');
    if (r instanceof AppError) return r;
    // repeated computation but its better than a big payload?
    let m: Member;
    for (m of window.MJDATA.members) {
        m.tournament.registered = false;
        m.tournament.total_points += m.tournament.session_points;
        m.tournament.session_points = 0;
    }
    document.dispatchEvent(ResetSessionEvent);
}

export async function editLog(
    payload: {
        id: Log['id'];
        newLog: Log;
    },
    target: HTMLElement | Document = document,
) {
    let oldLogIndex = window.MJDATA.log.findIndex((l) => l.id === payload.id);
    if (oldLogIndex === -1) {
        let err = new CodeError({
            summary: 'Unable to find log',
            debug: { payload, target },
        });
        RequestController.indicator.fail(err);
        return err;
    }
    let r = await RequestController.request(
        '/log',
        {
            id: payload.id,
            log: payload.newLog,
        },
        'PUT',
    );
    if (r instanceof AppError) return r;
    window.MJDATA.log[oldLogIndex] = payload.newLog;
    let event: EditLogEvent = new CustomEvent('mjEditLog', {
        detail: payload,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function undoLog(
    payload: {
        id: Log['id'];
    },
    target: HTMLElement | Document = document,
) {
    let log = window.MJDATA.log.find((l) => l.id === payload.id);
    if (log === undefined) {
        let err = new CodeError({
            summary: 'Unable to find log',
            debug: { payload, target },
        });
        RequestController.indicator.fail(err);
        return err;
    } else if (log.disabled) {
        let err = new CodeError({
            summary: 'Log already disabled',
            debug: { log, payload, target },
        });
        RequestController.indicator.fail(err);
        return err;
    }
    let r = await RequestController.request(
        '/log',
        {
            id: payload.id,
        },
        'PUT',
    );
    if (r instanceof AppError) return r;
    log.disabled = true;
    updateMembers(await r.json());
    let event: UndoLogEvent = new CustomEvent('mjUndoLog', {
        detail: payload.id,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function addTable(target: HTMLElement | Document = document) {
    let r = await RequestController.request('/tables', null, 'POST');
    if (r instanceof AppError) return r;
    let newTable: TableData = await r.json();
    window.MJDATA.tables.push(newTable);
    let event: AddTableEvent = new CustomEvent('mjAddTable', {
        detail: newTable,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function editTable(
    payload: {
        tableNo: TableNo;
        newTable: TableData;
    }[],
    target: HTMLElement | Document = document,
) {
    let r = await RequestController.request(
        '/tables',
        payload.map((i) => {
            return {
                table_no: i.tableNo,
                table: i.newTable,
            };
        }),
        'PUT',
    );
    if (r instanceof AppError) return r;
    for (let edit of payload) {
        window.MJDATA.tables[window.MJDATA.tables.findIndex((t) => t.table_no == edit.tableNo)] =
            edit.newTable;
    }
    let event: EditTableEvent = new CustomEvent('mjEditTable', {
        detail: payload,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function deleteTable(
    payload: {
        table_no: TableNo;
    },
    target: HTMLElement | Document = document,
) {
    let r = await RequestController.request('/tables', payload, 'DELETE', true);
    if (r instanceof AppError) return r;
    if (r.redirected) {
        return r;
    } else
        window.MJDATA.tables = window.MJDATA.tables.filter((v) => v.table_no !== payload.table_no);
    // decrement table numbers higher than
    //window.MJDATA.tables = window.MJDATA.tables.map((i) =>
    //    i.table_no > payload.table_no ? { ...i, table_no: (i.table_no - 1) as TableNo } : i,
    // );
    let event: EditTableEvent = new CustomEvent('mjEditTable', {
        detail: [{ tableNo: payload.table_no, newTable: null }],
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function updateSettings(
    payload: {
        [S in keyof Settings]: Settings[S];
    },
    target: HTMLElement | Document = document,
) {
    let r = await RequestController.request('/settings', payload, 'PUT', true);
    if (r instanceof AppError) return r;
    for (let k in payload) {
        if (k === 'matchmakingCoefficient') {
            window.MJDATA.settings[k] = payload[k];
        }
    }
    let event: SettingsUpdateEvent = new CustomEvent('settingsUpdate', {});
    target.dispatchEvent(event);
    return r;
}

if (window.DEBUG === undefined) window.DEBUG = {};
window.DEBUG.request = RequestController;
