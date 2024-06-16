import Component, { ComponentParameters } from "./component";

interface FocusNodeParameters<K extends keyof HTMLElementTagNameMap> extends ComponentParameters<K> {
    exclude?: HTMLElement[],
    excludeSelf?: true,
    excludeChildren?: boolean
}
/** An "on/off switch" element node used as a superclass.
 * .activate() function is NOT IMPLICITLY CALLED ANYWHERE (e.g. on click).
 * .deactivate() is called when the .deactivation event is registered elsewhere (Event.EventTarget). 
 * @param {HTMLElement[]} [exclude=[]] Elements to exclude from 'elsewhere'.
 * @param {boolean} [excludeSelf=true] todo: MUST BE TRUE OR ELSE IT WILL HIDE IMMEDIATELY
 * @param {boolean} [excludeChildren=true] If true, dynamically excludes any and all children of this element from 'elsewhere'
*/
class FocusNode<K extends keyof HTMLElementTagNameMap> extends Component<K> {
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
        if (this.excludeSelf) this.exclude.push(this.element);
        return this
    }
    activate() {
        console.log(`Activating ${this.constructor.name}`);
        this.listener = (ev: MouseEvent) => {
            if (this.excludeChildren) {
                // todo: why is the cast necessary?
                let childElements = Array.from(this.element.children).filter((v) => (v instanceof HTMLElement)) as HTMLElement[];
                let newChildren = childElements.filter((v) => !this.exclude.includes(v));
                this.exclude.concat(newChildren);
                // in case of children being deleted
                this.exclude = this.exclude.filter((v) => v);
            };
            // ignore if target is the win button or this dropdown
            if (ev.target instanceof HTMLElement && this.exclude.includes(ev.target)) return;
            this.deactivate();
        }
        this.active = true;
        console.log("added ev lis");
        document.addEventListener(this.deactivation, this.listener);
        return this
    }
    deactivate() {
        console.log(`DEactivating ${this.constructor.name}`);
        this.active = false;
        console.log("remov ev lis");
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
            console.log(`FocusButton (${this.constructor.name}).onclick`);
            // todo: could be done more precisely...
            // stop parent focusNodes from deactivating onclick
            ev.stopPropagation();
            if (this.active) {
                this.deactivate();
            } else {
                this.activate();
            }
        }
    }
}

class Dropdown {
    element: HTMLElement;
    options: HTMLElement[];
    constructor(options: HTMLElement[]) {
        this.element = new Component({
            tag: 'div',
            classList: ["dropdown"]
        }).element;
        this.options = options;
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