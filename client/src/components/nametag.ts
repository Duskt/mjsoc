import { InputListener, InputListenerParameters } from './input/listener';

interface NameTagParameters extends Omit<Omit<InputListenerParameters<'select'>, 'tag'>, 'value'> {
    value?: Member;
}

export default class NameTag extends InputListener<'select'> {
    nameOptions: { [id: Member['id']]: HTMLOptionElement };
    empty?: HTMLOptionElement;
    constructor({ ...params }: NameTagParameters) {
        super({
            tag: 'select',
            ...params,
            value: undefined,
        });
        this.element.setAttribute('name', 'nametag');
        this.nameOptions = {};
        // render selected option first
        if (params.value) {
            this.renderOption(params.value);
        } else {
            this.renderPlaceholder();
            this.element.style.fontWeight = 'bold';
            this.element.style.color = 'var(--error-red)';
        }

        // render other options
        let sortedMembers = [...window.MJDATA.members].sort((a, b) => {
            if (a.name > b.name) return 1;
            else if (a.name < b.name) return -1;
            else return 0;
        });
        for (const m of sortedMembers) {
            if (m.id === params.value?.id) continue;
            if (!m.tournament.registered) continue;
            this.renderOption(m);
        }
        // if (params.value) this.renderPlaceholder();
    }

    renderOption(member: Member) {
        let optElem = document.createElement('option');
        optElem.textContent = member.name;
        optElem.style.fontWeight = 'normal';
        optElem.style.color = 'black';
        this.nameOptions[member.id] = optElem;
        this.element.appendChild(optElem);
        return optElem;
    }

    renderPlaceholder() {
        let optElem = document.createElement('option');
        optElem.textContent = 'EMPTY';
        optElem.style.fontWeight = 'bold';
        optElem.style.color = 'var(--error-red)';
        this.empty = optElem;
        this.element.appendChild(optElem);
        return optElem;
    }

    generateListener(): EventListener {
        // removes EMPTY from options
        return () => {
            this.empty?.remove();
            this.element.style.fontWeight = 'normal';
            this.element.style.color = 'black';
            this.listener = undefined;
        };
    }
}
