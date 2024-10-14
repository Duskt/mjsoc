type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

const pointTransfer = new Event("mjPointTransfer");

interface PointTransferRequest {
    to: MemberId;
    from: MemberId[];
    points: number;
}

export async function request(
    path: string,
    payload: any,
    method: RequestMethod = "POST"
): Promise<Response> {
    // todo: configure hostname
    let url =
        "http://localhost:5654/" + (path[0] != "/" ? path : path.slice(1));
    let r = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
        },
    });
    if (path === "/members/transfer") {
        let updated_members: Member[] = await r.json();
        let new_member: Member | undefined;
        console.log(window.MJDATA.members, updated_members);
        window.MJDATA.members = window.MJDATA.members.map((old_member) => {
            new_member = updated_members.find(
                (new_member) => new_member.id === old_member.id
            );
            if (new_member !== undefined) {
                return new_member;
            } else {
                return old_member;
            }
        });
        // in process (possibly) of using events to manage all 'database' mutations
        document.dispatchEvent(pointTransfer);
    }
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
