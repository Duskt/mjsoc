import { FocusButton, FocusButtonParameters } from ".";
import Component from "..";

export default class Dropdown {
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