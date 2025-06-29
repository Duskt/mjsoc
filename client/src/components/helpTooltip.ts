import Component, { Params } from ".";

export interface TooltipParameters extends Omit<Params<"div">, "tag"> {
    message: string;
    parent: HTMLElement;
    widthExpandDirection?: "left" | "right";
    width: string;
}

export default class HelpHoverTooltip extends Component<"span"> {
    tooltip: Tooltip;
    constructor({ parent, ...params }: TooltipParameters) {
        super({
            tag: "span",
            classList: ["tooltip-parent"],
            parent,
            textContent: "?",
        });
        this.tooltip = new Tooltip({ parent: this.element, ...params });
    }
}

// parent:onhover tooltip { display: block }
class Tooltip extends Component<"div"> {
    constructor({
        message,
        width = "200px",
        widthExpandDirection = "right",
        ...params
    }: TooltipParameters) {
        super({
            tag: "div",
            classList: ["tooltip"],
            ...params,
        });
        this.element.style.width = width;
        if (widthExpandDirection === "right") {
            this.element.style.left = "0";
        } else {
            this.element.style.right = "0";
        }
        let lastBr;
        for (let line of message.split("\n")) {
            let pElem = document.createElement("p");
            pElem.textContent = line;
            this.element.appendChild(pElem);
            lastBr = document.createElement("br");
            this.element.appendChild(lastBr);
        }
        lastBr?.remove();
    }
}
