import Component, { Params } from "../..";

interface InputParams extends Params<"input"> {
    id: string;
    autocomplete: AutoFill;
}

export type LabelledInput<T extends Input> = Omit<T, "label"> & {
    label: Component<"label">;
};

export class Input extends Component<"input"> {
    constructor({ id, ...params }: InputParams) {
        super({
            tag: "input",
            id,
            ...params,
        });
        this.element.autocomplete = params.autocomplete;
    }
    label(text: string): LabelledInput<typeof this> {
        let obj = {
            label: new Component({
                tag: "label",
                textContent: text,
                other: {
                    htmlFor: this.element.id,
                },
            }),
        };
        this.element.insertAdjacentElement("beforebegin", obj.label.element);
        return Object.setPrototypeOf(obj, this);
    }
}

interface SmartInputParams extends Omit<InputParams, "autocomplete"> {
    optionsValues: string[];
}

/** Does not normalize the target strings at all! Recommended to trim() and lowercase() before.
 *
 * @param targets: rest parameter of strings to match
 * @returns
 */
function getMatchingSubstrings(...targets: string[]) {
    let substring_match = "";
    for (let i = 0; i < Math.min(...targets.map((t) => t.length)); i++) {
        let next_char = targets[0][i];
        if (targets.every((v) => v[i] === next_char)) {
            substring_match = substring_match + next_char;
        } else {
            break;
        }
    }
    return substring_match;
}

/** optionsValues does NOT update the element's children; call renderOptions(this.optionsValues).
 *
 */
export class SmartInput extends Input {
    datalist: Component<"datalist">;
    repeatedAction: boolean = false;
    constructor({ id, parent, optionsValues, ...params }: SmartInputParams) {
        super({
            id,
            parent,
            autocomplete: "off", // not relevant for this component - we know all possible values
            ...params,
        });
        let dlid = `${id}-datalist`;
        this.datalist = new Component({
            tag: "datalist",
            parent,
            id: dlid,
        });
        // equivalent to using the setter
        this.renderOptions(optionsValues);

        this.element.setAttribute("list", dlid);
        this.element.onchange = (ev) => {
            this.element.focus(); // onchange only procs when the content has changed before a tab input, so tab can still switch element focus otherwise
            let match = this.match(this.element.value);
            if (match === this.element.value) return;
            if (match !== undefined) {
                this.element.value = match;
            }
        };
    }

    // todo: resolve the mystery of why getters and setters didn't work. I reckon it's because
    // Labelled delegates to the original via prototyping.
    getOptions(): string[] {
        return Array.from(this.datalist.element.children).map((e) => {
            if (!(e instanceof HTMLOptionElement))
                console.warn(
                    "getOptions called on object (below) but a non-option child was detected: should I parse?",
                    this
                );
            return e.textContent || "";
        });
    }
    match(value: string) {
        value = value.trim().toLowerCase();
        // don't normalize matches immediately; we want to try and fix casing
        let matches = this.getOptions().filter((o) =>
            o.trim().toLowerCase().startsWith(value)
        );
        if (matches.length === 1) {
            return matches[0];
        } else if (matches.length === 0) {
            return;
        } else {
            // don't change original casing, but now we normalize matches
            let matchedSubstr = getMatchingSubstrings(
                ...matches.map((m) => m.trim().toLowerCase())
            );
            return value + matchedSubstr.slice(value.length);
        }
    }
    renderOptions(optionsValues: string[]) {
        let newOptions: Component<"option">[] = [];
        for (let o of optionsValues) {
            newOptions.push(
                new Component({
                    tag: "option",
                    textContent: o,
                })
            );
        }
        this.datalist.clearChildNodes();
        this.datalist.appendChildNodes(...newOptions.map((c) => c.element));
    }
}
