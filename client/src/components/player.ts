import Component from ".";
import {
    DropdownButton,
    DropdownButtonParameters,
} from "./input/focus/dropdown";
import { FocusButton, FocusButtonParameters } from "./input/focus/focusNode";
import NameTag from "./nametag";
import {
    UsesSeat,
    UsesTable,
    UsesMember,
    getOtherPlayersOnTable,
    MahjongUnknownMemberError,
    getMember,
    POINTS,
} from "../data";
import { InputListener, InputListenerParameters } from "./input/listener";
import { pointTransfer, request } from "../request";
import { triggerCelebration } from "./successAnim";

// type predicate for checking list purity/homogeny
const allK = <K>(array: (K | undefined)[]): array is K[] => {
    return !array.some((v) => v === undefined);
};

// todo: replace with an editable page with a table on
function getPointsFromFaan(faan: number) {
    let pts = POINTS.get(faan);
    if (pts === undefined) throw new Error(`Couldn't get ${faan} faan.`);
    return pts;
}

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
    // holds the three dropdown buttons
    popup: Component<"div">;
    // there are two types of wins:
    zimo: FaanDropdownButton; // 'self-draw' points are split between the table's other 3 players
    dachut: DropdownButton; // 'direct hit' points are taken from one player, needing two dropdowns.
    baozimo: DropdownButton; // edge case of self-draw where all points taken from one player

    tableNo: TableNo;
    memberId: MemberId;

    constructor(params: WinButtonParameters) {
        super(params);
        this.popup = new Component({
            tag: "div",
            classList: ["win-button-popup"],
        });
        this.tableNo = params.tableNo;
        this.memberId = params.memberId;
        try {
            this.element.title = `${this.member.name} won!`;
        } catch {
            console.warn(`Failed to get ${this.memberId}`);
        }
        this.zimo = new FaanDropdownButton({
            textContent: "自摸",
            includePenalty: true,
            parent: this.popup.element,
            // don't set onclick here - do it in updatePlayers
            other: {
                title: "Self-draw",
            },
        });
        this.dachut = new DropdownButton({
            textContent: "打出",
            parent: this.popup.element,
            // don't set onclick here - do it in updatePlayers
            other: {
                title: "From another's tile",
            },
        });
        this.baozimo = new DropdownButton({
            textContent: "包自摸",
            parent: this.popup.element,
            other: {
                title: "(special case)",
            },
        });
        this.updatePlayers();
    }

    activate() {
        this.element.appendChild(this.popup.element);
        return super.activate();
    }
    deactivate() {
        this.element.removeChild(this.popup.element);
        return super.deactivate();
    }

    async onclickPointTransfer(losers: (Member | "EMPTY")[], points: number) {
        let success = await pointTransfer(
            {
                to: this.memberId,
                from: losers.map((m) => {
                    if (m === "EMPTY") {
                        throw new MahjongUnknownMemberError(0);
                    }
                    return m.id;
                }),
                points,
            },
            this.element
        );
        if (success) {
            if (points === 256 || (points === 128 && losers.length > 1)) {
                triggerCelebration();
            }
            this.deactivate();
        } else {
            alert(
                "The session timed out. Please tell a committee member to sign-in again so you can enter your points. Thank you!"
            );
            window.location.reload();
        }
    }

    updatePlayers() {
        let table = this.table;
        let member = this.member;
        let otherPlayers = getOtherPlayersOnTable(member.id, table, true);
        // deals with appending/removing children
        this.dachut.dropdown.options = otherPlayers.map(
            (m) =>
                new FaanDropdownButton({
                    textContent: m === "EMPTY" ? m : m.name,
                    classList: ["small-button"],
                    onclick: async (ev, faan) =>
                        this.onclickPointTransfer(
                            [m],
                            getPointsFromFaan(faan) * 2
                        ),
                    other: {
                        title: "",
                    },
                }).element
        );
        this.baozimo.dropdown.options = otherPlayers.map(
            (m) =>
                new FaanDropdownButton({
                    textContent: m === "EMPTY" ? m : m.name,
                    classList: ["small-button"],
                    onclick: async (ev, faan) =>
                        this.onclickPointTransfer(
                            [m],
                            getPointsFromFaan(faan) * 3
                        ),
                    other: {
                        title: "",
                    },
                }).element
        );
        this.zimo.onclick = async (ev, faan) =>
            this.onclickPointTransfer(otherPlayers, getPointsFromFaan(faan));
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
    includePenalty?: boolean;
    onclick?: (ev: MouseEvent, faan: number) => void;
}
class FaanDropdownButton extends DropdownButton {
    min: number;
    max: number;
    includePenalty: boolean;
    _onclick: (ev: MouseEvent, faan: number) => void;
    constructor(params: FaanDropdownButtonParameters) {
        let min = params.min || 3;
        let max = params.max || 10;
        // number range from min (incl.) to max (incl.)
        let faanRange = Array.from(Array(max + 1).keys()).slice(min);
        if (params.includePenalty) faanRange.push(-10);
        // makes dropdown item buttons for each number in range
        let passedOnclick = params.onclick;
        if (!passedOnclick) passedOnclick = () => {};
        let onclick;
        let options = faanRange.map((faan) => {
            onclick = (ev: MouseEvent) => passedOnclick(ev, faan);
            return new Component({
                tag: "button",
                classList: ["small-button"],
                textContent: faan == -10 ? "Penalty" : faan.toString(),
                other: {
                    onclick,
                    title: "",
                },
            }).element;
        });
        super({ ...params, options });
        this.min = min;
        this.max = max;
        this.includePenalty = params.includePenalty || false;
        this._onclick = passedOnclick;
    }
    public get onclick() {
        return this._onclick;
    }
    public set onclick(v: (ev: MouseEvent, faan: number) => void) {
        let faanRange = Array.from(Array(this.max + 1).keys()).slice(this.min);
        if (this.includePenalty) faanRange.push(-10);
        this.dropdown.options = faanRange.map((faan) => {
            let func = (ev: MouseEvent) => v(ev, faan);
            return new Component({
                tag: "button",
                classList: ["small-button"],
                textContent: faan === -10 ? "Penalty" : faan.toString(),
                other: {
                    onclick: func,
                    title: "",
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
        let me = getMember(table[this.seat], true);
        this.nameTag = new NameTag({
            classList: ["name-tag", this.seat],
            parent: this.element,
            value: me === "EMPTY" ? undefined : me,
        });
        // doesn't need to UsesMember because it controls memberId (and reacts appropriately)!
        this.memberId = table[this.seat];
        if (this.memberId === 0) {
            // explicitly EMPTY
            this.winButton = WinButton.empty(this.element);
        } else if (
            window.MJDATA.members.find((m) => m.id == this.memberId) ===
            undefined
        ) {
            // couldn't find a member with that ID
            console.warn(
                `Found a table ${table.table_no} with an invalid member of id ${
                    table[this.seat]
                }. Assuming EMPTY - the datafile might need to be manually cleaned.`
            );
            this.winButton = WinButton.empty(this.element);
        } else {
            // member exists
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
        if (newMemberId === 0) {
            // should never occur as of now
            this.winButton.element.remove();
            this.winButton = WinButton.empty(this.element);
        } else {
            let newMember = getMember(newMemberId);
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
