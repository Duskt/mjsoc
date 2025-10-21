type PointTransferEvent = CustomEvent<Log>;
type RegisterEvent = CustomEvent<MemberId>;

type AddTableEvent = CustomEvent<TableData>;
type AddMemberEvent = CustomEvent<Member>;

type EditMemberEvent = CustomEvent<{
    id: MemberId;
    new_member: Member | {};
}>;
type UndoLogEvent = CustomEvent<Log['id']>;
type EditLogEvent = CustomEvent<{
    id: Log['id'];
    newLog: Log;
}>;
type EditTableEvent = CustomEvent<
    {
        tableNo: TableNo;
        newTable: TableData | null;
    }[]
>;

type SettingsUpdateEvent = CustomEvent<{}>;
