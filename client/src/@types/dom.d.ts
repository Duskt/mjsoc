// https://github.com/microsoft/TypeScript/issues/28357#issuecomment-748550734
interface CustomEventMap {
    mjPointTransfer: PointTransferEvent;
    mjRegister: RegisterEvent;
    mjAddMember: AddMemberEvent;
    mjEditMember: EditMemberEvent;
    mjUndoLog: UndoLogEvent;
    mjEditLog: EditLogEvent;
    mjAddTable: AddTableEvent;
    mjEditTable: EditTableEvent;
}
interface Seating {
    shuffle: (array: Array<any>) => Array<any>;
    weightedNormalShuffle: any;
    test: (f: (array: Array<any>) => Array<any>, N: number, l: number) => void;
}
declare global {
    interface GlobalEventHandlersEventMap extends CustomEventMap {}
    interface Window {
        MJDATA: MahjongData;
        MJSeating: Seating;
        _request: any;
    }
}
export {};
