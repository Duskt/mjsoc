type HTMLElementMap = {
    [other in keyof HTMLElement]: HTMLElement[other];
}

export interface ComponentParameters<K extends keyof HTMLElementTagNameMap> {
    tag: K,
    parent?: HTMLElement,
    style?: Partial<CSSStyleDeclaration>,
    textContent?: string,
    classList?: string[],
    value?: K extends 'input' ? string : never,
    other?: HTMLElementMap;
}
export default class Component<K extends keyof HTMLElementTagNameMap> {
    element: HTMLElementTagNameMap[K]
    constructor(params: ComponentParameters<K>) {
        let tag = params.tag;
        this.element = document.createElement(tag);

        let parent = params.parent;
        if (parent) parent.appendChild(this.element);

        let style = params.style || {};
        for (const styleTag in style) {
            let styleItem = style[styleTag];
            if (styleItem == null) { continue }
            this.element.style[styleTag] = styleItem;
        }

        if (params.textContent) this.element.textContent = params.textContent;

        let classList = params.classList || [];
        for (const c of classList) {
            this.element.classList.add(c);
        }
        
        for (const i in params.other) {
            // @ts-ignore
            this.element[i] = params.other[i];
        }
    }
}