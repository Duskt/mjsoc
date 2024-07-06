import Component, { ComponentParameters } from ".";
import { UsesTable, UsesSeat } from "../data";

interface NameTagParameters
    extends Omit<Omit<ComponentParameters<"select">, "tag">, "value"> {
    value?: Member;
}

export default class NameTag extends Component<"select"> {
    nameOptions: { [id: Member["id"]]: HTMLOptionElement };
    constructor({ ...params }: NameTagParameters) {
        super({
            tag: "select",
            ...params,
            value: undefined,
        });

        this.nameOptions = {};
        // render selected option first
        if (params.value) {
            this.renderOption(params.value);
        } else {
            this.renderPlaceholder();
        }

        // render other options
        for (const m of window.MJDATA.members) {
            if (m.id === params.value?.id) continue;
            this.renderOption(m);
        }
    }

    renderOption(member: Member) {
        let optElem = document.createElement("option");
        optElem.textContent = member.name;
        this.nameOptions[member.id] = optElem;
        this.element.appendChild(optElem);
        return optElem;
    }

    renderPlaceholder() {
        let optElem = document.createElement("option");
        optElem.textContent = "EMPTY";
        this.element.appendChild(optElem);
        return optElem;
    }
}
