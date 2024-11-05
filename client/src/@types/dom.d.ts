// https://github.com/microsoft/TypeScript/issues/28357#issuecomment-748550734
interface CustomEventMap {
    mjPointTransfer: PointTransferEvent;
    mjRegister: RegisterEvent;
    mjAddMember: AddMemberEvent;
    mjEditMember: EditMemberEvent;
    mjEditLog: EditLogEvent;
    mjAddTable: AddTableEvent;
}
declare global {
    interface GlobalEventHandlersEventMap extends CustomEventMap {}
}
export {};
