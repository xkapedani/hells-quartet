const PUBLIC = process.env.PUBLIC_URL || "";

let currentAudio = null;
let seqTimers = [];

/**
 * Fire-and-forget: plays /public/audio/drum_note.mp3
 */
export function PlayTrio() {
    const a = new Audio(`${PUBLIC}/audio/drum_note.mp3`);
    a.play().catch(() => {});
}

/**
 * Play any file from /public/audio/ by name.
 * Returns the Audio element in case the caller wants to stop it.
 * @param {string} musicName - e.g. "gnomes-Bass.mp3"
 */
export async function PlayFromFile(musicName) {
    const a = new Audio(`${PUBLIC}/audio/${musicName}`);
    try {
        await a.play();
    } catch (e) {}
    return a;
}

/**
 * Play a file from /public/audio/ by name.
 * Stops whatever is currently playing first.
 * @param {string} filename - e.g. "cerbere-game/cerbere-game-Bb_Trumpet.mp3"
 * @param {function} [onEnd] - optional callback when the audio ends
 */
export function playFile(filename, onEnd) {
    stopCurrent();
    const audio = new Audio(`${PUBLIC}/audio/${filename}`);
    currentAudio = audio;
    audio.play().catch(() => {});
    if (onEnd) {
        audio.addEventListener("ended", onEnd, { once: true });
    }
    return audio;
}

/**
 * Stop whatever is currently playing.
 */
export function stopCurrent() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

/**
 * Play an ordered list of files with a delay between each.
 * @param {string[]} filenames - files in /public/audio/
 * @param {number} [delayMs=1600] - gap between files in ms
 * @param {function} [onEnd] - called after the last file ends
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
 * Cancel a running sequence and stop current audio.
 */
export function cancelSequence() {
    seqTimers.forEach(clearTimeout);
    seqTimers = [];
    stopCurrent();
}
