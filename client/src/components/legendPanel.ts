import Component, { Params } from '.';
import { getSessionWind } from '../data';
import { DropdownButton } from './input/focus/dropdown';

interface LegendParams extends Params<'div'> {}

export default class Legend extends Component<'div'> {
    roundWind: RoundWind;
    keyUl: Component<'ul'>;
    keyLis: Component<'li'>[];
    constructor(params: LegendParams) {
        if (params.classList === undefined) params.classList = [];
        params.classList = params.classList.concat(['legend-panel']);
        super({
            tag: 'div',
            ...params,
        });
        this.roundWind = new RoundWind({
            wind: getSessionWind(),
            parent: this.element,
        });
        this.keyUl = new Component({
            tag: 'ul',
            parent: this.element,
        });
        this.keyLis = [
            new Component({
                tag: 'li',
                parent: this.keyUl.element,
                textContent: '食: Win',
            }),
            new Component({
                tag: 'li',
                parent: this.keyUl.element,
                textContent: '自摸: Self-draw',
            }),
            new Component({
                tag: 'li',
                parent: this.keyUl.element,
                textContent: '打出: Direct hit',
            }),
        ];
        makeDraggable(this.element);
    }
}

const WindCharacters: Map<Wind, string> = new Map();
WindCharacters.set('east', '東');
WindCharacters.set('south', '南');
WindCharacters.set('west', '西');
WindCharacters.set('north', '北');

interface RoundWindParams extends Params<'p'> {
    wind: Wind;
}

class RoundWind extends Component<'p'> {
    wind: Wind;
    ddb: DropdownButton<'div', 'button'>;
    ddbSpan: Component<'span'>;
    br: HTMLBRElement;
    lock: boolean;
    windCaption: Component<'span'>;
    constructor({ wind = 'east', ...params }: RoundWindParams) {
        super({
            tag: 'p',
            ...params,
        });
        this.lock = false;
        this.wind = wind;
        this.ddb = new DropdownButton({
            dropdownTag: 'div',
            parent: this.element,
            options: (['east', 'south', 'west', 'north'] as Wind[]).map(
                (w) =>
                    new Component<'button'>({
                        tag: 'button',
                        textContent: WindCharacters.get(w) || 'ERR',
                        other: {
                            onclick: (ev) => {
                                this.setWind(w);
                                this.ddb.deactivate();
                            },
                        },
                    }).element,
            ),
        });
        this.ddbSpan = new Component({
            tag: 'span',
            textContent: WindCharacters.get(wind),
            parent: this.ddb.element,
            classList: ['round-wind-span'],
            other: {
                onclick: (ev) => this.ddb.activate(),
            },
        });
        this.br = document.createElement('br');
        this.element.appendChild(this.br);
        this.windCaption = new Component({
            tag: 'span',
            textContent: `(${wind})`,
            parent: this.element,
        });
    }
    setWind(wind: Wind) {
        this.wind = wind;
        window.sessionStorage.setItem('round', wind);
        this.ddbSpan.element.textContent = WindCharacters.get(wind) || 'ERR';
        this.windCaption.element.textContent = `(${wind})`;
    }
    updateWind() {
        if (this.lock === true) return;
        switch (this.wind) {
            case 'east':
                this.setWind('south');
                return;
            case 'south':
                this.setWind('west');
                return;
            case 'west':
                this.setWind('north');
                return;
            case 'north':
                this.setWind('east');
                return;
        }
    }
}

// lifted from https://www.w3schools.com/howto/howto_js_draggable.asp
function makeDraggable(elmnt: HTMLElement) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent) {
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
        elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
