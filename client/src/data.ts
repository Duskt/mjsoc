type Constructor = new (...args: any[]) => {};
type AbstractConstructor = abstract new (...args: any[]) => {};
type Class = Constructor | AbstractConstructor;

export function UsesMember<TBase extends Class>(target: TBase) {
    abstract class UsesMember extends target {
        abstract memberId: MemberId;
        abstract updateMember(memberId: MemberId): void;
        public get member() {
            let member = window.MJDATA.members.find((member) => member.id === this.memberId);
            if (!member) throw Error(`Failure to index member from memberId ${this.memberId}`);
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

export class MahjongUnknownTableError extends Error {
    constructor(tableNo: number) {
        super(`Couldn't find table ${tableNo}`);
        this.name = 'MahjongUnknownTableError';
    }
}

export function getTable(tableNo: TableNo) {
    let table = window.MJDATA.tables.find((t) => t.table_no === tableNo);
    if (table === undefined) {
        table = JSON.parse(window.sessionStorage.getItem('savedTables') || '[]').find(
            (t: TableData) => t.table_no === tableNo,
        );
    }
    if (table === undefined) {
        return new MahjongUnknownTableError(tableNo);
    } else {
        return table;
    }
}

export class MahjongUnknownMemberError extends Error {
    constructor(memberId: number) {
        let msg =
            memberId === 0 ? 'Attempted to get empty member' : `Couldn't find member ${memberId}`;
        super(msg);
        this.name = 'MahjongUnknownMemberError';
    }
}

interface EmptyMember {
    id: 0;
    name: 'EMPTY';
    tournament: {
        total_points: 0;
        session_points: 0;
        registered: false;
    };
}
const emptyMember: EmptyMember = {
    id: 0,
    name: 'EMPTY',
    tournament: {
        total_points: 0,
        session_points: 0,
        registered: false,
    },
};

interface ErrorMember {
    id: number;
    name: 'ERROR';
    tournament: {
        total_points: 0;
        session_points: 0;
        registered: false;
    };
}
const errorMember = (id: number) =>
    ({
        id,
        name: 'ERROR',
        tournament: {
            total_points: 0,
            session_points: 0,
            registered: false,
        },
    }) as ErrorMember;

export type OptionMember = Member | ErrorMember | EmptyMember;

export function isMember(member: Member | EmptyMember | ErrorMember): member is Member {
    return member.id > 0;
}

export function getMember(memberId: MemberId | 0): Member | EmptyMember | ErrorMember {
    if (memberId === 0) {
        return emptyMember;
    }
    let member = window.MJDATA.members.find((m) => m.id === memberId);
    if (member === undefined) {
        return errorMember(memberId);
    } else {
        return member;
    }
}

export function getOtherPlayersOnTable(memberId: MemberId, table: TableData) {
    let otherSeats = (['east', 'south', 'west', 'north'] as SeatWind[]).filter(
        (seat) => table[seat] != memberId,
    );
    return otherSeats.map((seat) => {
        let mId = table[seat];
        return getMember(mId);
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
    if (s && ['east', 'south', 'west', 'north'].includes(s)) {
        return true;
    }
    return false;
}

export function getSessionWind(): Wind {
    let maybeWind = window.sessionStorage.getItem('round');
    if (isWind(maybeWind)) {
        return maybeWind;
    } else {
        return 'east';
    }
}

export function updateMembers(affectedMembers: Member[], key: keyof Member = 'id') {
    let newMember: Member | undefined;
    window.MJDATA.members = window.MJDATA.members.map((oldMember) => {
        newMember = affectedMembers.find((m) => m[key] === oldMember[key]);
        return newMember !== undefined ? newMember : oldMember;
    });
}
