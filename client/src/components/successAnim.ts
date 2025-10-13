import Component from '.';
import confetti from 'canvas-confetti';

const mahjongConfetti = {
    shapes: [confetti.shapeFromText({ text: '🀄', scalar: 4 })],
    scalar: 3,
};
const goldConfetti = { colors: ['#ffd700'], scalar: 1 };

export function triggerCelebration() {
    var end = Date.now() + 1 * 1000;
    let defaultSettings = {
        particleCount: 3,
        spread: 100,
        startVelocity: 90,
    };
    (function frame() {
        confetti({
            angle: 75,
            origin: { x: 0, y: 1 },
            ...defaultSettings,
            ...goldConfetti,
        });
        confetti({
            angle: 75,
            origin: { x: 0, y: 1 },
            ...defaultSettings,
            ...mahjongConfetti,
        });
        confetti({
            angle: 105,
            origin: { x: 1, y: 1 },
            ...defaultSettings,
            ...goldConfetti,
        });
        confetti({
            angle: 105,
            origin: { x: 1, y: 1 },
            ...defaultSettings,
            ...mahjongConfetti,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

interface PointBounceOptions {
    autoPosition?: boolean;
    wind?: Wind;
    heightOffset?: number;
    msDuration?: number;
}

/**
 *
 * @param elem_or_comp
 * @param points
 * @param {boolean} options.autoPosition [true] temporarily sets the parent's position to 'relative' so that the animated child can be 'absolute'
 * @param {Wind} options.wind ['east'] the seat wind for rotation purposes
 * @param {number} options.heightOffset [110] the percentage of the parent's blockSize (height) to shift this up (inwards) by
 */
export function pointBounce<K extends keyof HTMLElementTagNameMap>(
    elem_or_comp: HTMLElement | Component<K>,
    points: number,
    {
        autoPosition = true,
        wind = 'east',
        heightOffset = 110,
        msDuration = 1000,
    }: PointBounceOptions,
) {
    let orientation;
    switch (wind) {
        case 'east':
            orientation = 0;
            break;
        case 'south':
            orientation = -90;
            break;
        case 'west':
            orientation = 180;
            break;
        case 'north':
            orientation = 90;
            break;
    }
    let elem = elem_or_comp instanceof HTMLElement ? elem_or_comp : elem_or_comp.element;

    // animation is positioned relative to nearest parent with `position: relative;`
    let oldPosition = elem.style.position;
    if (autoPosition) elem.style.position = 'relative';

    let pointPopup = new Component({
        tag: 'p',
        textContent: points.toString(),
        parent: elem,
        classList: ['points'],
    });
    pointPopup.element.style.color = points > 0 ? 'green' : 'red';

    // this part is pretty horrible, and will break easily.
    pointPopup.element.style.rotate = `${orientation}deg`;
    if (orientation === 0) {
        pointPopup.element.style.top = `-${heightOffset}%`;
    } else if (orientation === 90) {
        pointPopup.element.style.right = `-${heightOffset}%`;
        pointPopup.element.style.top = `${Math.floor(elem.clientHeight / 4)}px`;
    } else if (orientation === -90) {
        pointPopup.element.style.left = `-${heightOffset}%`;
        pointPopup.element.style.bottom = `${Math.floor(elem.clientHeight / 4)}px`;
    } else {
        pointPopup.element.style.top = `${heightOffset}%`;
    }

    pointPopup.element.style.animation = `bounce ${msDuration / 1000}s ease-in-out 1 forwards`;
    // after the animation, reset
    window.setTimeout(() => {
        pointPopup.element.remove();
        elem.style.position = oldPosition;
    }, msDuration);
}
