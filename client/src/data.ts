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
