import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";
import "./Bass.css";
import DialogBox from "../components/DialogBox";
import Particles from "./Particles";

const PUBLIC = process.env.PUBLIC_URL || "";

/* ═══════════════════════════════════════════════════════════════════════════
   String / note definitions – spread across 3 octaves so they sound
   obviously different
 from one another.
   ═══════════════════════════════════════════════════════════════════════════ */

const STRINGS = [
    { id: 0, label: "Do", targetHz: 65.41, color: "#e25555" },
    { id: 1, label: "La", targetHz: 220.0, color: "#e2a155" },
    { id: 2, label: "Mi", targetHz: 329.63, color: "#55b8e2" },
    { id: 3, label: "Do", targetHz: 523.25, color: "#7ce255" },
];

/* ── Tuning constants ──────────────────────────────────────────────────────── */

const RANGE_HZ = 35; // slider covers [target-35 … target+35]
const TUNE_TOLERANCE_HZ = 3; // must land within 3 Hz to count as tuned
const MIN_OFFSET = 18; // start at least this far from target
const MAX_OFFSET = RANGE_HZ - 2;

function randomStartHz(targetHz) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const offset = MIN_OFFSET + Math.random() * (MAX_OFFSET - MIN_OFFSET);
    return targetHz + sign * offset;
}

function sliderMin(targetHz) {
    return targetHz - RANGE_HZ;
}
function sliderMax(targetHz) {
    return targetHz + RANGE_HZ;
}

/* ── SVG wave helpers ──────────────────────────────────────────────────────── */

function hzToVisualFreq(hz, targetHz) {
    const t = (hz - sliderMin(targetHz)) / (RANGE_HZ * 2);
    return 1.2 + t * 4.0;
}

function wavePath(width, height, freqFactor, amplitude) {
    let d = `M 0 ${height / 2}`;
    for (let x = 0; x <= width; x += 2) {
        const y =
            height / 2 +
            Math.sin((x / width) * freqFactor * Math.PI * 2) * amplitude;
        d += ` L ${x} ${y.toFixed(1)}`;
    }
    return d;
}

/* ── Colour helpers ────────────────────────────────────────────────────────── */

function hexToRgb(hex) {
    const m = hex.replace("#", "").match(/.{2}/g);
    return m ? m.map((c) => parseInt(c, 16)) : [0, 0, 0];
}

function rgbToHex(r, g, b) {
    return (
        "#" +
        [r, g, b]
            .map((c) =>
                Math.max(0, Math.min(255, Math.round(c)))
                    .toString(16)
                    .padStart(2, "0"),
            )
            .join("")
    );
}

function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BassString – one string row
   ═══════════════════════════════════════════════════════════════════════════ */

function BassString({
    stringDef,
    playerHz,
    onChangeHz,
    isTuned,
    isActive,
    onSelect,
    onPlayReference,
    onPlayOwn,
    onDragStart,
    onDragEnd,
}) {
    const { label, targetHz, color } = stringDef;

    const W = 480;
    const H = 64;
    const amplitude = isActive ? 18 : 10;

    const targetVisFreq = hzToVisualFreq(targetHz, targetHz);
    const playerVisFreq = hzToVisualFreq(playerHz, targetHz);
    const targetPath = wavePath(W, H, targetVisFreq, amplitude * 0.85);
    const playerPath = wavePath(W, H, playerVisFreq, amplitude);

    /* Subtle colour shift only within 3× tolerance */
    const diff = Math.abs(playerHz - targetHz);
    let strokeColor = color;
    if (isTuned) {
        strokeColor = "#4caf50";
    } else if (diff < TUNE_TOLERANCE_HZ * 3) {
        const t = 1 - diff / (TUNE_TOLERANCE_HZ * 3);
        strokeColor = lerpColor(color, "#4caf50", t * 0.5);
    }

    const min = sliderMin(targetHz);
    const max = sliderMax(targetHz);
    const progress = ((playerHz - min) / (max - min)) * 100;

    return (
        <div
            className={
                "bass-string" +
                (isActive ? " bass-string--active" : "") +
                (isTuned ? " bass-string--tuned" : "")
            }
            onClick={onSelect}
        >
            {/* Note label */}
            <div className="bass-string-label" style={{ color: strokeColor }}>
                {label}
            </div>

            {/* Wave SVG */}
            <svg
                className="bass-string-svg"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
            >
                {isTuned && (
                    <path
                        d={targetPath}
                        stroke="#4caf50"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        fill="none"
                        opacity={0.7}
                    />
                )}
                <path
                    d={playerPath}
                    stroke={strokeColor}
                    strokeWidth={isTuned ? 3.5 : 2.5}
                    fill="none"
                    opacity={isActive ? 1 : 0.55}
                />
            </svg>

            {/* Controls */}
            {isActive && !isTuned && (
                <div className="bass-string-controls">
                    <button
                        className="bass-diapason-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayReference();
                        }}
                        title="Écouter la note cible"
                    >
                        🎵 Référence
                    </button>

                    <button
                        className="bass-diapason-btn bass-diapason-btn--own"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayOwn();
                        }}
                        title="Écouter votre note actuelle"
                    >
                        🔊 Ma note
                    </button>

                    <div className="bass-slider-wrap">
                        <span className="bass-slider-label-lo">Grave</span>
                        <input
                            type="range"
                            className="bass-slider"
                            min={min}
                            max={max}
                            value={playerHz}
                            onChange={(e) =>
                                onChangeHz(parseFloat(e.target.value))
                            }
                            onMouseDown={onDragStart}
                            onMouseUp={(e) =>
                                onDragEnd(parseFloat(e.target.value))
                            }
                            onTouchStart={onDragStart}
                            onTouchEnd={(e) =>
                                onDragEnd(
                                    e.changedTouches[0]
                                        ? parseFloat(e.target.value)
                                        : playerHz,
                                )
                            }
                            style={{
                                "--slider-color": strokeColor,
                                "--slider-progress": `${progress}%`,
                            }}
                        />
                        <span className="bass-slider-label-hi">Aigu</span>
                    </div>
                </div>
            )}

            {isTuned && <div className="bass-tuned-badge">✓ Accordé !</div>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Bass() {
    const publicPath = PUBLIC;

    /* ── Game state ──────────────────────────────────────────────────────── */
    const [playerHzArr, setPlayerHzArr] = useState(() =>
        STRINGS.map((s) => randomStartHz(s.targetHz)),
    );
    const [tunedArr, setTunedArr] = useState(() => STRINGS.map(() => false));
    const [activeIdx, setActiveIdx] = useState(0);
    const [allTuned, setAllTuned] = useState(false);
    const [gnomesHappy, setGnomesHappy] = useState(false);

    /* ── Dialog state ────────────────────────────────────────────────────── */
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [dialogAvatar, setDialogAvatar] = useState(null);

    /* ── Refs ────────────────────────────────────────────────────────────── */
    const containerRef = useRef(null);
    const gnomesRef = useRef(null);
    const particlesRef = useRef(null);
    const playerSynthRef = useRef(null);
    const refSynthRef = useRef(null);
    const toneStartedRef = useRef(false);
    const isDraggingRef = useRef(false);

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    function showDialog(msg, opts = {}) {
        setDialogMessage(msg);
        setDialogAvatar(opts.avatar || null);
        setDialogVisible(true);
    }

    function getRelativeCenter(ref) {
        const container = containerRef.current;
        const el = ref && ref.current;
        if (!container || !el) return { x: 0, y: 0 };
        const crect = container.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left - crect.left + rect.width / 2,
            y: rect.top - crect.top + rect.height / 2,
        };
    }

    /* ── get from localStorage ───────────────────────────────────────────────────── */
    
    useEffect(() => {
        // set initial pattern from first example, or restore completion from localStorage
        try {
            const done = localStorage.getItem("puzzle-bass-completed");
            if (done === "1") {
                setGnomesHappy(true);
                setTunedArr(STRINGS.map(() => true));
                setPlayerHzArr(STRINGS.map((s) => s.targetHz));
            } else {
            }
        } catch (e) {
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Tone.js setup ───────────────────────────────────────────────────── */

    useEffect(() => {
        const playerSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 },
        }).toDestination();
        playerSynth.volume.value = -4;

        const refSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.9, release: 1.5 },
        }).toDestination();
        refSynth.volume.value = -4;

        playerSynthRef.current = playerSynth;
        refSynthRef.current = refSynth;

        return () => {
            playerSynth.dispose();
            refSynth.dispose();
        };
    }, []);

    const ensureTone = useCallback(async () => {
        if (!toneStartedRef.current) {
            await Tone.start();
            toneStartedRef.current = true;
        }
    }, []);

    /* ── Intro dialog ────────────────────────────────────────────────────── */

    useEffect(() => {
        const avatar = `${publicPath}/images/gnomes_faches.png`;
        showDialog(
            "Nos cordes sont toutes désaccordées ! Aide-nous à retrouver les bonnes notes.",
            { avatar },
        );
        const target = containerRef.current || document;
        const hide = () => setDialogVisible(false);
        target.addEventListener("pointerdown", hide, { once: true });
        return () => target.removeEventListener("pointerdown", hide);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Success dialog ──────────────────────────────────────────────────── */

    useEffect(() => {
        if (!gnomesHappy) return;
        const avatar = `${publicPath}/images/gnomes_heureux.png`;
        showDialog(
            "Magnifique ! Toutes les cordes sont accordées, on peut jouer !",
            { avatar },
        );
        /* burst particles from gnomes */
        const pos = getRelativeCenter(gnomesRef);
        if (particlesRef.current) {
            particlesRef.current.spawnBurst(pos.x, pos.y, 12, {
                radius: 120,
                size: 80,
                lifetime: 1400,
            });
        }
        const target = containerRef.current || document;
        const hide = () => setDialogVisible(false);
        target.addEventListener("pointerdown", hide, { once: true });
        return () => target.removeEventListener("pointerdown", hide);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gnomesHappy]);

    /* ── Play reference note ─────────────────────────────────────────────── */

    const playReference = useCallback(
        async (stringIdx) => {
            await ensureTone();
            const synth = refSynthRef.current;
            if (!synth) return;
            try {
                synth.triggerRelease();
            } catch (_) {}
            const hz = STRINGS[stringIdx].targetHz;
            setTimeout(() => {
                synth.triggerAttackRelease(hz, "2.5");
            }, 80);
        },
        [ensureTone],
    );

    /* ── Play player's own note (one-shot) ───────────────────────────────── */

    const playOwn = useCallback(
        async (stringIdx, hz) => {
            await ensureTone();
            const synth = playerSynthRef.current;
            if (!synth) return;
            try {
                synth.triggerRelease();
            } catch (_) {}
            setTimeout(() => {
                synth.triggerAttackRelease(hz, "2.5");
            }, 40);
        },
        [ensureTone],
    );

    /* ── Drag start: begin continuous pitch ──────────────────────────────── */

    const handleDragStart = useCallback(
        async (stringIdx, hz) => {
            await ensureTone();
            isDraggingRef.current = true;
            const synth = playerSynthRef.current;
            if (!synth) return;
            try {
                synth.triggerAttack(hz);
            } catch (_) {}
        },
        [ensureTone],
    );

    /* ── Drag end: release tone then validate tuning ─────────────────────── */

    const handleDragEnd = useCallback(
        (stringIdx, finalHz) => {
            isDraggingRef.current = false;
            const synth = playerSynthRef.current;
            if (synth) {
                try {
                    synth.triggerRelease();
                } catch (_) {}
            }

            /* Validate only after the user lets go */
            const target = STRINGS[stringIdx].targetHz;
            if (Math.abs(finalHz - target) >= TUNE_TOLERANCE_HZ) return;

            setTunedArr((prev) => {
                if (prev[stringIdx]) return prev;
                const copy = [...prev];
                copy[stringIdx] = true;

                /* Snap to exact target */
                setPlayerHzArr((hzPrev) => {
                    const hzCopy = [...hzPrev];
                    hzCopy[stringIdx] = target;
                    return hzCopy;
                });

                /* Small particle burst at gnome position */
                const pos = getRelativeCenter(gnomesRef);
                if (particlesRef.current) {
                    particlesRef.current.spawnBurst(pos.x, pos.y, 5, {
                        radius: 60,
                        size: 60,
                        lifetime: 900,
                    });
                }

                if (copy.every(Boolean)) {
                    setAllTuned(true);
                    setGnomesHappy(true);
                    try {
                        localStorage.setItem("puzzle-bass-completed", "1");
                    } catch (_) {}
                } else {
                    const nextIdx = copy.findIndex((v) => !v);
                    if (nextIdx !== -1) {
                        setTimeout(() => setActiveIdx(nextIdx), 600);
                    }
                }
                return copy;
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    /* ── Slider change: update Hz + ramp oscillator only ────────────────── */

    const handleChangeHz = useCallback((stringIdx, newHz) => {
        setPlayerHzArr((prev) => {
            const copy = [...prev];
            copy[stringIdx] = newHz;
            return copy;
        });

        /* Smoothly glide the oscillator to the new pitch while dragging */
        const synth = playerSynthRef.current;
        if (synth && isDraggingRef.current) {
            synth.frequency.rampTo(newHz, 0.05);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleReset = useCallback(() => {
        setAllTuned(false);
        setGnomesHappy(true);
        setTunedArr(STRINGS.map(() => false));
        setPlayerHzArr(STRINGS.map((s) => randomStartHz(s.targetHz)));
        setActiveIdx(0);
        setDialogVisible(false);
    }, []);

    /* ── Reset ───────────────────────────────────────────────────────────── */

    /* ── Render ──────────────────────────────────────────────────────────── */

    return (
        <div className="bass" ref={containerRef}>
            <Particles ref={particlesRef} publicPath={publicPath} />

            <DialogBox
                message={dialogMessage}
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
                autoCloseMs={0}
                avatar={dialogAvatar}
                position="bottom"
            />

            <h1 className="bass-title">Accorde la contrebasse des gnomes</h1>
            <p className="bass-instruction">
                {allTuned
                    ? "Toutes les cordes sont parfaitement accordées ! Les gnomes sont contents !"
                    : "Chaque corde est désaccordée. Écoute la note de référence, puis déplace le curseur jusqu'à trouver la bonne note."}
            </p>
            <div className="bass-actions">
                <button
                    type="button"
                    className="bass-btn bass-btn--main"
                    onClick={handleReset}
                >
                    Réinitialiser
                </button>
            </div>

            {/* Progress dots */}
            <div className="bass-progress">
                {STRINGS.map((s, i) => (
                    <div
                        key={s.id}
                        className={
                            "bass-progress-dot" +
                            (tunedArr[i] ? " bass-progress-dot--tuned" : "") +
                            (activeIdx === i && !tunedArr[i]
                                ? " bass-progress-dot--active"
                                : "")
                        }
                        style={{
                            borderColor: tunedArr[i] ? "#4caf50" : s.color,
                            background: tunedArr[i] ? "#4caf50" : "transparent",
                        }}
                    >
                        {s.label}
                    </div>
                ))}
            </div>

            {/* Main area: gnomes + strings */}
            <div className="bass-main">
                <div className="bass-gnomes-wrap">
                    <img
                        ref={gnomesRef}
                        src={
                            gnomesHappy
                                ? `${publicPath}/images/gnomes_heureux.png`
                                : `${publicPath}/images/gnomes_faches.png`
                        }
                        alt="Les gnomes"
                        className={
                            "bass-gnomes-img" +
                            (gnomesHappy ? " bass-gnomes-img--happy" : "")
                        }
                        draggable={false}
                    />
                </div>

                <div className="bass-strings-panel">
                    {STRINGS.map((s, i) => (
                        <BassString
                            key={s.id}
                            stringDef={s}
                            playerHz={playerHzArr[i]}
                            isTuned={tunedArr[i]}
                            isActive={activeIdx === i}
                            onSelect={() => {
                                if (!tunedArr[i]) setActiveIdx(i);
                            }}
                            onPlayReference={() => playReference(i)}
                            onPlayOwn={() => playOwn(i, playerHzArr[i])}
                            onChangeHz={(hz) => handleChangeHz(i, hz)}
                            onDragStart={() =>
                                handleDragStart(i, playerHzArr[i])
                            }
                            onDragEnd={(hz) => handleDragEnd(i, hz)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
