import Component, { ComponentParameters } from ".";
import { InputListener, InputListenerParameters } from "./input/listener";

interface NameTagParameters
    extends Omit<Omit<InputListenerParameters<"select">, "tag">, "value"> {
    value?: Member;
}

export default class NameTag extends InputListener<"select"> {
    nameOptions: { [id: Member["id"]]: HTMLOptionElement };
    empty?: HTMLOptionElement;
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
            if (!m.tournament.registered) continue;
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
        this.empty = optElem;
        this.element.appendChild(optElem);
        return optElem;
    }

    generateListener(): EventListener {
        // removes EMPTY from options
        return () => {
            this.empty?.remove();
            this.listener = undefined;
        };
    }
}
