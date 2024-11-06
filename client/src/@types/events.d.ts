type PointTransferEvent = CustomEvent<Log>;
type RegisterEvent = CustomEvent<MemberId>;

type AddTableEvent = CustomEvent<TableData>;
type AddMemberEvent = CustomEvent<Member>;

type EditMemberEvent = CustomEvent<{
    id: MemberId;
    new_member: Member | {};
}>;
type EditLogEvent = CustomEvent<{
    id: Log["id"];
    newLog: Log;
}>;
type EditTableEvent = CustomEvent<{
    tableNo: TableNo;
    newTable: TableData;
}>;
