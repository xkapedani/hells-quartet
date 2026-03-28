import React, { useState, useRef } from "react";
import "./Trio.css";
import { playFile, cancelSequence, stopCurrent } from "../Player";

const PUBLIC = process.env.PUBLIC_URL || "";

// Set to true to show the clickable zone outlines (useful for debugging/positioning)
const SHOW_ZONES = false;

const INSTRUMENTS = [
    {
        id: "saxophone",
        label: "Saxophone",
        file: "cerbere-game/cerbere-game-Tenor_Saxophone.mp3",
        hint: "Listen for a warm, breathy tone.",
    },
    {
        id: "trumpet",
        label: "Trumpet",
        file: "cerbere-game/cerbere-game-Bb_Trumpet.mp3",
        hint: "Listen for a bright, piercing brass sound.",
    },
    {
        id: "clarinet",
        label: "Clarinet",
        file: "cerbere-game/cerbere-game-Bb_Clarinet.mp3",
        hint: "Listen for a smooth, woody tone.",
    },
];

const LEVEL2_FILE = "cerbere-game/cerbere-game-lvl2.MP3";
const LEVEL3_FILE = "cerbere-game/cerbere-game-lvl3.MP3";

// Left head = saxophone, center = trumpet, right = clarinet
const ZONES = [
    { id: "saxophone", left: "2%", top: "5%", width: "32%", height: "90%" },
    { id: "trumpet", left: "31%", top: "0%", width: "37%", height: "90%" },
    { id: "clarinet", left: "65%", top: "5%", width: "35%", height: "90%" },
];

// Delays (ms)
const CORRECT_ADVANCE_DELAY = 1200; // pause after "Correct!" before moving to next round
const LEVEL_ADVANCE_DELAY = 1800; // pause after last round before showing the Next button
const DONE_BUTTON_DELAY = 1200; // pause after level completion before showing Finish/Next
const REPLAY_SHOW_DELAY = 800; // pause before the Replay button appears

function getInstrument(id) {
    return INSTRUMENTS.find((i) => i.id === id);
}

export default function Trio() {
    const [step, setStep] = useState("explore");
    const [feedback, setFeedback] = useState("");
    const [playingId, setPlayingId] = useState(null);

    // Level 1
    const [l1Queue, setL1Queue] = useState([]);
    const [l1Round, setL1Round] = useState(0);
    const [l1Target, setL1Target] = useState(null);
    const [l1Done, setL1Done] = useState(false); // current round answered correctly

    // Level 2
    const [l2Targets, setL2Targets] = useState([]);
    const [l2Found, setL2Found] = useState([]);
    const [l2Done, setL2Done] = useState(false);

    // Level 3
    const [l3Found, setL3Found] = useState([]);
    const [l3Done, setL3Done] = useState(false);

    // Timed button visibility
    const [showReplay, setShowReplay] = useState(false);
    const [showNextLevel, setShowNextLevel] = useState(false);
    const [showDoneButton, setShowDoneButton] = useState(false);

    const feedbackTimer = useRef(null);
    const buttonTimers = useRef([]);

    // ── Timer helpers ──────────────────────────────────────────────────────────

    function clearButtonTimers() {
        buttonTimers.current.forEach(clearTimeout);
        buttonTimers.current = [];
    }

    function scheduleButton(setter, delay) {
        const t = setTimeout(() => setter(true), delay);
        buttonTimers.current.push(t);
    }

    function resetButtons() {
        clearButtonTimers();
        setShowReplay(false);
        setShowNextLevel(false);
        setShowDoneButton(false);
    }

    // ── Audio ──────────────────────────────────────────────────────────────────

    function playInstrument(id) {
        const inst = getInstrument(id);
        if (!inst) return;
        setPlayingId(id);
        playFile(inst.file, () => setPlayingId(null));
    }

    // ── Feedback ───────────────────────────────────────────────────────────────

    function showFeedback(msg, duration = 4000) {
        clearTimeout(feedbackTimer.current);
        setFeedback(msg);
        feedbackTimer.current = setTimeout(() => setFeedback(""), duration);
    }

    // ── Step transitions ───────────────────────────────────────────────────────

    function startLevel1() {
        cancelSequence();
        stopCurrent();
        resetButtons();
        const queue = [...INSTRUMENTS].sort(() => Math.random() - 0.5);
        setL1Queue(queue);
        setL1Round(0);
        setL1Target(queue[0]);
        setL1Done(false);
        setFeedback("");
        setStep("level1");
        setTimeout(() => {
            playInstrument(queue[0].id);
            scheduleButton(setShowReplay, REPLAY_SHOW_DELAY);
        }, 300);
    }

    function advanceL1Round(queue, round) {
        const nextRound = round + 1;
        const nextTarget = queue[nextRound];
        setL1Round(nextRound);
        setL1Target(nextTarget);
        setL1Done(false);
        setFeedback("");
        resetButtons();
        setTimeout(() => {
            playInstrument(nextTarget.id);
            scheduleButton(setShowReplay, REPLAY_SHOW_DELAY);
        }, 300);
    }

    function startLevel2() {
        cancelSequence();
        stopCurrent();
        resetButtons();
        const shuffled = [...INSTRUMENTS]
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
        setL2Targets(shuffled);
        setL2Found([]);
        setL2Done(false);
        setFeedback("");
        setStep("level2");
        setTimeout(() => {
            playFile(LEVEL2_FILE);
            scheduleButton(setShowReplay, REPLAY_SHOW_DELAY);
        }, 300);
    }

    function startLevel3() {
        cancelSequence();
        stopCurrent();
        resetButtons();
        setL3Found([]);
        setL3Done(false);
        setFeedback("");
        setStep("level3");
        setTimeout(() => {
            playFile(LEVEL3_FILE);
            scheduleButton(setShowReplay, REPLAY_SHOW_DELAY);
        }, 500);
    }

    function reset() {
        cancelSequence();
        stopCurrent();
        resetButtons();
        setStep("explore");
        setFeedback("");
        setL1Queue([]);
        setL1Round(0);
        setL1Target(null);
        setL1Done(false);
        setL2Targets([]);
        setL2Found([]);
        setL2Done(false);
        setL3Found([]);
        setL3Done(false);
    }

    // ── Click handlers ─────────────────────────────────────────────────────────

    function handleClick(id) {
        if (step === "explore") {
            const inst = getInstrument(id);
            playInstrument(id);
            showFeedback(`${inst.label} — ${inst.hint}`, 5000);
        }

        if (step === "level1") {
            if (l1Done) return;
            if (id === l1Target.id) {
                setL1Done(true);
                const isLast = l1Round === INSTRUMENTS.length - 1;
                if (!isLast) {
                    // Auto-advance to next round
                    showFeedback(
                        `Correct! (${l1Round + 1}/${INSTRUMENTS.length})`,
                        CORRECT_ADVANCE_DELAY,
                    );
                    const t = setTimeout(
                        () => advanceL1Round(l1Queue, l1Round),
                        CORRECT_ADVANCE_DELAY,
                    );
                    buttonTimers.current.push(t);
                } else {
                    // Last round — show feedback then reveal Next button
                    showFeedback("Correct!", LEVEL_ADVANCE_DELAY);
                    scheduleButton(setShowNextLevel, LEVEL_ADVANCE_DELAY);
                }
            } else {
                const inst = getInstrument(l1Target.id);
                showFeedback(`Not quite. ${inst.hint}`);
                setTimeout(() => playInstrument(l1Target.id), 800);
            }
        }

        if (step === "level2") {
            if (l2Done) return;
            const targetIds = l2Targets.map((t) => t.id);
            if (!targetIds.includes(id)) {
                showFeedback(
                    `Not one of them. ${l2Targets.map((t) => t.hint).join(" / ")}`,
                );
                return;
            }
            if (l2Found.includes(id)) return;
            const next = [...l2Found, id];
            setL2Found(next);
            if (next.length === 2) {
                setL2Done(true);
                showFeedback("You found both!", DONE_BUTTON_DELAY);
                scheduleButton(setShowDoneButton, DONE_BUTTON_DELAY);
            } else {
                showFeedback("One down, find the other.");
            }
        }

        if (step === "level3") {
            if (l3Done) return;
            if (l3Found.includes(id)) return;
            const next = [...l3Found, id];
            setL3Found(next);
            if (next.length === 2) {
                setL3Done(true);
                showFeedback("You found both!", DONE_BUTTON_DELAY);
                scheduleButton(setShowDoneButton, DONE_BUTTON_DELAY);
            } else {
                showFeedback("One down, find the other.");
            }
        }
    }

    function handleReplay() {
        if (step === "level1" && l1Target) playInstrument(l1Target.id);
        if (step === "level2") {
            stopCurrent();
            playFile(LEVEL2_FILE);
        }
        if (step === "level3") {
            stopCurrent();
            playFile(LEVEL3_FILE);
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    const isComplete = step === "complete";

    const instructions = {
        explore: "Click on each head to hear the instrument it plays.",
        level1: `Round ${l1Round + 1} of ${INSTRUMENTS.length} — One instrument is playing. Click the right head.`,
        level2: "Two instruments are playing. Find them both.",
        level3: "Two instruments are playing. Find them both.",
        complete: "You can now tell all three apart.",
    };

    return (
        <div className="trio">
            <h1 className="trio-title">The Three Instruments</h1>
            <p className="trio-instruction">{instructions[step]}</p>

            <div className="trio-image-wrap">
                <img
                    src={`${PUBLIC}/images/cerbere_triste.png`}
                    alt="Cerberus playing instruments"
                    className="trio-image"
                    draggable={false}
                />
                {!isComplete &&
                    ZONES.map((zone) => (
                        <button
                            key={zone.id}
                            className={[
                                "trio-zone",
                                playingId === zone.id
                                    ? "trio-zone--playing"
                                    : "",
                                SHOW_ZONES ? "trio-zone--visible" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            style={{
                                left: zone.left,
                                top: zone.top,
                                width: zone.width,
                                height: zone.height,
                            }}
                            onClick={() => handleClick(zone.id)}
                            aria-label={getInstrument(zone.id).label}
                        />
                    ))}
            </div>

            {feedback && <p className="trio-feedback">{feedback}</p>}

            <div className="trio-actions">
                {/* Replay — appears shortly after audio starts */}
                {(step === "level1" ||
                    step === "level2" ||
                    step === "level3") &&
                    showReplay && (
                        <button className="trio-btn" onClick={handleReplay}>
                            Replay
                        </button>
                    )}

                {/* Explore → Level 1 */}
                {step === "explore" && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={startLevel1}
                    >
                        Start
                    </button>
                )}

                {/* Level 1 last round done → Level 2 */}
                {step === "level1" && showNextLevel && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={startLevel2}
                    >
                        Next
                    </button>
                )}

                {/* Level 2 done → Level 3 */}
                {step === "level2" && showDoneButton && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={startLevel3}
                    >
                        Next
                    </button>
                )}

                {/* Level 3 done → Complete */}
                {step === "level3" && showDoneButton && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={() => {
                            cancelSequence();
                            setStep("complete");
                        }}
                    >
                        Finish
                    </button>
                )}

                {/* Complete → restart */}
                {isComplete && (
                    <button className="trio-btn" onClick={reset}>
                        Play again
                    </button>
                )}
            </div>

            <div className="trio-legend">
                {INSTRUMENTS.map((inst) => (
                    <div key={inst.id} className="trio-legend-item">
                        <span className="trio-legend-name">{inst.label}</span>
                        <span className="trio-legend-hint">{inst.hint}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
