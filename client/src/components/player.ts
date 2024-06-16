import { request } from "../request";
import Component from ".";
import { FocusButton, DropdownButton, FocusButtonParameters, DropdownButtonParameters } from "./dropdown";

type WinButtonParameters = FocusButtonParameters;
/** This is a styled focus button (on/off automatic switch).
 * It needs to deal with a lot of options. There are two types of win, 'zimo' and 'dachut' (below).
 * The win will have a certain number of 'faan' (points with a lower and upper limit).
 * These points will be taken from another player if won by 'dachut'.
 * For this purpose, the win button splits into two, which have their own dropdown(s).
 */
export class WinButton extends FocusButton {
    // there are two types of wins:
    zimo: FaanDropdownButton; // 'self-draw' points are split between the table's other 3 players
    dachut: DropdownButton; // 'direct hit' points are taken from one player, needing two dropdowns.
    constructor(params: WinButtonParameters) {
        super(params)
        this.zimo = new FaanDropdownButton({
            textContent: "自摸"
        });
        this.dachut = new DropdownButton({
            textContent: "打出"
        });
    }
    activate() {
        this.element.style['width'] = "100px";
        this.element.appendChild(this.zimo.element);
        this.element.appendChild(this.dachut.element);
        return super.activate();
    }
    deactivate() {
        this.element.style['width'] = '';
        for (const c of Array.from(this.element.children)) {
            this.element.removeChild(c);
        }
        return super.deactivate();
    }
}

interface FaanDropdownButtonParameters extends DropdownButtonParameters {
    min?: number;
    max?: number;
}
class FaanDropdownButton extends DropdownButton {
    min: number;
    max: number;
    constructor(params: FaanDropdownButtonParameters) {
        let min = params.min || 3;
        let max = params.max || 13;
        // number range from min (incl.) to max (incl.)
        let faanRange = Array.from(Array(max + 1).keys()).slice(min);
        // makes dropdown item buttons for each number in range
        let options = faanRange.map((faan) => new Component({
            tag: 'button',
            textContent: faan.toString(),
            other: {
                onclick: (ev) => {
                    alert(`Took ${faan} faan!`);
                }
            }
        }).element);
        super({ ...params, options });
        this.min = min;
        this.max = max;
    }
}

export default class PlayerTag {
    // the component (a table cell element) 'player'...
    player: Component<'td'>;
    // contains the nametag (input) and winbutton components
    nameTag: Component<'input'>
    winButton: WinButton;
    constructor(parent: HTMLTableRowElement, tableNo: number, seat: SeatWind, name: string) {
        // table cell element with input and win button
        this.player = new Component({
            tag: 'td',
            parent,
            classList: ["player"],
        });
        // name input
        this.nameTag = new Component({
            tag: 'input',
            classList: ["name-tag", seat],
            parent: this.player.element,
            value: name
        });
        this.nameTag.element.addEventListener("input", async (ev) => {
            // await so the winButton rerender isn't premature
            await request("playerNameEdit", {
                "table_no": tableNo,
                "seat": seat,
                "new_name": this.nameTag.element.value
            });
            // todo: new names -> rerender win button dropdowns
        });
        this.winButton = new WinButton({
            textContent: "食",
            parent: this.player.element,
            classList: ["win-button", "small-button"]
        });
    }
}