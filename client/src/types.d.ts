type Wind = "east" | "south" | "west" | "north";
type RoundWind = Wind;
type SeatWind = Wind;
type PlayerWinds = { [key in SeatWind]: Member['id'] | 0 }

type TableNo = number & {__brand: "tableNo"};

interface TableData extends PlayerWinds {
    table_no: TableNo,
    round_wind: RoundWind,
}

type MemberId = number & {__brand: "memberId"};

interface Member {
    id: MemberId,
    name: string,
    points: number,
}

interface MahjongData {
    week: {}
    tables: [TableData]
    members: [Member]
}