import { request } from "../request";
import Component from ".";
import { DropdownButton, DropdownButtonParameters } from "./focus/dropdown";
import { FocusButton, FocusButtonParameters } from "./focus";
import NameTag from "./select";

interface WinButtonParameters extends FocusButtonParameters {
    // technically this should enforce length 3: if i can be bothered to write a ts predicate...
    otherPlayers: string[];
}
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
            textContent: "自摸",
        });
        this.dachut = new DropdownButton({
            textContent: "打出",
        });
        this.updatePlayers(params.otherPlayers);
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
    updatePlayers(otherPlayers: string[]) {
        // deals with appending/removing children
        this.dachut.dropdown.updateOptions(otherPlayers.map((v) => new FaanDropdownButton({
            textContent: v,
            classList: ["small-button"],
        }).element));
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
            classList: ["small-button"],
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
/**
 * @param {TableData} initTable the TableData this tag was initialised with (NOT UPDATED!)
 */
export default class PlayerTag {
    // the component (a table cell element) 'player'...
    player: Component<'td'>;
    // contains the nametag (input) and winbutton components
    nameTag: NameTag
    winButton: WinButton;
    constructor(public parent: HTMLTableRowElement, public table: TableData, public seat: SeatWind) {
        // table cell element with input and win button
        this.player = new Component({
            tag: 'td',
            parent,
            classList: ["player"],
        });
        // name input
        this.nameTag = new NameTag({
            classList: ["name-tag", seat],
            parent: this.player.element,
            value: {
                id: 0,
                name: table[seat],
                points: 0
            }
        }); //new Component({tag: 'input',classList: ["name-tag", seat],parent: this.player.element,value: table[seat]});
        this.nameTag.element.addEventListener("input", async (ev) => {
            let newName = this.nameTag.element.value;
            this.update({
                ...this.table,
                [this.seat]: newName,
            });
            // await so the winButton rerender isn't premature
            await request("playerNameEdit", {
                "table_no": table.table_no,
                "seat": seat,
                "new_name": newName,
            });
        });
        // filtering against the seat wind and then getting the names avoids crashing on duplicate
        let otherPlayers = (['east', 'south', 'west', 'north']
            .filter((v) => v != seat) as SeatWind[])
            .map((v) => table[v]);
        if (otherPlayers.length != 3) {
            console.error(this.player, `got ${otherPlayers.length} other players when expecting 3:`, otherPlayers);
        }
        this.winButton = new WinButton({
            otherPlayers,
            textContent: "食",
            parent: this.player.element,
            classList: ["win-button", "small-button"]
        });
    }
    update(table: TableData) {
        this.table = table;
        let otherPlayers = (['east', 'south', 'west', 'north'] as SeatWind[])
            .filter((v) => v != this.seat)
            .map((v) => table[v]);
        this.winButton.updatePlayers(otherPlayers);
    }
}