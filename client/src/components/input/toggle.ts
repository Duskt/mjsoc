import Component, { ComponentParameters } from '..';

export interface ToggleComponentParameters<K extends keyof HTMLElementTagNameMap>
    extends ComponentParameters<K> {
    mode: 'block';
}

export default class ToggleComponent<K extends keyof HTMLElementTagNameMap> extends Component<K> {
    hidden: boolean;
    mode: ToggleComponentParameters<K>['mode'];
    children: HTMLCollection;
    constructor(params: ToggleComponentParameters<K>) {
        super(params);
        this.hidden = false;
        this.mode = params.mode;
        this.children = document.createDocumentFragment().children;
    }

    show() {
        this.hidden = false;
        for (let item of Array.from(this.children)) {
            this.element.appendChild(item);
        }
        this.element.style['display'] = this.mode;
    }

    hide() {
        this.hidden = true;
        this.children = this.element.children;
        while (this.element.lastChild) {
            this.element.removeChild(this.element.lastChild);
        }
        this.element.style['display'] = 'none';
    }

    toggle() {
        if (this.hidden) {
            this.show();
        } else {
            this.hide();
        }
    }
}
