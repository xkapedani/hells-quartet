import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";
import "./Bass.css";

const PUBLIC = process.env.PUBLIC_URL || "";

/* ═══════════════════════════════════════════════════════════════════════════
   String / note definitions
   Real bass open-string pitches.
   ═══════════════════════════════════════════════════════════════════════════ */

const STRINGS = [
    { id: 0, label: "Do", targetHz: 65.41, color: "#e25555" },
    { id: 1, label: "La", targetHz: 220.0, color: "#e2a155" },
    { id: 2, label: "Mi", targetHz: 329.63, color: "#55b8e2" },
    { id: 3, label: "Do", targetHz: 523.25, color: "#7ce255" },
];

/* ── Tuning constants ──────────────────────────────────────────────────────── */

/* Half-width of each string's slider range.
   The slider covers  [target - RANGE_HZ  …  target + RANGE_HZ].
   Narrower range → more physical movement required per Hz → harder to hit
   the tolerance window by accident.                                         */
const RANGE_HZ = 35;

/* Tolerance to count as "accordé".  0.5 Hz over a 70 Hz range means the
   sweet spot is only 0.7 % of the slider's travel — you must be precise.   */
const TUNE_TOLERANCE_HZ = 0.5;

/* ── Start position: always detuned by at least MIN_OFFSET Hz ─────────────── */
const MIN_OFFSET = 18;
const MAX_OFFSET = RANGE_HZ - 2; // stay inside the slider range

function randomStartHz(targetHz) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const offset = MIN_OFFSET + Math.random() * (MAX_OFFSET - MIN_OFFSET);
    return targetHz + sign * offset;
}

/* Per-string slider bounds */
function sliderMin(targetHz) {
    return targetHz - RANGE_HZ;
}
function sliderMax(targetHz) {
    return targetHz + RANGE_HZ;
}

/* ── SVG wave helpers ──────────────────────────────────────────────────────── */

function hzToVisualFreq(hz, targetHz) {
    /* Map the slider range to a visual frequency range of [1.2 … 5.2].
       Compresses the visual difference so the wave doesn't telegraph the
       exact answer, but still changes noticeably as you move the slider.    */
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

/* ── Colour helper: subtle warm blend only very close to target ────────────── */

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
}) {
    const { label, targetHz, color } = stringDef;

    const W = 480;
    const H = 64;
    const amplitude = isActive ? 18 : 10;

    const targetVisFreq = hzToVisualFreq(targetHz, targetHz);
    const playerVisFreq = hzToVisualFreq(playerHz, targetHz);

    const targetPath = wavePath(W, H, targetVisFreq, amplitude * 0.85);
    const playerPath = wavePath(W, H, playerVisFreq, amplitude);

    /* Colour: subtle green tint only inside 3 × tolerance — not obvious      */
    const diff = Math.abs(playerHz - targetHz);
    let strokeColor = color;
    if (isTuned) {
        strokeColor = "#4caf50";
    } else if (diff < TUNE_TOLERANCE_HZ * 3) {
        const t = 1 - diff / (TUNE_TOLERANCE_HZ * 3);
        strokeColor = lerpColor(color, "#4caf50", t * 0.5);
    }

    /* Slider progress % for the CSS fill trick */
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
                {/* Target wave – only shown once tuned */}
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
                {/* Player wave */}
                <path
                    d={playerPath}
                    stroke={strokeColor}
                    strokeWidth={isTuned ? 3.5 : 2.5}
                    fill="none"
                    opacity={isActive ? 1 : 0.55}
                />
            </svg>

            {/* Controls – active & not yet tuned */}
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
                            /* No step → continuous, no lucky snaps */
                            value={playerHz}
                            onChange={(e) =>
                                onChangeHz(parseFloat(e.target.value))
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

    const [playerHzArr, setPlayerHzArr] = useState(() =>
        STRINGS.map((s) => randomStartHz(s.targetHz)),
    );
    const [tunedArr, setTunedArr] = useState(() => STRINGS.map(() => false));
    const [activeIdx, setActiveIdx] = useState(0);
    const [allTuned, setAllTuned] = useState(false);
    const [gnomesHappy, setGnomesHappy] = useState(false);

    /* ── Tone.js synths ──────────────────────────────────────────────────── */
    const playerSynthRef = useRef(null);
    const refSynthRef = useRef(null);
    const toneStartedRef = useRef(false);

    useEffect(() => {
        const playerSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.08, decay: 0.3, sustain: 0.6, release: 0.8 },
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

    /* ── Play reference (target note) — audio only, no visual hint ──────── */
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

    /* ── Play player's own current note ─────────────────────────────────── */
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

    /* ── Handle slider change ────────────────────────────────────────────── */
    const handleChangeHz = useCallback((stringIdx, newHz) => {
        setPlayerHzArr((prev) => {
            const copy = [...prev];
            copy[stringIdx] = newHz;
            return copy;
        });

        const target = STRINGS[stringIdx].targetHz;
        if (Math.abs(newHz - target) < TUNE_TOLERANCE_HZ) {
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

                if (copy.every(Boolean)) {
                    setAllTuned(true);
                    setGnomesHappy(true);
                } else {
                    const nextIdx = copy.findIndex((v) => !v);
                    if (nextIdx !== -1) {
                        setTimeout(() => setActiveIdx(nextIdx), 600);
                    }
                }
                return copy;
            });
        }
    }, []);

    /* ── Reset ───────────────────────────────────────────────────────────── */
    function handleReset() {
        try {
            playerSynthRef.current && playerSynthRef.current.triggerRelease();
        } catch (_) {}
        try {
            refSynthRef.current && refSynthRef.current.triggerRelease();
        } catch (_) {}

        setPlayerHzArr(STRINGS.map((s) => randomStartHz(s.targetHz)));
        setTunedArr(STRINGS.map(() => false));
        setActiveIdx(0);
        setAllTuned(false);
        setGnomesHappy(false);
    }

    const tunedCount = tunedArr.filter(Boolean).length;

    /* ── Render ──────────────────────────────────────────────────────────── */
    return (
        <div className="bass">
            <h1 className="bass-title">Accorde la contrebasse des gnomes</h1>
            <p className="bass-instruction">
                {allTuned
                    ? "Toutes les cordes sont parfaitement accordées ! Les gnomes sont contents !"
                    : "Chaque corde est désaccordée. Écoute la note de référence, puis déplace le curseur jusqu'à trouver la bonne note."}
            </p>

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
                <span className="bass-progress-text">
                    {tunedCount}/{STRINGS.length} accordées
                </span>
            </div>

            {/* Main area */}
            <div className="bass-main">
                <div className="bass-gnomes-wrap">
                    <img
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
                        />
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="bass-actions">
                {allTuned ? (
                    <button
                        className="bass-btn bass-btn--main"
                        onClick={handleReset}
                    >
                        Rejouer
                    </button>
                ) : (
                    <button className="bass-btn" onClick={handleReset}>
                        Recommencer
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="bass-legend">
                <div className="bass-legend-item">
                    <svg width="40" height="12">
                        <line
                            x1="0"
                            y1="6"
                            x2="40"
                            y2="6"
                            stroke="#e2a155"
                            strokeWidth="2.5"
                        />
                    </svg>
                    <span>Ta note</span>
                </div>
                <div className="bass-legend-item">
                    <svg width="40" height="12">
                        <line
                            x1="0"
                            y1="6"
                            x2="40"
                            y2="6"
                            stroke="#4caf50"
                            strokeWidth="3"
                        />
                    </svg>
                    <span>Accordé</span>
                </div>
            </div>
        </div>
    );
}
