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

// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

/** Inserts ``item`` into ``array`` at the sorted position
 * @param array a **SORTED** array to insert into (**not modified in place**)
 * @param item to insert
 * @param key [(x) => x] compares (key(item) to key(array[index]))
 * @returns new array containing inserted item
 */
function insertSorted<X>(
    array: Array<X>,
    item: X,
    key: (item: X) => any = (x) => x
) {
    if (array.length == 0) {
        return [item];
    }
    let newArray: typeof array | undefined;
    // ``every`` is a for each loop which you can break out of
    if (
        array.every((i, index) => {
            if (key(item) < key(i)) {
                newArray = array
                    .slice(undefined, index)
                    .concat(item, ...array.slice(index, undefined));
                return false;
            }
            return true;
        })
    ) {
        return array.concat(item);
    }
    if (newArray === undefined) {
        throw new Error("impossible");
    }
    return newArray;
}

/** Maps each item of an array to a new index given by a random point from a normal distribution
 * @param array to shuffle (**not modified in-place**)
 * @param stdev [1] shared stdev of normal dist.
 * @param key [(_, index) => index] the mean of the normal distribution sampled for that item
 * @returns new shuffled array
 */
function weightedNormalShuffle<X>(
    array: Array<X>,
    stdev = 1,
    key: (item: X, index: number, array: Array<X>) => number = (
        item,
        index,
        array
    ) => index
) {
    // map each item to a point sampled from a normal distribution N(mu=index of item, sigma=stdev)
    let shuffleMap: Map<X, number> = new Map();
    array.forEach((item, index) => {
        shuffleMap.set(item, gaussianRandom(index, stdev));
    });

    // add each key (item) to the new list, sorting them by value (N dist point) as it goes along
    let result: X[] = [];
    // O(n^2) but could be O(nlogn) if i used a binary tree insertion or sorted afterwards
    shuffleMap.forEach((_, item) => {
        result = insertSorted(result, item, (i) => shuffleMap.get(i));
    });
    return result;
}

/** Shuffles seats slightly, swapping one by one.
 * @param array to shuffle
 * @param N (set to array.length^2) number of times to run disturbance, recommended N >= array.length
 * @param P (0-1) randomness coefficient affecting likelihood of disturbing seating: 0, completely random, means a 50/50 of swapping each seat, whereas 1, fixed, means a 0% chance of swapping seats
 * @returns array
 */
function disturbSeats<X>(array: X[], N?: number, P = 0): X[] {
    if (N === undefined) {
        N = array.length * array.length;
    }
    let temp: X;
    for (let _ = 0; _ < N; _++) {
        // start at second element, swapping with the previous element
        let swapN = 0;
        for (let index = 1; index < array.length; index += 2) {
            // 1 isn't random, 0.5 is random, 0 isn't random (swapping every single time introduces no randomness)
            // so distribute P (0-1) within 0.5-1.0
            if (Math.random() > 0.5 + P / 2) {
                swapN++;
                temp = array[index];
                array[index] = array[index - 1];
                array[index - 1] = temp;
            }
        }
        console.log(swapN / array.length);
    }
    return array;
}

/** Used to randomise the player seatings. Does not affect council members.
 * @param array - shuffled in place (and returned)
 */
function randomizeSeats(array: (MemberId | 0)[]) {
    // return shuffleArray(array);
    // sort the array by points
    array.sort((a, b) => {
        let memberA = getMember(a);
        let memberB = getMember(b);
        // check if either seat is empty, if so just say they're equal?
        if (!(isMember(memberA) && isMember(memberB))) return 0;
        let pts = (m: Member) =>
            m.tournament.session_points + m.tournament.total_points;
        // B - A reverses it
        return pts(memberB) - pts(memberA);
    });
    // partially randomise the seats
    return window.MJSeating.shuffle(array);
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
    flatTables = randomizeSeats(flatTables);
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

function test(f: (array: Array<any>) => Array<any>, N = 10000, l = 20) {
    let array = Array.from(Array(l).keys());
    let elementCount: Map<any, number>;
    let indexMap: Map<number, typeof elementCount> = new Map();
    for (let _ = 0; _ <= N; _++) {
        f(array).forEach((v, index) => {
            elementCount = indexMap.get(index) || new Map();
            elementCount.set(v, (elementCount.get(v) || 0) + 1);
            indexMap.set(index, elementCount);
        });
    }
    let results: [any, number][];
    indexMap.forEach((ec, index) => {
        console.log(`Position ${index}`);
        results = [];
        ec.forEach((count, i) => {
            results.push([i, (count / N) * 100]);
        });
        results.sort((a, b) => a[0] - b[0]);
        results.forEach(([a, b]) => {
            console.log(a, "|".repeat(b));
        });
    });
}

window.MJSeating = {
    test,
    weightedNormalShuffle,
    shuffle: (a) => weightedNormalShuffle(a, a.length),
};
