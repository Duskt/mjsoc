import Component, { Params } from ".";
import {
    DropdownButton,
    DropdownButtonParameters,
} from "./input/focus/dropdown";
import { FocusButton, FocusButtonParameters } from "./input/focus/focusNode";
import NameTag from "./nametag";
import {
    UsesSeat,
    UsesMember,
    getOtherPlayersOnTable,
    MahjongUnknownMemberError,
    getMember,
    POINTS,
    isMember,
    OptionMember,
    isWind,
    getTable,
    MahjongUnknownTableError,
} from "../data";
import { InputListener, InputListenerParameters } from "./input/listener";
import { editTable, pointTransfer } from "../request";
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
class WinButton extends UsesMember(FocusButton) {
    // holds the three dropdown buttons
    popup: Component<"div">;
    // there are two types of wins:
    zimo: FaanDropdownButton; // 'self-draw' points are split between the table's other 3 players
    dachut: DropdownButton<"div", "button">; // 'direct hit' points are taken from one player, needing two dropdowns.
    baozimo: DropdownButton<"div", "button">; // edge case of self-draw where all points taken from one player

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
            dropdownTag: "div",
            textContent: "打出",
            parent: this.popup.element,
            // don't set onclick here - do it in updatePlayers
            other: {
                title: "From another's tile",
            },
        });
        this.baozimo = new DropdownButton({
            dropdownTag: "div",
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

    async onclickPointTransfer(
        losers: OptionMember[],
        faan: number,
        kind: WinKind,
        otherPlayers: OptionMember[]
    ) {
        let roundWind = window.sessionStorage.getItem("round");
        let others: MemberId[] | null = [];
        otherPlayers.forEach((o) => {
            if (others !== null && isMember(o)) {
                others.push(o.id);
            } else {
                others = null;
            }
        });
        let transferId: number;
        if (window.MJDATA.log.length === 0) {
            transferId = 0;
        } else {
            transferId = Math.max(...window.MJDATA.log.map((l) => l.id)) + 1;
        }
        let r = await pointTransfer(
            {
                // todo: server-side id
                id: transferId,
                to: this.memberId,
                from: losers.map((m) => {
                    if (!isMember(m)) {
                        throw new MahjongUnknownMemberError(m.id);
                    }
                    return m.id;
                }),
                others,
                // points is legacy, and referred to the points the winner gets div by number of people paying
                // calc on frontend as fallback for backend
                points:
                    getPointsFromFaan(faan) *
                    (kind === "baozimo" ? 3 : kind === "dachut" ? 2 : 1), // baozimo triple from one, dachut double from one, zimo base amount from three players
                faan,
                win_kind: kind,
                datetime: new Date(),
                round_wind: isWind(roundWind) ? roundWind : null,
                seat_wind: null,
                disabled: false,
            },
            this.element
        );
        if (r.type == "pseudo") {
            alert("Network error.");
        } else if (r.ok) {
            if (faan === 10) {
                triggerCelebration();
            }
            this.deactivate();
        } else if (r.status === 401) {
            // You have to be logged in to see this page, so it must be a timeout.
            alert(
                "The session timed out. Please tell a committee member to sign-in again so you can enter your points. Thank you!"
            );
            window.location.reload();
        } else {
            alert(
                "An unknown error occurred while processing your win. Please let a member of the committee know."
            );
            console.error(r);
        }
    }

    updatePlayers() {
        let table = getTable(this.tableNo);
        if (table instanceof MahjongUnknownTableError) {
            console.error(table);
            let newButton = WinButton.empty();
            this.element.replaceWith(newButton.element);
            this.element = newButton.element;
            return;
        }
        let member = this.member;
        let otherPlayers = getOtherPlayersOnTable(member.id, table);
        // deals with appending/removing children
        this.dachut.dropdown.options = otherPlayers.map(
            (m) =>
                new FaanDropdownButton({
                    textContent: m.name,
                    classList: ["small-button"],
                    onclick: async (ev, faan) =>
                        this.onclickPointTransfer(
                            [m],
                            faan,
                            "dachut",
                            otherPlayers.filter((o) => o.id !== m.id)
                        ),
                    other: {
                        title: "",
                    },
                }).element
        );
        this.baozimo.dropdown.options = otherPlayers.map(
            (m) =>
                new FaanDropdownButton({
                    textContent: m.name,
                    classList: ["small-button"],
                    onclick: async (ev, faan) =>
                        this.onclickPointTransfer(
                            [m],
                            faan,
                            "baozimo",
                            otherPlayers.filter((o) => o.id !== m.id)
                        ),
                    other: {
                        title: "",
                    },
                }).element
        );
        this.zimo.onclick = async (ev, faan) =>
            this.onclickPointTransfer(otherPlayers, faan, "zimo", []);
    }
    updateMember(memberId: MemberId): void {
        this.memberId = memberId;
        this.updatePlayers();
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

interface AwaitButtonParams extends Omit<Params<"button">, "tag"> {
    onclick?: (ev: MouseEvent) => any;
}

class AwaitButton extends Component<"button"> {
    waiting: boolean = false;
    constructor(params: AwaitButtonParams) {
        super({ tag: "button", ...params });
        if (params.other?.onclick !== undefined) {
            throw Error("Pass onclick directly to an AwaitButton");
        }
        let passedOnclick = params.onclick || (() => {});
        let onclick = async (ev: MouseEvent) => {
            if (this.waiting) {
                console.warn(
                    "Prevented a repeat input because the previous request from this element had not completed yet.",
                    this
                );
                return;
            }
            this.waiting = true;
            let r = await passedOnclick(ev);
            this.waiting = false;
            return r;
        };
        this.element.onclick = onclick;
    }
}

interface FaanDropdownButtonParameters
    extends Omit<DropdownButtonParameters<"div", "button">, "dropdownTag"> {
    min?: number;
    max?: number;
    includePenalty?: boolean;
    onclick?: (ev: MouseEvent, faan: number) => void;
}
class FaanDropdownButton extends DropdownButton<"div", "button"> {
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
        let passedOnclick = params.onclick || (() => {});
        let options = faanRange.map((faan) => {
            let onclick = (ev: MouseEvent) => passedOnclick(ev, faan);
            return new AwaitButton({
                classList: ["small-button"],
                textContent: faan == -10 ? "Penalty" : faan.toString(),
                onclick,
                other: {
                    title: "",
                },
            }).element;
        });
        super({ dropdownTag: "div", ...params, options });
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
    disabled?: boolean;
}

export default class PlayerTag extends UsesSeat(InputListener<"td">) {
    nameTag: NameTag;
    winButton: Component<"button"> | WinButton;
    tableNo: TableNo;
    seat: SeatWind;
    memberId: MemberId | 0;
    constructor({ disabled = false, ...params }: PlayerTagParameters) {
        super({
            ...params,
            classList: ["player"],
            tag: "td",
        });
        this.tableNo = params.tableNo;
        this.seat = params.seat;
        let table = getTable(this.tableNo);
        if (table instanceof MahjongUnknownTableError) {
            this.memberId = 0;
            this.nameTag = new NameTag({
                classList: ["name-tag", this.seat],
                parent: this.element,
                value: undefined,
                other: {
                    disabled: true,
                },
            });
            this.winButton = this.disableWinButton();
            return;
        }
        this.memberId = table[this.seat];
        let me = getMember(this.memberId);
        this.nameTag = new NameTag({
            classList: ["name-tag", this.seat],
            parent: this.element,
            value: isMember(me) ? me : undefined,
            other: {
                disabled,
            },
        });
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
    /** Updates the WinButton to reflect the new `Member` at `this.seat`.
     * Does not update `this.memberId``.
     * Called by the parent component when member changes.
     */
    updateWinButton(table?: TableData | MahjongUnknownTableError) {
        if (table === undefined) {
            table = getTable(this.tableNo);
        }
        if (table instanceof MahjongUnknownTableError) {
            this.disableWinButton();
            return;
        }
        let newMember = getMember(table[this.seat]);
        if (!isMember(newMember)) {
            this.disableWinButton();
            return;
        }
        // new member is a real Member and table is a real TableData
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
    disableWinButton() {
        let newButton = WinButton.empty();
        this.winButton.element.replaceWith(newButton.element);
        this.winButton = newButton;
        return this.winButton;
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
            let tableCopy = getTable(this.tableNo);
            if (tableCopy instanceof MahjongUnknownTableError) {
                console.error(tableCopy);
                alert(
                    "An error occurred while finding the table to modify. Please contact a member of the council."
                );
                return;
            }
            tableCopy[this.seat] = newMember.id;
            editTable(
                [
                    {
                        tableNo: this.tableNo,
                        newTable: tableCopy,
                    },
                ],
                this.nameTag.element
            );
        };
    }
}
