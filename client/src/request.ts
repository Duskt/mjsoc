import { getMember, isMember, updateMembers } from "./data";

const MJ_EVENT_PREFIX = "mj";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function request(
    path: string,
    payload: any,
    method: RequestMethod = "POST"
): Promise<Response> {
    let url = `${window.origin}/` + (path[0] != "/" ? path : path.slice(1));
    let r = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
        },
    });
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
    return r;
}

/**
 *
 * @param payload
 * @returns Response
 */
export async function pointTransfer(
    payload: Log,
    target: HTMLElement | Document = document
) {
    let r = await request("/members/transfer", payload, "POST");
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

export async function manualRegister(
    payload: { memberId: MemberId },
    target: HTMLElement | Document = document
) {
    let r = await request("/register", { member_id: payload.memberId }, "POST");
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
    let event: RegisterEvent = new CustomEvent("mjRegister", {
        detail: payload.memberId,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return true;
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

    let r = await request(
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
    for (let t of window.MJDATA.tables) {
        if (t.east === oldMember.id) t.east = newId;
        if (t.south === oldMember.id) t.south = newId;
        if (t.west === oldMember.id) t.west = newId;
        if (t.north === oldMember.id) t.north = newId;
    }

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
    let r = await request("/members", payload);
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
    let r = await request("/week", null, "DELETE");
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
    let r = await request(
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
    updateMembers(await r.json());
    let event: EditLogEvent = new CustomEvent("mjEditLog", {
        detail: payload,
        bubbles: true,
    });
    target.dispatchEvent(event);
    return r;
}
