// https://github.com/microsoft/TypeScript/issues/28357#issuecomment-748550734
interface CustomEventMap {
    mjPointTransfer: CustomEvent<PointTransfer>;
}
declare global {
    interface GlobalEventHandlersEventMap extends CustomEventMap {}
}
export {};
