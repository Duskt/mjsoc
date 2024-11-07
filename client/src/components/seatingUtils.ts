import { getTable, MahjongUnknownTableError } from "../data";
import { editTable, request } from "../request";

export function isSat(mem: Member) {
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
export async function allocateSeats(
    seatAbsent = false,
    seatCouncilLast = true
) {
    let council: Member[] = [];
    for (let mem of window.MJDATA.members) {
        if (mem.council && seatCouncilLast) {
            council.push(mem);
            continue;
        }
        // if the player isn't seated, and either they're present or we're seating all
        if (!isSat(mem) && (seatAbsent || mem.tournament.registered)) {
            if ((await seatMemberLast(mem)) === undefined) {
                // return early because tables must be full
                return false;
            }
        }
    }
    shuffleArray(council);
    for (let cMem of council) {
        if (!isSat(cMem) && (seatAbsent || cMem.tournament.registered)) {
            // don't return unsuccessful if council can't be seated
            await seatMemberLast(cMem);
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

/**
 * Get a map of each registered council member to another random registered council member.
 * @returns Map<MemberId, MemberId>
 */
function getRandomCouncilMap() {
    // for all seated registered council members replace them with another council member ensuring no dupes
    let councilMap = new Map<MemberId, MemberId>();
    let councilIds = window.MJDATA.members
        .filter((m) => m.council && m.tournament.registered)
        .map((m) => m.id);
    let randomisedCouncilId = [...councilIds];
    shuffleArray(randomisedCouncilId);
    for (let i = 0; i < councilIds.length; i++) {
        councilMap.set(councilIds[i], randomisedCouncilId[i]);
    }
    return councilMap;
}

export async function shuffleSeats(
    eventTarget: HTMLElement | Document = document
) {
    window.sessionStorage.setItem("undoButton", "");
    let councilMap = getRandomCouncilMap();
    // most of the work is keeping the shuffle function abstract, so it takes any array
    // load tables as [x-east, x-south, x-west, x-north, y-east...]
    // preserve table order in [x, y, ...]
    let flatTables: (MemberId | 0)[] = [];
    let tableOrders: TableNo[] = [];
    for (let t of window.MJDATA.tables) {
        tableOrders.push(t.table_no);
        flatTables.push(t.east);
        flatTables.push(t.south);
        flatTables.push(t.west);
        flatTables.push(t.north);
    }
    // randomise which council members are playing
    flatTables = flatTables.map((m) => {
        if (m === 0 || !councilMap.has(m)) return m;
        let newCouncil = councilMap.get(m);
        // satisfies typescript
        return newCouncil === undefined ? m : newCouncil;
    });
    shuffleArray(flatTables);
    /* now that we have ordered tables with randomised members, simply allocate the
     * new members to their new seats */
    let tableNo: TableNo;
    let tableIndex = 0;
    // for each table
    while (tableIndex < tableOrders.length) {
        tableNo = tableOrders[tableIndex];
        // make a copy of the old table to edit
        let oldTable = getTable(tableNo);
        if (oldTable instanceof MahjongUnknownTableError) {
            console.error(oldTable);
            alert(
                "Something went wrong while shuffling the tables - please refresh and try again."
            );
            return;
        }
        let newTable = { ...oldTable };
        // and for each seat, find the new member
        let seatIndex = 0;
        while (seatIndex < 4) {
            if (seatIndex === 0) {
                newTable.east = flatTables[tableIndex * 4 + seatIndex];
            } else if (seatIndex === 1) {
                newTable.south = flatTables[tableIndex * 4 + seatIndex];
            } else if (seatIndex === 2) {
                newTable.west = flatTables[tableIndex * 4 + seatIndex];
            } else if (seatIndex === 3) {
                newTable.north = flatTables[tableIndex * 4 + seatIndex];
                await editTable(
                    {
                        tableNo,
                        newTable,
                    },
                    eventTarget
                );
            }
            seatIndex++;
        }
        tableIndex++;
    }
}
