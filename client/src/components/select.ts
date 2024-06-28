import Component, { ComponentParameters } from ".";

interface NameTagParameters extends Omit<Omit<ComponentParameters<'select'>, 'tag'>, 'value'> {
    value: Member
}

export default class NameTag extends Component<'select'> {
    nameOptions: {
        [id: Member['id']]: HTMLOptionElement
    }
    constructor(params: NameTagParameters) {
        super({
            tag: 'select',
            ...params,
            value: undefined
        })
        this.nameOptions = {};
        this.renderOption(params.value);
        for (const m of window.MJDATA.members) {
            if (m.id === params.value.id) continue;
            this.renderOption(m);
        }
    }
    renderOption(member: Member) {
        let optElem = document.createElement('option');
        optElem.textContent = member.name;
        this.nameOptions[member.id] = optElem;
        this.element.appendChild(optElem);
        return optElem
    }
}