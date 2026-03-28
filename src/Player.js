// Lightweight audio player using HTMLAudioElement to avoid Tone.js compatibility issues.
export function PlayTrio() {
    const publicUrl = process.env.PUBLIC_URL || "";
    const url = `${publicUrl}/audio/drum_note.mp3`;
    const a = new Audio(url);
    // fire-and-forget
    a.play().catch(() => {});
}

export async function PlayFromFile(musicName) {
    const publicUrl = process.env.PUBLIC_URL || "";
    const url = `${publicUrl}/audio/${musicName}`;
    const a = new Audio(url);
    try {
        await a.play();
    } catch (e) {
        // play may fail if not initiated by user gesture; ignore silently
    }
    // return a reference if caller wants to stop later
    return a;
}
