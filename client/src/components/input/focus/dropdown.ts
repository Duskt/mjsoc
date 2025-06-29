import { FocusButton, FocusButtonParameters } from "./focusNode";
import Component, { Params } from "../..";

export interface DropdownParameters<
    K extends keyof HTMLElementTagNameMap,
    O extends keyof HTMLElementTagNameMap
> extends Params<K> {
    tag: K;
    options: HTMLElementTagNameMap[O][];
}

export default class Dropdown<
    K extends keyof HTMLElementTagNameMap,
    O extends keyof HTMLElementTagNameMap
> {
    element: HTMLElementTagNameMap[K];
    constructor({ tag, options = [] }: DropdownParameters<K, O>) {
        this.element = new Component({
            tag,
            classList: ["dropdown"],
        }).element;
        this.options = options;
    }
    public get options() {
        return Array.from(this.element.children) as HTMLElementTagNameMap[O][];
    }
    public set options(value: HTMLElementTagNameMap[O][]) {
        this.options.forEach((c) => c.remove());
        value.forEach((v) => this.element.appendChild(v));
    }
}

export interface DropdownButtonParameters<
    D extends keyof HTMLElementTagNameMap, // element kind for the dropdown popup
    O extends keyof HTMLElementTagNameMap // element kind for all options
> extends FocusButtonParameters {
    dropdownTag: D;
    dropdown?: Dropdown<D, O>;
    dropdownDestination?: HTMLElement;
    options?: HTMLElementTagNameMap[O][]; // if dropdown is provided, this does not apply
}
/** A FocusButton which when clicked displays a dropdown of each element
 * in options, hidden when focus is lost.
 *
 * To customise onclick functionality for each option the passed
 * options should be modified directly. If onclick is passed into this
 * element it will be overwritten.
 */
export class DropdownButton<
    D extends keyof HTMLElementTagNameMap, // element kind for the dropdown popup
    O extends keyof HTMLElementTagNameMap // element kind for all options
> extends FocusButton {
    dropdown: Dropdown<D, O>;
    dest: HTMLElement;
    /**
     *
     * @param {object} params Parameter object:
     * @param {HTMLElement[]} params.options Dropdown children (buttons recommended)
     */
    constructor({ dropdown, ...params }: DropdownButtonParameters<D, O>) {
        let classList = params.classList || ["small-button", "dropdown-button"];
        let options = params.options || [];
        super({ ...params, classList });
        this.dropdown =
            dropdown ||
            new Dropdown({
                tag: params.dropdownTag,
                options,
            });
        this.dest = params.dropdownDestination || this.element;
    }
    activate(): this {
        this.dest.appendChild(this.dropdown.element);
        return super.activate();
    }
    deactivate(): this {
        if (!this.dest.contains(this.dropdown.element))
            throw new DOMException(
                "DropdownButton attempted deactivation when inactive."
            );
        this.dest.removeChild(this.dropdown.element);
        return super.deactivate();
    }
}
