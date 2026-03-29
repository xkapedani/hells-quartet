import * as Tone from "tone";

const PUBLIC = process.env.PUBLIC_URL || "";

let currentPlayer = null;
let seqTimers = [];

/**
 * Fire-and-forget
 */
export async function PlayTrio() {
    const player = new Tone.Player(`${PUBLIC}/audio/drum_note.mp3`).toDestination();
    await Tone.start();
    player.start();
}

/**
 * Play any file
 */
export async function PlayFromFile(musicName) {
    stopCurrent();

    await Tone.start();

    const player = new Tone.Player({
        url: `${PUBLIC}/audio/${musicName}`,
        autostart: true
    }).toDestination();

    currentPlayer = player;

    return player;
}

/**
 * Play file with optional callback
 */
export async function playFile(filename, onEnd) {
    stopCurrent();

    await Tone.start();

    const player = new Tone.Player({
        url: `${PUBLIC}/audio/${filename}`,
        autostart: true
    }).toDestination();

    currentPlayer = player;

    if (onEnd) {
        player.onstop = onEnd;
    }

    return player;
}

/**
 * Stop current
 */
export function stopCurrent() {
    if (currentPlayer) {
        currentPlayer.stop();
        currentPlayer.dispose(); // 🔥 important
        currentPlayer = null;
    }
}

/**
 * Sequence
 */
export function playSequence(filenames, delayMs = 1600, onEnd) {
    cancelSequence();

    filenames.forEach((filename, i) => {
        const isLast = i === filenames.length - 1;

        const t = setTimeout(() => {
            playFile(filename, isLast && onEnd ? onEnd : undefined);
        }, i * delayMs);

        seqTimers.push(t);
    });
}

/**
 * Cancel sequence
 */
export function cancelSequence() {
    seqTimers.forEach(clearTimeout);
    seqTimers = [];
    stopCurrent();
}