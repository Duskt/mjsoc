import { ClickListener, InputListenerParameters } from "../listener";

type AnyElement = HTMLElement | SVGElement;

export interface FocusNodeParameters<T extends keyof HTMLElementTagNameMap>
    extends InputListenerParameters<T> {
    exclude?: HTMLElement[];
    excludeSelf?: true;
    excludeChildren?: boolean;
}
/** An "on/off switch" element node used as a superclass.
 * .activate() function is NOT IMPLICITLY CALLED ANYWHERE (e.g. on click).
 * .deactivate() is called when the .deactivation event is registered elsewhere (Event.EventTarget).
 * @param {boolean} [excludeSelf=true] todo: MUST BE TRUE OR ELSE IT WILL HIDE IMMEDIATELY
 * @param {boolean} [excludeChildren=true] If true, dynamically excludes any and all children of this element from 'elsewhere'
 *  @param {HTMLElement[]} [exclude=[]] Other elements to exclude from 'elsewhere'.
 */
export default abstract class FocusNode<
    T extends keyof HTMLElementTagNameMap
> extends ClickListener<T> {
    exclude: AnyElement[];
    excludeSelf: boolean;
    excludeChildren: boolean;
    active: boolean;
    deactivation: keyof DocumentEventMap = "click";
    constructor(params: FocusNodeParameters<T>) {
        super({
            ...params,
            // FocusNode listeners require manual activation
            initListener: false,
        });
        this.exclude = params.exclude || [];
        this.excludeSelf = params.excludeSelf === undefined ? true : params.excludeSelf;
        this.excludeChildren = params.excludeChildren === undefined ? true : params.excludeChildren;
        this.active = false;
        return this;
    }
    generateListener(): EventListener {
        return (evt: Event) => {
            let target = evt.target;
            if (!((target instanceof HTMLElement) || (target instanceof SVGElement))) {
                if (target !== null) {
                    console.warn("Target was not null but also wasn't a HTMLElement or SVGElement. (see focusNode.ts/FocusNode", target)
                }
                return
            }
            // check if excluding self
            if (this.excludeSelf && target.isSameNode(this.element)) return;
            // check if this event propagates from a child node
            let parent = target.parentElement;
            while (this.excludeChildren && parent) {
                if (parent.isSameNode(this.element)) return;
                parent = parent.parentElement;
            }
            // check if explicitly excluded
            if (this.exclude.includes(target)) return;
            this.deactivate();
        };
    }
    // javascript quirks: overriding one property accessor prevents inheritance of both!
    public get listener() {
        // javascript quirks: this is not possible before ES6
        return super.listener;
    }
    public set listener(v: EventListener | undefined) {
        if (this.listener) {
            document.removeEventListener(this.event, this.listener);
        }
        if (!v) return;
        document.addEventListener(this.event, v);
        this.lastListener = v;
    }
    activate() {
        this.listener = this.generateListener();
        this.active = true;
        return this;
    }
    deactivate() {
        this.listener = undefined;
        this.active = false;
        return this;
    }
}

export type FocusButtonParameters = Omit<FocusNodeParameters<"button">, "tag">;
/** FocusNode given sensible defaults for acting as a button. onclick implicitly set.
 *
 */
export class FocusButton extends FocusNode<"button"> {
    deactivation: "click" = "click";
    constructor(params: FocusButtonParameters = {}) {
        super({
            tag: "button",
            ...params,
        });
        this.element.onclick = (ev: MouseEvent) => {
            // check if this event propagates from a child node
            if (this.excludeChildren && ev.target != this.element) {
                return;
            }
            if (this.active) {
                this.deactivate();
            } else {
                this.activate();
            }
        };
    }

    temporarilyDisable(message = "Loading...") {
        this.element.disabled = true;
        let oldContent = this.element.textContent;
        this.element.textContent = message;
        return () => {
            this.element.disabled = false;
            this.element.textContent = oldContent;
        }
    }
}
