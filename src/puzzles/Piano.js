import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import "./Piano.css";

const PUBLIC = process.env.PUBLIC_URL || "";

const NOTES = [
    // note name, label, staff index (0 = bottom line, increasing upward)
    { name: "C4", label: "C4", idx: 0 },
    { name: "D4", label: "D4", idx: 1 },
    { name: "E4", label: "E4", idx: 2 },
    { name: "F4", label: "F4", idx: 3 },
    { name: "G4", label: "G4", idx: 4 },
    { name: "A4", label: "A4", idx: 5 },
    { name: "B4", label: "B4", idx: 6 },
    { name: "C5", label: "C5", idx: 7 },
];

function randomNote() {
    return NOTES[Math.floor(Math.random() * NOTES.length)];
}

export default function Piano() {
    const [target, setTarget] = useState(() => randomNote());
    const [droppedCorrect, setDroppedCorrect] = useState(false);
    const synthRef = useRef(null);
    const toneStartedRef = useRef(false);

    useEffect(() => {
        const s = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
        }).toDestination();
        s.volume.value = -6;
        synthRef.current = s;
        return () => s.dispose();
    }, []);

    const ensureTone = useCallback(async () => {
        if (!toneStartedRef.current) {
            await Tone.start();
            toneStartedRef.current = true;
        }
    }, []);

    const handleImageClick = useCallback(
        async (e) => {
            await ensureTone();
            if (!synthRef.current) return;
            // play the target note and reveal draggable note
            try {
                synthRef.current.triggerAttackRelease(target.name, "1n");
            } catch (err) {}
            setDroppedCorrect(false);
        },
        [ensureTone, target],
    );

    const onDragStart = (e) => {
        e.dataTransfer.setData("text/plain", target.name);
        // small visual drag image
        const crt = document.createElement("div");
        crt.className = "drag-note-dragghost";
        crt.textContent = target.label;
        document.body.appendChild(crt);
        e.dataTransfer.setDragImage(crt, 20, 20);
        setTimeout(() => document.body.removeChild(crt), 0);
    };

    const handleZoneEnter = async (noteName) => {
        await ensureTone();
        if (!synthRef.current) return;
        try {
            synthRef.current.triggerAttackRelease(noteName, "8n");
        } catch (err) {}
    };

    const handleDrop = (e, zoneNote) => {
        e.preventDefault();
        const dragged = e.dataTransfer.getData("text/plain");
        if (dragged === zoneNote) {
            setDroppedCorrect(true);
        } else {
            setDroppedCorrect(false);
        }
        // generate next target after small delay if correct
        if (dragged === zoneNote) {
            setTimeout(() => setTarget(randomNote()), 800);
        }
    };

    return (
        <div className="piano-grid" style={{ backgroundImage: `url(${PUBLIC}/images/scene.png)` }}>
            <div className="piano-left">
                <h1 className="piano-title">Retrouve la note</h1>
                <img
                    src={`${PUBLIC}/images/mille_pattes_fache.png`}
                    alt="piano"
                    className="piano-image"
                    onClick={handleImageClick}
                    role="button"
                    draggable={false}
                />
            </div>

            <div className="piano-right">
                <div className="piano-instruction">Glisse la note sur la bonne place du portee</div>

                <div className="note-pick-area">
                    <div
                        className="draggable-note"
                        draggable
                        onDragStart={onDragStart}
                        onClick={(e) => e.preventDefault()}
                    >
                        {target.label}
                    </div>
                    {droppedCorrect && <div className="note-correct">✓ Bon</div>}
                </div>

                <div className="staff">
                    {/* render zones for NOTES vertical positions */}
                    {NOTES.map((n) => (
                        <div
                            key={n.name}
                            className={"staff-zone" + (droppedCorrect && n.name === target.name ? " staff-zone--correct" : "")}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, n.name)}
                            onDragEnter={() => handleZoneEnter(n.name)}
                        >
                            <div className="staff-line" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
