import {
    getMember,
    getTable,
    isMember,
    MahjongUnknownTableError,
} from "../data";
import { addTable, editTable } from "../request";

// todo: refactor into a 'seating hashmap'
export function isSat(mem: Member) {
    for (let t of window.MJDATA.tables) {
        if (mem.id == t.east) return true;
        if (mem.id == t.south) return true;
        if (mem.id == t.west) return true;
        if (mem.id == t.north) return true;
    }
    return false;
}

/** Seats a member in the first empty(/council) seat found,
 * (putting them last in the array).
 * @param member
 * @param inPlaceOfCouncil [true] whether to replace council members
 * @param eventTarget [document] the node to dispatch the table update event from
 * @returns the response if successful, otherwise undefined
 */
async function seatMemberLast(
    member: Member,
    inPlaceOfCouncil = true,
    eventTarget: HTMLElement | Document = document
) {
    let councilIds = inPlaceOfCouncil
        ? window.MJDATA.members.filter((m) => m.council).map((m) => m.id)
        : [];
    for (let t of window.MJDATA.tables.sort(
        (a, b) => a.table_no - b.table_no
    )) {
        if (t.east === 0 || councilIds.includes(t.east)) {
            t.east = member.id;
        } else if (t.south === 0 || councilIds.includes(t.south)) {
            t.south = member.id;
        } else if (t.west === 0 || councilIds.includes(t.west)) {
            t.west = member.id;
        } else if (t.north === 0 || councilIds.includes(t.north)) {
            t.north = member.id;
        } else {
            // none of them were empty so skip request
            continue;
        }
        return await editTable(
            {
                tableNo: t.table_no,
                newTable: t,
            },
            eventTarget
        );
    }
}

/** Tries to create enough tables for all registered members, then seats them all.
 * @param seatAbsent [false] if true, seat all members (even unregistered)
 * @param seatCouncilLast seats council last and replaces already sat council members
 * @param [eventTarget=document] the node to dispatch the update table / add table events from
 * @returns {Promise<boolean>} whether the algorithm successfully seated every non-council member
 */
export async function allocateSeats(
    seatAbsent = false,
    seatCouncilLast = true,
    eventTarget: HTMLElement | Document = document
): Promise<boolean> {
    // first, create the minimum amount of tables that can seat everyone
    let nTables = Math.floor(
        window.MJDATA.members.filter((m) => m.tournament.registered).length / 4
    );
    // todo: relate to .env
    let maxNewTables = 10;
    while (window.MJDATA.tables.length < nTables && maxNewTables > 0) {
        await addTable(eventTarget);
        maxNewTables--;
    }
    // next, seat all the players
    let council: Member[] = [];
    for (let mem of window.MJDATA.members) {
        if (mem.council && seatCouncilLast) {
            council.push(mem);
            continue;
        }
        // if unseated and registered (if necessary), then seat them last
        if (!isSat(mem) && (seatAbsent || mem.tournament.registered)) {
            if (
                (await seatMemberLast(mem, seatCouncilLast, eventTarget)) ===
                undefined
            ) {
                console.log("ended early");
                // return early because tables must be full
                return false;
            }
        }
    }
    console.log("seating council");
    // isSat would need to be refreshed here accounting for replaced council members
    shuffleArray(council);
    for (let cMem of council) {
        if (!isSat(cMem) && (seatAbsent || cMem.tournament.registered)) {
            // don't return unsuccessful if council can't be seated
            await seatMemberLast(cMem, false, eventTarget); // IMPORTANT: if true, only last council would be sat
        }
    }
    return true;
}

/** Fully randomised shuffling. Used to shuffle which council member(s) are playing.
 * @param array - shuffled in place (and returned)
 * @returns shuffled array
 */
function shuffleArray<X>(array: X[]): X[] {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// TODO e.g. apply a low probability swap to each seat
function disturbSeats<X>(array: X[]): X[] {
    return array;
}

/** Used to randomise the player seatings. Does not affect council members.
 * @param array - shuffled in place (and returned)
 */
function randomizeSeats(array: (MemberId | 0)[]) {
    return shuffleArray(array);
    // sort the array by points
    array.sort((a, b) => {
        let memberA = getMember(a);
        let memberB = getMember(b);
        // check if either seat is empty, if so just say they're equal?
        if (!(isMember(memberA) && isMember(memberB))) return 0;
        let pts = (m: Member) =>
            m.tournament.session_points + m.tournament.total_points;
        return pts(memberA) - pts(memberB);
    });
    // partially randomise the seats
    return disturbSeats(array);
}

/** Get a map of each registered council member to another random registered council member.
 * Used to randomise which council members get to play when there are too few seats.
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

/** Switches out council members (``shuffleArray``) and randomises the seating (``randomizeSeats``).
 * **This function is called when the shuffle button is pressed**.
 * @param eventTarget the node to dispatch update table events from
 * @returns
 */
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
    randomizeSeats(flatTables);
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
