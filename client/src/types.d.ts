type Wind = "east" | "south" | "west" | "north";
type RoundWind = Wind;
type SeatWind = Wind;
type PlayerWinds = { [key in SeatWind]: string }

interface TableData extends PlayerWinds {
    table_no: number,
    round_wind: RoundWind,
}

interface MahjongData {
    week: {}
    tables: [TableData]
}