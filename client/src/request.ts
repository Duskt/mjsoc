type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

const PointTransferEvent = new Event("mjPointTransfer");

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
export async function pointTransfer(payload: PointTransfer) {
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

    document.dispatchEvent(PointTransferEvent);
    return true;
}
