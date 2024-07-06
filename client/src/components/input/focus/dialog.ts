import FocusNode, { FocusNodeParameters } from "./focusNode";

export interface DialogParameters extends FocusNodeParameters<"dialog"> {
    activator: HTMLElement;
}

/** Make sure this element is covered by its children - clicking the dialog will close
 * it but clicking its children will not.
 */
export default class Dialog extends FocusNode<"dialog"> {
    activator: HTMLElement;
    excludeSelf: boolean = false;
    constructor({ activator, ...params }: DialogParameters) {
        super(params);
        this.activator = activator;
        let dialog = this;
        if (!this.activator.onclick) {
            this.activator.onclick = (ev) => {
                dialog.activate();
            };
        }
        this.exclude.push(this.activator);
        // register event in children unless clicking backdrop
        this.element.style["padding"] = "0";
    }

    activate(): this {
        this.element.showModal();
        return super.activate();
    }

    deactivate(): this {
        this.element.close();
        return super.deactivate();
    }
}
