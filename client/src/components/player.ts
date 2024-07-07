import Component from ".";
import {
    DropdownButton,
    DropdownButtonParameters,
} from "./input/focus/dropdown";
import { FocusButton, FocusButtonParameters } from "./input/focus/focusNode";
import NameTag from "./nametag";
import { UsesSeat, UsesTable, UsesMember } from "../data";
import { InputListener, InputListenerParameters } from "./input/listener";
import { request } from "../request";

// type predicate for checking list purity/homogeny
const allK = <K>(array: (K | undefined)[]): array is K[] => {
    return !array.some((v) => v === undefined);
};

interface WinButtonParameters extends FocusButtonParameters {
    tableNo: TableNo;
    memberId: MemberId;
}
/** This is a styled focus button (on/off automatic switch).
 * It needs to deal with a lot of options. There are two types of win, 'zimo' and 'dachut' (below).
 * The win will have a certain number of 'faan' (points with a lower and upper limit).
 * These points will be taken from another player if won by 'dachut'.
 * For this purpose, the win button splits into two, which have their own dropdown(s).
 */
class WinButton extends UsesMember(UsesTable(FocusButton)) {
    // there are two types of wins:
    zimo: FaanDropdownButton; // 'self-draw' points are split between the table's other 3 players
    dachut: DropdownButton; // 'direct hit' points are taken from one player, needing two dropdowns.
    tableNo: TableNo;
    memberId: MemberId;
    constructor(params: WinButtonParameters) {
        super(params);
        this.tableNo = params.tableNo;
        this.memberId = params.memberId;
        this.zimo = new FaanDropdownButton({
            textContent: "自摸",
        });
        this.dachut = new DropdownButton({
            textContent: "打出",
        });
        this.updatePlayers();
    }

    activate() {
        this.element.style["width"] = "100px";
        this.element.appendChild(this.zimo.element);
        this.element.appendChild(this.dachut.element);
        return super.activate();
    }
    deactivate() {
        this.element.style["width"] = "";
        for (const c of Array.from(this.element.children)) {
            this.element.removeChild(c);
        }
        return super.deactivate();
    }
    updatePlayers() {
        let table = this.table;
        let member = this.member;
        let otherPlayers = (["east", "south", "west", "north"] as SeatWind[])
            .filter((seat) => table[seat] != member.id)
            .map((seat) =>
                window.MJDATA.members.find((m) => m.id == table[seat])
            );
        // deals with appending/removing children
        this.dachut.dropdown.options = otherPlayers.map(
            (m) =>
                new FaanDropdownButton({
                    textContent: m?.name || "",
                    classList: ["small-button"],
                    onclick: (ev, faan) =>
                        alert(
                            `${this.member.name} took ${faan} from ${m?.name}.`
                        ),
                }).element
        );
        this.zimo.onclick = (ev, faan) => {
            let otherNames = otherPlayers.map((v) => v?.name || "EMPTY");
            alert(`${this.member.name} took ${faan} faan from ${otherNames}`);
        };
    }
    updateMember(memberId: MemberId): void {
        this.memberId = memberId;
        this.updatePlayers();
    }
    updateTable(tableNo: TableNo): void {
        throw Error("not written");
        this.tableNo = tableNo;
    }
    static empty(parent?: HTMLElement) {
        return new Component({
            tag: "button",
            textContent: "食",
            parent,
            classList: ["win-button", "small-button"],
            other: {
                disabled: true,
            },
        });
    }
}

interface FaanDropdownButtonParameters extends DropdownButtonParameters {
    min?: number;
    max?: number;
    onclick?: (ev: MouseEvent, faan: number) => void;
}
class FaanDropdownButton extends DropdownButton {
    min: number;
    max: number;
    _onclick: (ev: MouseEvent, faan: number) => void;
    constructor(params: FaanDropdownButtonParameters) {
        let min = params.min || 3;
        let max = params.max || 13;
        // number range from min (incl.) to max (incl.)
        let faanRange = Array.from(Array(max + 1).keys()).slice(min);
        // makes dropdown item buttons for each number in range
        let passedOnclick = params.onclick;
        if (!passedOnclick) passedOnclick = () => {};
        let onclick;
        let options = faanRange.map((faan) => {
            onclick = (ev: MouseEvent) => passedOnclick(ev, faan);
            return new Component({
                tag: "button",
                classList: ["small-button"],
                textContent: faan.toString(),
                other: {
                    onclick,
                },
            }).element;
        });
        super({ ...params, options });
        this.min = min;
        this.max = max;
        this._onclick = passedOnclick;
    }
    public get onclick() {
        return this._onclick;
    }
    public set onclick(v: (ev: MouseEvent, faan: number) => void) {
        let faanRange = Array.from(Array(this.max + 1).keys()).slice(this.min);
        this.dropdown.options = faanRange.map((faan) => {
            let func = (ev: MouseEvent) => v(ev, faan);
            return new Component({
                tag: "button",
                classList: ["small-button"],
                textContent: faan.toString(),
                other: {
                    onclick: func,
                },
            }).element;
        });
        this._onclick = v;
    }
}

interface PlayerTagParameters
    extends Omit<InputListenerParameters<"td">, "tag"> {
    tableNo: TableNo;
    seat: SeatWind;
}

export default class PlayerTag extends UsesTable(
    UsesSeat(InputListener<"td">)
) {
    nameTag: NameTag;
    winButton: Component<"button"> | WinButton;
    tableNo: TableNo;
    seat: SeatWind;
    memberId: MemberId | 0;
    constructor(params: PlayerTagParameters) {
        super({
            ...params,
            classList: ["player"],
            tag: "td",
        });
        this.tableNo = params.tableNo;
        let table = this.table;
        this.seat = params.seat;
        this.nameTag = new NameTag({
            classList: ["name-tag", this.seat],
            parent: this.element,
            value: window.MJDATA.members.find((v) => v.id === table[this.seat]),
        });
        // doesn't need to UsesMember because it controls memberId (and reacts appropriately)!
        this.memberId = table[this.seat];
        if (this.memberId === 0) {
            // EMPTY
            this.winButton = WinButton.empty(this.element);
        } else {
            // Player
            this.winButton = new WinButton({
                tableNo: this.tableNo,
                memberId: this.memberId,
                textContent: "食",
                parent: this.element,
                classList: ["win-button", "small-button"],
            });
        }
    }
    updateSeat(seat: Wind): void {
        throw Error("not written");
        this.seat = seat;
        this.listener = this.generateListener();
    }
    updateTable(tableNo: TableNo): void {
        throw Error("not written");
        this.tableNo = tableNo;
        this.listener = this.generateListener();
    }
    // called by the parent table when it receives the input event
    updateWinButton() {
        let newMemberId = this.table[this.seat];
        console.debug(
            "player.ts PlayerTag updateWinButton()",
            this,
            newMemberId
        );
        if (newMemberId === 0) {
            // should never occur as of now
            this.winButton.element.remove();
            this.winButton = WinButton.empty(this.element);
        } else {
            let newMember = window.MJDATA.members.find(
                (v) => v.id === newMemberId
            );
            if (!newMember)
                throw Error(`New member with id ${newMemberId} not found.`);
            if (this.winButton instanceof WinButton) {
                this.winButton.updateMember(newMember.id);
            } else if (this.memberId != 0) {
                this.winButton.element.remove();
                this.winButton = new WinButton({
                    tableNo: this.tableNo,
                    memberId: this.memberId,
                    textContent: "食",
                    parent: this.element,
                    classList: ["win-button", "small-button"],
                });
            }
        }
    }
    // PlayerTag should update the table data but all the WinButtons will be updated by the table
    generateListener(): EventListener {
        return async (ev) => {
            this.log("PlayerTag select listener!");
            // find the new member from target.value as name
            let target = ev.target;
            if (!(target instanceof HTMLSelectElement)) return;
            let newMember = window.MJDATA.members.find(
                (v) => v.name === target.value
            );
            if (!newMember) throw Error("could not find member from <option>");
            this.memberId = newMember.id;
            // update our member
            let tableCopy = this.table;
            tableCopy[this.seat] = newMember.id;
            await request(
                "/tables",
                {
                    table_no: this.tableNo,
                    table: this.table,
                },
                "PUT"
            );
            window.MJDATA.tables[this.tableNo] = tableCopy;
        };
    }
}
