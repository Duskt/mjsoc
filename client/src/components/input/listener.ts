import Component, { ComponentParameters } from "..";

export interface ListenerParameters<
    E extends keyof HTMLElementEventMap,
    T extends keyof HTMLElementTagNameMap
> extends ComponentParameters<T> {
    event: E;
    initListener?: boolean;
}
// The purpose of this is to have a listener function that can be updated as necessary
export default abstract class Listener<
    E extends keyof HTMLElementEventMap,
    T extends keyof HTMLElementTagNameMap
> extends Component<T> {
    event: E;
    protected lastListener?: EventListener;
    constructor({ initListener = true, ...params }: ListenerParameters<E, T>) {
        super(params);
        this.event = params.event;
        if (initListener) {
            this.listener = this.generateListener();
        }
    }
    public get listener() {
        return this.lastListener;
    }
    public set listener(v) {
        if (this.listener) {
            this.element.removeEventListener(this.event, this.listener);
        }
        if (!v) return;
        this.element.addEventListener(this.event, v);
        this.lastListener = v;
    }
    abstract generateListener(): EventListener;
}

export interface ClickListenerParameters<T extends keyof HTMLElementTagNameMap>
    extends Omit<ListenerParameters<"click", T>, "event"> {}

export abstract class ClickListener<
    T extends keyof HTMLElementTagNameMap
> extends Listener<"click", T> {
    constructor(params: InputListenerParameters<T>) {
        super({
            ...params,
            event: "click",
        });
    }
}

export interface InputListenerParameters<T extends keyof HTMLElementTagNameMap>
    extends Omit<ListenerParameters<"input", T>, "event"> {}

export abstract class InputListener<
    T extends keyof HTMLElementTagNameMap
> extends Listener<"input", T> {
    constructor(params: InputListenerParameters<T>) {
        super({
            ...params,
            event: "input",
        });
    }
}
