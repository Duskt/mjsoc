type PointTransferEvent = CustomEvent<Log>;
type RegisterEvent = CustomEvent<MemberId>;

type AddMemberEvent = CustomEvent<Member>

type EditMemberEvent = CustomEvent<{
    id: MemberId
    new_member: Member | {}
}>;