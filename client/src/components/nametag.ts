import Component, { ComponentParameters } from ".";
import { request } from "../request";

interface NameTagParameters extends Omit<Omit<ComponentParameters<'select'>, 'tag'>, 'value'> {
    table_no: number,
    seat: SeatWind,
    value?: Member
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
        // render selected option first
        if (params.value) {
            this.renderOption(params.value);
        } else {
            this.renderPlaceholder()
        };

        // render other options
        for (const m of window.MJDATA.members) {
            if (m.id === params.value?.id) continue;
            this.renderOption(m);
        }

        this.element.addEventListener("input", async (ev) => {
            console.debug("Nametag select input event:", ev.target);
            let newMember = window.MJDATA.members.find((v) => v.name === this.element.value);
            if (!newMember) throw Error("<option> had an unlisted member name");
            let table = window.MJDATA.tables.find((v) => v.table_no === params.table_no);
            if (!table) throw Error("table_no is incorrect or out of date");
            console.debug("newMember", newMember, "new table", table);
            table[params.seat] = newMember.id;
            // await so the winButton rerender isn't premature
            await request("table", {
                table_no: params.table_no,
                table
            }, "PUT");
        });
    }

    renderOption(member: Member) {
        let optElem = document.createElement('option');
        optElem.textContent = member.name;
        this.nameOptions[member.id] = optElem;
        this.element.appendChild(optElem);
        return optElem
    }

    renderPlaceholder() {
        let optElem = document.createElement('option');
        optElem.textContent = "EMPTY";
        this.element.appendChild(optElem);
        return optElem
    }
}