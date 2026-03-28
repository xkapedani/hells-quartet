import * as Tone from "tone";

export function PlayTrio() {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n");
}

export async function PlayFromFile(musicName) {
    await Tone.start();
    const publicUrl = process.env.PUBLIC_URL || "";
    const url = `${publicUrl}/music/${musicName}`;

    const player = new Tone.Player(url).toDestination();

    await Tone.loaded();

    player.start();

    player.onstop = () => {
        player.dispose();
    };
}
