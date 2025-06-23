import Component, { Params } from ".";
import { updateSettings } from "../request";
import IconButton from "./icons";
import Dropdown, {
    DropdownButton,
    DropdownParameters,
} from "./input/focus/dropdown";

interface SettingParameters extends Params<"fieldset"> {
    labelText: string;
    settingId: keyof Settings;
    onupdate?: (ev: Event) => void;
}

class SettingField extends Component<"fieldset"> {
    label: Component<"label">;
    input: Component<"input">;
    constructor({
        labelText,
        settingId,
        onupdate,
        ...params
    }: SettingParameters) {
        super({
            tag: "fieldset",
            ...params,
        });
        this.label = new Component({
            tag: "label",
            textContent: labelText,
            parent: this.element,
        });
        this.label.element.setAttribute("for", "matchmakingInput");
        this.input = new Component({
            tag: "input",
            parent: this.element,
            other: {
                id: `${settingId}-input`,
                name: `${settingId}`,
            },
        });
        this.input.element.oninput = (ev) => {
            if (onupdate !== undefined) {
                onupdate(ev);
            }
        }
    }
}

interface SettingsPanelParameters
    extends Omit<
        Omit<DropdownParameters<"form", "fieldset">, "tag">,
        "options"
    > {
    onupdate?: (ev: SubmitEvent) => void;
}

export class SettingsPanel extends Dropdown<"form", "fieldset"> {
    matchmaking: SettingField;
    constructor({ onupdate, ...params }: SettingsPanelParameters) {
        super({
            tag: "form",
            options: [],
            ...params,
        });
        this.matchmaking = new SettingField({
            parent: this.element,
            settingId: "matchmakingCoefficient",
            labelText: "Matchmaking Coefficient",
        });
        this.element.onsubmit = async (ev) => {
            ev.preventDefault();
            let r = await updateSettings({
                matchmakingCoefficient: Number(
                    this.matchmaking.input.element.value
                ),
            });
            if (r?.ok === true && onupdate !== undefined) {
                onupdate(ev);
            }
        };
        this.options = [this.matchmaking.element];
    }
}


export class SettingsButton extends DropdownButton<"form", "fieldset"> {
    constructor() {
        let iconbutton = new IconButton({
            icon: 'settings'
        });
        let settingsPanel = new SettingsPanel({
            onupdate: (ev) => {
                this.deactivate();
            },
        });
        super({
            dropdownTag: "form",
            dropdown: settingsPanel,
            element: iconbutton.element
        });
        this.element.classList = "settings-button dropdown-button"
    }
}
