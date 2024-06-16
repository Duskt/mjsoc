import Component, { ComponentParameters } from ".";

interface FocusNodeParameters<K extends keyof HTMLElementTagNameMap> extends ComponentParameters<K> {
    exclude?: HTMLElement[],
    excludeSelf?: true,
    excludeChildren?: boolean
}
/** An "on/off switch" element node used as a superclass.
 * .activate() function is NOT IMPLICITLY CALLED ANYWHERE (e.g. on click).
 * .deactivate() is called when the .deactivation event is registered elsewhere (Event.EventTarget). 
 * @param {boolean} [excludeSelf=true] todo: MUST BE TRUE OR ELSE IT WILL HIDE IMMEDIATELY
 * @param {boolean} [excludeChildren=true] If true, dynamically excludes any and all children of this element from 'elsewhere'
 *  @param {HTMLElement[]} [exclude=[]] Other elements to exclude from 'elsewhere'.
*/
abstract class FocusNode<K extends keyof HTMLElementTagNameMap> extends Component<K> {
    exclude: HTMLElement[];
    excludeSelf: boolean;
    excludeChildren: boolean;
    listener?: (ev: MouseEvent) => void;
    active: boolean;
    // todo: add more DocumentEventMaps
    deactivation: 'click' = 'click';
    constructor(params: FocusNodeParameters<K>) {
        super(params);
        this.exclude = params.exclude || [];
        this.excludeSelf = params.excludeSelf || true;
        this.excludeChildren = params.excludeChildren || true;
        this.active = false;
        return this
    }
    activate() {
        this.listener = (ev: MouseEvent) => {
            let target = ev.target;
            if (!(target instanceof HTMLElement)) return;
            if (this.excludeSelf && target.isSameNode(this.element)) return;
            // check if this event propagates from a child node
            let parent = target.parentElement;
            while (parent) {
                if (parent.isSameNode(this.element)) return;
                parent = parent.parentElement;
            }
            // ignore if target is the win button or this dropdown
            if (this.exclude.includes(target)) return;
            this.deactivate();
        }
        this.active = true;
        document.addEventListener(this.deactivation, this.listener);
        return this
    }
    deactivate() {
        this.active = false;
        if (this.listener) document.removeEventListener(this.deactivation, this.listener);
        return this
    }
}

export type FocusButtonParameters = Omit<FocusNodeParameters<'button'>, 'tag'>;
/** FocusNode given sensible defaults for acting as a button. onclick implicitly set.
 * 
 */
export class FocusButton extends FocusNode<'button'> {
    deactivation: 'click' = 'click';
    constructor(params: FocusButtonParameters = {}) {
        super({
            tag: 'button',
            ...params
        });
        this.element.onclick = (ev: MouseEvent) => {
            // check if this event propagates from a child node
            if (this.excludeChildren && ev.target != this.element) {
                return
            }
            if (this.active) {
                this.deactivate();
            } else {
                this.activate();
            }
        }
    }
}

class Dropdown {
    options: HTMLElement[];
    element: HTMLElement;
    constructor(options: HTMLElement[]) {
        this.element = new Component({
            tag: 'div',
            classList: ["dropdown"]
        }).element;
        this.updateOptions(options);
        // satisfies ts
        this.options = options;
    }
    updateOptions(options: HTMLElement[]) {
        this.options = options;
        Array.from(this.element.children).forEach((c) => c.remove());
        this.options.forEach((v) => this.element.appendChild(v));
    }
}

export interface DropdownButtonParameters extends FocusButtonParameters {
    options?: HTMLElement[];
}
export class DropdownButton extends FocusButton {
    dropdown: Dropdown;
    constructor(params: DropdownButtonParameters) {
        let classList = params.classList || ["small-button", "dropdown-button"];
        let options = params.options || [];
        super({ ...params, classList });
        this.dropdown = new Dropdown(options);
    }
    activate(): this {
        this.element.appendChild(this.dropdown.element);
        return super.activate()
    }
    deactivate(): this {
        this.element.removeChild(this.dropdown.element);
        return super.deactivate()
    }
}