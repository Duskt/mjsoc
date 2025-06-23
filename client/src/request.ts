import Component from "./components";
import { getMember, isMember, updateMembers } from "./data";

const MJ_EVENT_PREFIX = "mj";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface PseudoResponse {
    ok: false;
    type: "pseudo";
    statusText: "rate" | "network";
}



class RequestIndicator extends Component<"span"> {
    transitionTimer?: number;
    constructor() {
        super({
            tag: "span",
            classList: ["request-indicator"],
            style: {
                display: "none",
            },
            parent: document.body,
        });
    }
    loading() {
        this.element.classList = "loading request-indicator";
        this.element.textContent = "";
        this.element.style.display = "block";
        clearTimeout(this.transitionTimer);
        this.element.style.transition = "none";
        this.element.style.opacity = "1";
        this.element.offsetHeight; // flush css changes
        this.element.style.transition = "";
    }
    fail() {
        this.element.classList = "failure request-indicator"
        this.element.textContent = "❌";
        // fade out after 5s
        this.transitionTimer = setTimeout(() => {
            this.element.style.opacity = "0";
        }, 2000);
    }
    success() {
        this.element.classList = "successful request-indicator"
        this.element.textContent = "✅";
        // fade out after 5s
        this.transitionTimer = setTimeout(() => {
            this.element.style.opacity = "0";
        }, 1000);
    }
}

var RequestRateLimiter = {
    lastRequest: 0,
    delay: 200,
    indicator: new RequestIndicator(),
    update() {
        let d = Date.now();
        let valid = d - this.lastRequest < this.delay;
        this.lastRequest = d;
        return valid;
    },
    warn(): PseudoResponse {
        console.warn("Requests sent too fast.");
        return { ok: false, type: "pseudo", statusText: "rate"};
    },

    async request(
        path: string,
        payload: any,
        method: RequestMethod = "POST",
        rate_exemption: boolean = false
    ): Promise<Response | PseudoResponse> {
        // update regardless, only warn if not exempt
        if (this.update() && !rate_exemption) {
            return this.warn();
        }
        this.indicator.loading();
        let url = `${window.origin}/` + (path[0] != "/" ? path : path.slice(1));
        let r: Response | PseudoResponse;
        try {
            r = await fetch(url, {
                method,
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                },
            });
        } catch (err) {
            console.error(err);
            r = {ok: false, type: "pseudo", statusText: "network"}
        }

        if (r.ok) {
            this.indicator.success();
        } else {
            this.indicator.fail();
        }
        return r;
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
export async function pointTransfer(
    payload: Log,
    target: HTMLElement | Document = document
) {
    let r = await RequestRateLimiter.request(
        "/members/transfer",
        payload,
        "POST"
    );
    if (!r.ok) {
        console.error("Invalid transfer: ", payload, r);
        return r;
    }
    window.MJDATA.log.push(payload);
    updateMembers(await r.json());

    let event: PointTransferEvent = new CustomEvent("mjPointTransfer", {
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
    target: HTMLElement | Document = document
) {
    let r = await RequestRateLimiter.request(
        "/register",
        { member_id: payload.memberId },
        "POST"
    );
    if (!r.ok) {
        console.error(r);
        return false;
    }
    let present: boolean = await r.json();
    window.MJDATA.members = window.MJDATA.members.map((member) => {
        if (member.id === payload.memberId) {
            member.tournament.registered = present;
        }
        return member;
    });
    if (leaveTables && !present) {
        replaceMemberOnTables(payload.memberId, 0, target);
    }
    let event: RegisterEvent = new CustomEvent("mjRegister", {
        detail: payload.memberId,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return true;
}

export function replaceMemberOnTable(
    table: TableData,
    oldId: MemberId,
    newId: MemberId | 0
) {
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
    target: HTMLElement | Document = document
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
    target: HTMLElement | Document = document
) {
    let mode: "DELETE" | "PUT" =
        payload.newMember === undefined ? "DELETE" : "PUT";
    let oldMember = getMember(payload.id);
    if (!isMember(oldMember)) {
        throw new Error(`Couldn't find the member ${payload.id} to modify.`);
    }

    let r = await RequestRateLimiter.request(
        "/members",
        {
            id: payload.id,
            new_member: payload.newMember,
        },
        mode
    );
    if (!r.ok) {
        console.error(`Failed to modify/delete member "${payload.id}"`, r);
        return r;
    }

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
    let savedTables = JSON.parse(
        window.sessionStorage.getItem("savedTables") || "[]"
    );
    for (let t of savedTables) {
        replaceMemberOnTable(t, oldMember.id, newId);
    }
    window.sessionStorage.setItem("savedTables", JSON.stringify(savedTables));

    let event: EditMemberEvent = new CustomEvent("mjEditMember", {
        detail: {
            id: oldMember.id,
            new_member:
                payload.newMember === undefined ? {} : payload.newMember,
        },
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function addMember(
    payload: { name: string },
    target: HTMLElement | Document = document
) {
    let r = await RequestRateLimiter.request("/members", payload);
    if (!r.ok) {
        console.error("Failed to POST new member:", r);
        return r;
    }
    let newMember = await r.json();
    window.MJDATA.members.push(newMember);
    let event: AddMemberEvent = new CustomEvent("mjAddMember", {
        detail: newMember,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

const ResetSessionEvent = new Event(`${MJ_EVENT_PREFIX}ResetSession`);

export async function resetSession() {
    let r = await RequestRateLimiter.request("/week", null, "DELETE");
    if (!r.ok) {
        console.error("Failed to reset the session.", r);
    }
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
        id: Log["id"];
        newLog: Log;
    },
    target: HTMLElement | Document = document
) {
    let oldLogIndex = window.MJDATA.log.findIndex((l) => l.id === payload.id);
    if (oldLogIndex === -1) {
        throw new Error("Couldn't find that log");
    }
    let r = await RequestRateLimiter.request(
        "/log",
        {
            id: payload.id,
            log: payload.newLog,
        },
        "PUT"
    );
    if (!r.ok) {
        console.error(r);
        return r;
    }
    window.MJDATA.log[oldLogIndex] = payload.newLog;
    let event: EditLogEvent = new CustomEvent("mjEditLog", {
        detail: payload,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function undoLog(
    payload: {
        id: Log["id"];
    },
    target: HTMLElement | Document = document
) {
    let log = window.MJDATA.log.find((l) => l.id === payload.id);
    if (log === undefined) {
        throw new Error("Couldn't find that log");
    } else if (log.disabled) {
        console.warn("log was already disabled:", log);
        return;
    }
    let r = await RequestRateLimiter.request(
        "/log",
        {
            id: payload.id,
        },
        "PUT"
    );
    if (!r.ok) {
        console.error(r);
        return r;
    }
    log.disabled = true;
    updateMembers(await r.json());
    let event: UndoLogEvent = new CustomEvent("mjUndoLog", {
        detail: payload.id,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}

export async function addTable(target: HTMLElement | Document = document) {
    let r = await RequestRateLimiter.request("/tables", null, "POST");
    if (!r.ok) {
        console.error(r);
        alert(
            "An error occurred while trying to create a new table. Please refresh the page and try again."
        );
        return;
    }
    let newTable: TableData = await r.json();
    window.MJDATA.tables.push(newTable);
    let event: AddTableEvent = new CustomEvent("mjAddTable", {
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
    target: HTMLElement | Document = document
) {
    let r = await RequestRateLimiter.request(
        "/tables",
        payload.map((i) => {
            return {
                table_no: i.tableNo,
                table: i.newTable,
            };
        }),
        "PUT"
    );
    if (!r.ok) {
        console.error(r);
        alert(
            "An error occurred while modifying the table. Please contact a member of the council."
        );
        return;
    }
    for (let edit of payload) {
        window.MJDATA.tables[
            window.MJDATA.tables.findIndex((t) => t.table_no == edit.tableNo)
        ] = edit.newTable;
    }
    let event: EditTableEvent = new CustomEvent("mjEditTable", {
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
    target: HTMLElement | Document = document
) {
    let r = await RequestRateLimiter.request(
        "/tables",
        payload,
        "DELETE",
        true
    );
    if (!r.ok) {
        console.error(r);
        return r;
    } else if (r.redirected) {
        return r;
    } else
        window.MJDATA.tables = window.MJDATA.tables.filter(
            (v) => v.table_no !== payload.table_no
        );
    // decrement table numbers higher than
    window.MJDATA.tables = window.MJDATA.tables.map((i) =>
        i.table_no > payload.table_no
            ? { ...i, table_no: (i.table_no - 1) as TableNo }
            : i
    );
    return r;
}

export async function updateSettings(
    payload: {
        [S in keyof Settings]: Settings[S];
    },
    target: HTMLElement | Document = document
) {
    let r = await RequestRateLimiter.request("/settings", payload, "PUT", true);
    if (!r.ok) {
        console.error(r);
        alert(
            "An error occurred while modifying the settings. Try refreshing the page?"
        );
        return;
    }
    for (let k in payload) {
        if (k === "matchmakingCoefficient") {
            window.MJDATA.settings[k] = payload[k];
        }
    }
    let event: SettingsUpdateEvent = new CustomEvent("settingsUpdate", {});
    target.dispatchEvent(event);
    return r;
}
