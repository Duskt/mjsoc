import { FocusButton, FocusButtonParameters } from "./focusNode";
import Component from "../..";

export default class Dropdown {
    element: HTMLElement;
    constructor(options: HTMLElement[]) {
        this.element = new Component({
            tag: "div",
            classList: ["dropdown"],
        }).element;
        this.options = options;
    }
    public get options() {
        return Array.from(this.element.children) as HTMLElement[];
    }
    public set options(value: HTMLElement[]) {
        this.options.forEach((c) => c.remove());
        value.forEach((v) => this.element.appendChild(v));
    }
}

export interface DropdownButtonParameters extends FocusButtonParameters {
    options?: HTMLElement[];
}
/** A FocusButton which when clicked displays a dropdown of each element
 * in options, hidden when focus is lost.
 *
 * To customise onclick functionality for each option the passed
 * options should be modified directly. If onclick is passed into this
 * element it will be overwritten.
 */
export class DropdownButton extends FocusButton {
    dropdown: Dropdown;
    /**
     * 
     * @param {object} params Parameter object:
     * @param {HTMLElement[]} params.options Dropdown children (buttons recommended)
     */
    constructor(params: DropdownButtonParameters) {
        let classList = params.classList || ["small-button", "dropdown-button"];
        let options = params.options || [];
        super({ ...params, classList });
        this.dropdown = new Dropdown(options);
    }
    activate(): this {
        this.element.appendChild(this.dropdown.element);
        return super.activate();
    }
    deactivate(): this {
        if (!this.element.contains(this.dropdown.element))
            throw new DOMException(
                "DropdownButton attempted deactivation when inactive."
            );
        this.element.removeChild(this.dropdown.element);
        return super.deactivate();
    }
}
