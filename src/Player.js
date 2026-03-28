import * as Tone from "tone";

export function PlayTrio() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n");
}

export async function PlayFromFile(musicName) {
    // Ensure the audio context is started (required by browsers)
    await Tone.start();

    // Construct the correct URL for the public directory
    const publicUrl = process.env.PUBLIC_URL || "";
    const url = `${publicUrl}/music/${musicName}`;

    // Initialize the Tone.js Player and connect to speakers
    const player = new Tone.Player(url).toDestination();

    // Wait for the buffer to decode and load completely
    await Tone.loaded();

    // Start playing
    player.start();

    // Dispose of the player once it finishes to free memory
    player.onstop = () => {
        player.dispose();
    };
}
