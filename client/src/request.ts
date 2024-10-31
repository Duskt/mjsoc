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
 * @returns boolean - if successful
 */
export async function pointTransfer(
    payload: PointTransfer,
    target: HTMLElement | Document = document
) {
    let r = await request("/members/transfer", payload, "POST");
    if (!r.ok) {
        console.error("Invalid transfer: ", payload);
        return false;
    }
    window.MJDATA.log.push(payload);
    // for each member, see if they've been updated
    let updated_members: Member[] = await r.json();
    let new_member: Member | undefined;
    window.MJDATA.members = window.MJDATA.members.map((old_member) => {
        new_member = updated_members.find(
            (new_member) => new_member.id === old_member.id
        );
        return new_member !== undefined ? new_member : old_member;
    });

    let PointTransferEvent = new CustomEvent("mjPointTransfer", {
        detail: payload,
        bubbles: true,
    });
    target.dispatchEvent(PointTransferEvent);
    return true;
}

const RegisterEvent = new Event(`${MJ_EVENT_PREFIX}Register`);

export async function manualRegister(payload: { memberId: MemberId }) {
    let r = await request("/register", { member_id: payload.memberId }, "POST");
    if (!r.ok) {
        console.error(`${r}`);
        return;
    }
    let present: boolean = await r.json();
    window.MJDATA.members = window.MJDATA.members.map((member) => {
        if (member.id === payload.memberId) {
            member.tournament.registered = present;
        }
        return member;
    });
    document.dispatchEvent(RegisterEvent);
}

const EditMemberEvent = new Event(`${MJ_EVENT_PREFIX}EditMember`);

export async function editMemberList(
    payload: { name: string },
    mode: "POST" | "DELETE"
) {
    let r = await request("/members", payload, mode);
    if (!r.ok) {
        console.error(
            `Failed to ${mode == "POST" ? "create" : "delete"} member "${
                payload.name
            }"`
        );
        return;
    }
    if (mode == "DELETE") {
        let member = window.MJDATA.members.find((m) => m.name === payload.name);
        if (!member) {
            console.warn(
                `Couldn't find the deleted member ${payload.name} before removal.`
            );
        } else {
            let index = window.MJDATA.members.indexOf(member);
            window.MJDATA.members.splice(index, 1);
            for (let t of window.MJDATA.tables) {
                if (t.east === member.id) t.east = 0;
                if (t.south === member.id) t.south = 0;
                if (t.west === member.id) t.west = 0;
                if (t.north === member.id) t.north = 0;
            }
        }
    } else {
        window.MJDATA.members.push(await r.json());
    }
    document.dispatchEvent(EditMemberEvent);
}

const ResetSessionEvent = new Event(`${MJ_EVENT_PREFIX}ResetSession`);

export async function resetSession() {
    let r = await request("/week", null, "DELETE");
    if (!r.ok) {
        console.error(`Failed to reset the session. ${r}`);
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
