declare module "canvas-confetti";

type Wind = "east" | "south" | "west" | "north";
type RoundWind = Wind;
type SeatWind = Wind;
type PlayerWinds = { [key in SeatWind]: Member["id"] | 0 };

type TableNo = number & { __brand: "tableNo" };

interface TableData extends PlayerWinds {
    table_no: TableNo;
    round_wind: RoundWind;
}

type MemberId = number & { __brand: "memberId" };

interface TournamentData {
    total_points: number;
    session_points: number;
    registered: boolean;
}

interface Member {
    id: MemberId;
    name: string;
    tournament: TournamentData;
}

interface PointTransfer {
    to: MemberId;
    from: MemberId[];
    // x points will be taken from n players in 'from', and x*n awarded to 'to'
    points: number;
}

interface MahjongData {
    week: {};
    tables: TableData[];
    members: Member[];
    log: PointTransfer[];
}