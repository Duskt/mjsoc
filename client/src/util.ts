export async function request(path: string, payload: object, method: string = "POST") {
    // todo: configure hostname
    let url = "http://localhost:5654/" + (path[0] != '/' ? path : path.slice(1));
    let r = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    });
    document.createElement('a').children[0]
    if (r.redirected && method != "GET") {
        let oldHref = window.location.href;
        let redirectHref = r.url;
        // observe for the redirect back and resend the request, then go back to starting page
        const observer = new MutationObserver(mutations => {
            console.log("mutation");
            if (redirectHref != window.location.href) {
                console.log("redirect mutation detected, resending request");
                fetch(url, {
                    method,
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8"
                    }
                });
                console.log("disconnecting after going back to ", oldHref);
                observer.disconnect();
                window.location.replace(oldHref);
            }
        });
        window.location.replace(redirectHref);
    }
    return !r.redirected;
}

export function elem<T extends keyof HTMLElementTagNameMap>(tag: T, attributes: {
    classList?: string[],
    id?: string,
    style?: Partial<CSSStyleDeclaration>,
    textContent?: string,
    value?: string,
    onclick?: Function,
} = {}, parent?: HTMLElement): HTMLElementTagNameMap[T] {
    let e = document.createElement(tag);
    // why didn't typescript catch this?
    for (const classItem of attributes.classList ? attributes.classList : []) {
        e.classList.add(classItem);
    }
    delete attributes.classList;
    if (attributes.style) {
        for (const styleKey in attributes.style) {
            let item = attributes.style[styleKey];
            if (!item) continue
            e.style[styleKey] = item;
        }
    }
    delete attributes.style;
    for (const i in attributes) {
        // @ts-ignore
        e[i] = attributes[i];
    }
    if (parent) { parent.appendChild(e); }
    return e;
}