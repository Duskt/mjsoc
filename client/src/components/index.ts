type HTMLElementMap<K extends HTMLElement> = {
    [other in keyof K]?: K[other];
};

export interface ComponentParameters<K extends keyof HTMLElementTagNameMap> {
    tag: K;
    element?: HTMLElementTagNameMap[K];
    parent?: HTMLElement;
    style?: Partial<CSSStyleDeclaration>;
    textContent?: string;
    classList?: string[];
    value?: K extends "input" ? string : never;
    id?: string;
    other?: HTMLElementMap<HTMLElementTagNameMap[K]>;
}

/** Components are associated with a DOM element which will be implicitly constructed if not supplied.
 *
 */
export default class Component<K extends keyof HTMLElementTagNameMap> {
    element: HTMLElementTagNameMap[K];
    constructor(params: ComponentParameters<K>) {
        let tag = params.tag;
        this.element = params.element
            ? params.element
            : document.createElement(tag);
        // @ts-ignore (debug property)
        this.element._ParentComponent = this;
        let parent = params.parent;
        if (parent) parent.appendChild(this.element);

        let style = params.style || {};
        for (const styleTag in style) {
            let styleItem = style[styleTag];
            if (styleItem == null) {
                continue;
            }
            this.element.style[styleTag] = styleItem;
        }

        if (params.textContent) this.element.textContent = params.textContent;
        if (params.value)
            (this.element as HTMLInputElement).value = params.value;
        if (params.id) this.element.id = params.id;
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

export type Params<K extends keyof HTMLElementTagNameMap> = Omit<
    ComponentParameters<K>,
    "tag"
>;
