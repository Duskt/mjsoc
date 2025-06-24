import Component, { Params } from ".";

export interface HelpTooltipParameters extends Omit<Params<"span">, "tag"> {
    message: string
    width?: string
}

export default class HelpHoverTooltip extends Component<"span"> {
    tooltip: Tooltip;
    constructor({message, width = "200px", ...params}: HelpTooltipParameters) {
        super({
            tag: "span",
            classList: ["tooltip-parent"],
            textContent: "?",
            ...params
        });
        this.tooltip = new Tooltip({parent: this.element, textContent: message});
        this.tooltip.element.style.width = width;
    }
}

// parent:onhover tooltip { display: block }
class Tooltip extends Component<"p"> {
    constructor(params: Omit<Params<"p"> , "tag">) {
        super({
            tag: "p",
            classList: ["tooltip"],
            ...params
        });
    }
}