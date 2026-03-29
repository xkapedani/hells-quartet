import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import "./Piano.css";
import DialogBox from "../components/DialogBox";
import { useNavigate } from "react-router-dom";

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
    const [stars, setStars] = useState(0);
    const synthRef = useRef(null);
    const toneStartedRef = useRef(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [dialogAvatar, setDialogAvatar] = useState(null);
    const [pianoCompleted, setPianoCompleted] = useState(() => {
        try {
            return localStorage.getItem("puzzle-piano-completed") === "1";
        } catch (e) {
            return false;
        }
    });
    const navigate = useNavigate();

    useEffect(() => {
        const s = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
        }).toDestination();
        s.volume.value = -6;
        synthRef.current = s;
        return () => s.dispose();
    }, []);

    function showDialog(msg, opts = {}) {
        setDialogMessage(msg);
        setDialogAvatar(opts.avatar || null);
        setDialogVisible(true);
    }

    useEffect(() => {
        // show intro dialog once on mount
        const avatar = `${PUBLIC}/images/mille_pattes_fache.png`;
        showDialog("Bonjour ! Clique sur Millody pour entendre la note, puis glisse-la sur la portée.", { avatar });
        const target = document;
        const hide = () => setDialogVisible(false);
        try {
            target.addEventListener("pointerdown", hide, { once: true });
        } catch (e) {
            target.addEventListener("pointerdown", hide);
        }
        return () => {
            try {
                target.removeEventListener("pointerdown", hide, { once: true });
            } catch (e) {
                target.removeEventListener("pointerdown", hide);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!pianoCompleted) return;
        // when completed, show end dialog if not already visible (covers reload case)
        const avatar = `${PUBLIC}/images/mille_pattes_heureux.png`;
        showDialog("Magnifique ! Millody est désormais heureuse. Clique pour revenir à l'accueil.", { avatar });
        // on next pointerdown, navigate back to homepage
        const handler = () => {
            setDialogVisible(false);
            try {
                navigate("/hells-quartet");
            } catch (e) {}
        };
        try {
            document.addEventListener("pointerdown", handler, { once: true });
        } catch (e) {
            document.addEventListener("pointerdown", handler);
        }
        return () => {
            try {
                document.removeEventListener("pointerdown", handler, { once: true });
            } catch (e) {
                document.removeEventListener("pointerdown", handler);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pianoCompleted]);

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
            setStars((prev) => {
                if (prev >= 5) return prev;
                const next = prev + 1;
                if (next >= 5) {
                    try {
                        localStorage.setItem("puzzle-piano-completed", "1");
                    } catch (err) {}
                    setPianoCompleted(true);
                    // show end dialog
                    const avatar = `${PUBLIC}/images/mille_pattes_heureux.png`;
                    setDialogAvatar(avatar);
                    setDialogMessage("Bravo ! Millody est heureuse 🎉");
                    setDialogVisible(true);
                }
                return next;
            });
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
            <DialogBox
                message={dialogMessage}
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
                autoCloseMs={0}
                avatar={dialogAvatar}
                position="bottom"
            />
            <div className="piano-left">
                <img
                    src={
                        pianoCompleted
                            ? `${PUBLIC}/images/mille_pattes_heureux.png`
                            : `${PUBLIC}/images/mille_pattes_fache.png`
                    }
                    alt="piano"
                    className="piano-image"
                    onClick={handleImageClick}
                    role="button"
                    draggable={false}
                />
            </div>

            <div className="piano-right">
                <div className="piano-stars" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <img
                            key={i}
                            src={
                                i < stars
                                    ? `${PUBLIC}/images/star-full.png`
                                    : `${PUBLIC}/images/star-empty.png`
                            }
                            alt={i < stars ? `Star ${i + 1} full` : `Star ${i + 1} empty`}
                        />
                    ))}
                </div>
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
