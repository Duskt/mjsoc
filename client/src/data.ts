type Constructor = new (...args: any[]) => {};
type AbstractConstructor = abstract new (...args: any[]) => {};
type Class = Constructor | AbstractConstructor;

export function UsesTable<TBase extends Class>(target: TBase) {
    abstract class UsesTable extends target {
        abstract tableNo: TableNo;
        abstract updateTable(tableNo: TableNo): void;
        public get table() {
            let table = window.MJDATA.tables.find(
                (table) => table.table_no === this.tableNo
            );
            if (!table)
                throw Error(
                    `Failure to index table from tableNo ${this.tableNo}`
                );
            return table;
        }
    }
    return UsesTable;
}

export function UsesMember<TBase extends Class>(target: TBase) {
    abstract class UsesMember extends target {
        abstract memberId: MemberId;
        abstract updateMember(memberId: MemberId): void;
        public get member() {
            let member = window.MJDATA.members.find(
                (member) => member.id === this.memberId
            );
            if (!member)
                throw Error(
                    `Failure to index member from memberId ${this.memberId}`
                );
            return member;
        }
    }
    return UsesMember;
}

export function UsesSeat<TBase extends Class>(target: TBase) {
    abstract class UsesSeat extends target {
        abstract seat: SeatWind;
        abstract updateSeat(seat: SeatWind): void;
    }
    return UsesSeat;
}

export const UsesMJData = <TBase extends Constructor>(t: TBase) =>
    UsesMember(UsesSeat(UsesTable(t)));

export class MahjongUnknownTableError extends Error {
    constructor(tableNo: number) {
        super(`Couldn't find table ${tableNo}`);
        this.name = "MahjongUnknownTableError";
    }
}

export function getTable(tableNo: TableNo) {
    let table = window.MJDATA.tables.find((t) => t.table_no === tableNo);
    if (table === undefined) {
        throw new MahjongUnknownTableError(tableNo);
    } else {
        return table;
    }
}

export class MahjongUnknownMemberError extends Error {
    constructor(memberId: number) {
        let msg =
            memberId === 0
                ? "Attempted to get empty member"
                : `Couldn't find member ${memberId}`;
        super(msg);
        this.name = "MahjongUnknownMemberError";
    }
}

export function getMember(memberId: MemberId, allowEmpty?: false): Member;
export function getMember(
    memberId: MemberId | 0,
    allowEmpty: true
): Member | "EMPTY";
export function getMember(memberId: MemberId | 0, allowEmpty: boolean = false) {
    if (memberId === 0) {
        if (allowEmpty) {
            return "EMPTY";
        } else {
            throw new MahjongUnknownMemberError(0);
        }
    }
    let member = window.MJDATA.members.find((m) => m.id === memberId);
    if (member === undefined) {
        throw new MahjongUnknownMemberError(memberId);
    } else {
        return member;
    }
}

export function getOtherPlayersOnTable(
    memberId: MemberId,
    table: TableNo | TableData,
    allowEmpty: true
): ("EMPTY" | Member)[];
export function getOtherPlayersOnTable(
    memberId: MemberId,
    table: TableNo | TableData,
    allowEmpty: false
): Member[];
export function getOtherPlayersOnTable(
    memberId: MemberId,
    table: TableNo | TableData,
    allowEmpty: boolean = false
) {
    let tableData = typeof table === "number" ? getTable(table) : table;
    let otherSeats = (["east", "south", "west", "north"] as SeatWind[]).filter(
        (seat) => tableData[seat] != memberId
    );
    return otherSeats.map((seat) => {
        let mId = tableData[seat];
        if (mId !== 0) {
            return getMember(mId);
        }
        if (allowEmpty) {
            return "EMPTY";
        } else {
            throw new MahjongUnknownMemberError(0);
        }
    });
}

export const POINTS: Map<number, number> = new Map();
POINTS.set(3, 8);
POINTS.set(4, 16);
POINTS.set(5, 24);
POINTS.set(6, 32);
POINTS.set(7, 48);
POINTS.set(8, 64);
POINTS.set(9, 96);
POINTS.set(10, 128);
POINTS.set(11, 192);
POINTS.set(12, 256);
POINTS.set(13, 384);
POINTS.set(-10, -128);

export function isWind(s: string | null): s is Wind {
    if (s && ["east", "south", "west", "north"].includes(s)) {
        return true;
    }
    return false;
}

export function getSessionWind(): Wind {
    let maybeWind = window.sessionStorage.getItem("round");
    if (isWind(maybeWind)) {
        return maybeWind;
    } else {
        return "east";
    }
}
