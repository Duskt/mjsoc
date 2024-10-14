import { request } from "../request";

function isSat(mem: Member) {
    for (let t of window.MJDATA.tables) {
        if (mem.id == t.east) return true;
        if (mem.id == t.south) return true;
        if (mem.id == t.west) return true;
        if (mem.id == t.north) return true;
    }
    return false;
}

async function seatMemberLast(mem: Member) {
    for (let t of window.MJDATA.tables.sort(
        (a, b) => a.table_no - b.table_no
    )) {
        if (t.east === 0) {
            t.east = mem.id;
        } else if (t.south === 0) {
            t.south = mem.id;
        } else if (t.west === 0) {
            t.west = mem.id;
        } else if (t.north === 0) {
            t.north = mem.id;
        } else {
            // none of them were empty so skip request
            continue;
        }
        return await request(
            "/tables",
            {
                table_no: t.table_no,
                table: t,
            },
            "PUT"
        );
    }
}

/**
 * Returns boolean for whether every member was successfully seated.
 */
export async function allocateSeats() {
    for (let mem of window.MJDATA.members) {
        if (!isSat(mem)) {
            if ((await seatMemberLast(mem)) === undefined) {
                return false;
            }
        }
    }
    return true;
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export async function shuffleSeats() {
    // most of the work is keeping the shuffle function abstract, so it takes any array
    // load tables as [x-east, x-south, x-west, x-north, y-east...]
    // preserve table order in [x, y, ...]
    let flatTables: (MemberId | 0)[] = [];
    let tableOrders: number[] = [];
    for (let t of window.MJDATA.tables) {
        tableOrders.push(t.table_no);
        flatTables.push(t.east);
        flatTables.push(t.south);
        flatTables.push(t.west);
        flatTables.push(t.north);
    }
    shuffleArray(flatTables);
    // now unpack that into MJDATA
    let index = 0;
    let tablen: number;
    let seatn: number;
    let table: TableData | undefined;
    while (index < flatTables.length) {
        tablen = tableOrders[Math.floor(index / 4)];
        seatn = index % 4;
        table = window.MJDATA.tables.find((v) => v.table_no == tablen);
        if (table === undefined) throw Error("how was table undefined!!!");
        if (seatn === 0) {
            table.east = flatTables[index];
        } else if (seatn === 1) {
            table.south = flatTables[index];
        } else if (seatn === 2) {
            table.west = flatTables[index];
        } else if (seatn === 3) {
            table.north = flatTables[index];
            await request(
                "/tables",
                {
                    table_no: tablen,
                    table: table,
                },
                "PUT"
            );
        }
        index++;
    }
}
