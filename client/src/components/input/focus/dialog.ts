import Component, { ComponentParameters } from "../..";
import FocusNode, { FocusNodeParameters } from "./focusNode";

export interface DialogParameters
    extends Omit<FocusNodeParameters<"dialog">, "tag"> {
    activator: Component<any>;
}

/**
 * A Dialog is a popup which can be activated/deactived (is a FocusNode).
 * It automatically attaches itself to the passed ``activator`` and activates
 * upon clicking the activator.
 *
 * IMPORTANT: Clicking a dialog will close it (this includes the shadow and the dialog box).
 * If this is not desired, push a ``<div>`` which fills the dialog box onto ``this.exclude``.
 * The shadow is cast over the activator, so clicking the activator again will deactivate
 * the dialog via the shadow.
 */
export default class Dialog extends FocusNode<"dialog"> {
    activator: Component<any>;
    excludeSelf: boolean = false;
    constructor({ activator, ...params }: DialogParameters) {
        super({
            tag: "dialog",
            ...params,
        });
        if (activator.element === params.parent) {
            console.warn(
                `Setting the activator as a parent of the ${this} dialog will mean that whenever it is clicked it is reactivated. To bypass this warning, manually add the child node.`
            );
        }
        this.activator = activator;
        let dialog = this;
        this.activator.element.addEventListener("click", (ev: MouseEvent) => {
            this.activate();
        });
        this.exclude.push(this.activator.element);
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

interface ConfirmationDialogParameters extends DialogParameters {
    message: string;
    onconfirm: (ev: MouseEvent) => void;
    oncancel?: (ev: MouseEvent) => void;
}

/**
 * IMPORTANT: the cancel button automatically closes the dialog.
 * ev.preventDefault will prevent this.
 */
export class ConfirmationDialog extends Dialog {
    div: Component<"div">;
    p: Component<"p">;
    buttonsDiv: Component<"div">;
    confirm: Component<"button">;
    cancel: Component<"button">;
    onconfirm: (ev: MouseEvent) => void;
    oncancel: (ev: MouseEvent) => void;
    constructor(params: ConfirmationDialogParameters) {
        super(params);
        this.element.style.maxWidth = "50%";
        this.div = new Component({
            tag: "div",
            parent: this.element,
        });
        this.div.element.style.width = "100%";
        this.div.element.style.height = "100%";
        this.p = new Component({
            tag: "p",
            parent: this.div.element,
            other: {
                innerHTML: params.message.replace("\n", "<br/>"),
            },
        });
        this.p.element.style.width = "100%";
        this.buttonsDiv = new Component({
            tag: "div",
            parent: this.div.element,
        });
        this.buttonsDiv.element.style.display = "flex";
        this.buttonsDiv.element.style.justifyContent = "center";
        this.confirm = new Component({
            tag: "button",
            textContent: "Yes",
            parent: this.buttonsDiv.element,
        });
        this.cancel = new Component({
            tag: "button",
            textContent: "Cancel",
            parent: this.buttonsDiv.element,
        });
        this.confirm.element.style.fontSize = "16px";
        this.cancel.element.style.fontSize = "16px";
        this.confirm.element.style.margin = "0 1em 1em 1em";
        this.cancel.element.style.margin = "0 1em 1em 1em";
        this.confirm.element.style.padding = "4px";
        this.cancel.element.style.padding = "4px";
        this.onconfirm = params.onconfirm;
        this.oncancel =
            params.oncancel === undefined ? () => {} : params.oncancel;
        this.updateButtons();
    }
    updateButtons() {
        this.cancel.element.onclick = (ev) => {
            this.oncancel(ev);
            if (!ev.defaultPrevented) {
                this.deactivate();
            }
        };
        this.confirm.element.onclick = this.onconfirm;
    }
}
