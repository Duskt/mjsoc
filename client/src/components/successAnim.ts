import Component from ".";
import confetti from "canvas-confetti";

const mahjongConfetti = {
    shapes: [confetti.shapeFromText({ text: "🀄", scalar: 4 })],
    scalar: 3,
};
const goldConfetti = { colors: ["#ffd700"], scalar: 1 };

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