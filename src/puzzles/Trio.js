import React, { useState, useRef, useEffect } from "react";
import "./Trio.css";
import { playFile, cancelSequence, stopCurrent, PlayFromFile } from "../Player";
import DialogBox from "../components/DialogBox";

const PUBLIC = process.env.PUBLIC_URL || "";

const SHOW_ZONES = false;

const INSTRUMENTS = [
    {
        id: "saxophone",
        label: "Saxophone",
        color: "#c8860a",
        file: "cerbere-game/cerbere-game-Tenor_Saxophone.mp3",
    },
    {
        id: "trumpet",
        label: "Trompette",
        color: "#b83232",
        file: "cerbere-game/cerbere-game-Bb_Trumpet.mp3",
    },
    {
        id: "clarinet",
        label: "Clarinette",
        color: "#2a6db5",
        file: "cerbere-game/cerbere-game-Bb_Clarinet.mp3",
    },
];

// Level audio files are played from the selected instrument files now

const ZONES = [
    { id: "saxophone", left: "2%", top: "5%", width: "32%", height: "90%" },
    { id: "trumpet", left: "31%", top: "0%", width: "37%", height: "90%" },
    { id: "clarinet", left: "65%", top: "5%", width: "35%", height: "90%" },
];

const CORRECT_ADVANCE_DELAY = 1200;
const LEVEL_ADVANCE_DELAY = 1800; // pause after last round before showing the Next button
const DONE_BUTTON_DELAY = 1200; // pause after level completion before showing Finish/Next
const REPLAY_SHOW_DELAY = 800; // pause before the Replay button appears

function getInstrument(id) {
    return INSTRUMENTS.find((i) => i.id === id);
}

export default function Trio({ onClose }) {
    const [step, setStep] = useState("explore");
    const [feedback, setFeedback] = useState({ icon: "", type: "neutral" });
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
    const [l3Targets, setL3Targets] = useState([]);
    const [l3Found, setL3Found] = useState([]);
    const [l3Done, setL3Done] = useState(false);

    // Timed button visibility
    const [showReplay, setShowReplay] = useState(false);
    const [showNextLevel, setShowNextLevel] = useState(false);
    const [showDoneButton, setShowDoneButton] = useState(false);

    const feedbackTimer = useRef(null);
    const buttonTimers = useRef([]);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [dialogAvatar, setDialogAvatar] = useState(null);
    const [cerbereHappy, setCerbereHappy] = useState(() => {
        try {
            return localStorage.getItem("puzzle-trio-completed") === "1";
        } catch (e) {
            return false;
        }
    });

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

    function showDialog(msg, opts = {}) {
        setDialogMessage(msg);
        setDialogAvatar(opts.avatar || null);
        setDialogVisible(true);
    }

    function finishTrio() {
        // mark completed, show thank-you dialog and switch image
        setCerbereHappy(true);
        try {
            localStorage.setItem("puzzle-trio-completed", "1");
        } catch (e) {}
        showDialog("Merci ! Je suis heureux maintenant !", { avatar: `${PUBLIC}/images/cerbere_heureux.png` });
    }

    useEffect(() => {
        const target = document;
        const hideOnFirst = () => setDialogVisible(false);

        if (cerbereHappy) {
            // show completion dialog when opening from homepage and already completed
            showDialog("Merci ! Je suis heureux maintenant !", { avatar: `${PUBLIC}/images/cerbere_heureux.png` });
            try {
                target.addEventListener("pointerdown", hideOnFirst, { once: true });
            } catch (e) {
                target.addEventListener("pointerdown", hideOnFirst);
            }
            return () => {
                try {
                    target.removeEventListener("pointerdown", hideOnFirst, { once: true });
                } catch (e) {
                    target.removeEventListener("pointerdown", hideOnFirst);
                }
            };
        }

        const avatar = `${PUBLIC}/images/cerbere_triste.png`;
        showDialog(
            "Roh, on n'arrive pas à différencier les sons de nos instruments… Peux-tu nous aider ?",
            { avatar },
        );
        try {
            target.addEventListener("pointerdown", hideOnFirst, { once: true });
        } catch (e) {
            target.addEventListener("pointerdown", hideOnFirst);
        }
        return () => {
            try {
                target.removeEventListener("pointerdown", hideOnFirst, { once: true });
            } catch (e) {
                target.removeEventListener("pointerdown", hideOnFirst);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function playInstrument(id) {
        const inst = getInstrument(id);
        if (!inst) return;
        setPlayingId(id);
        playFile(inst.file, () => setPlayingId(null));
    }

    function showFeedback(icon, type, duration = 4000) {
        clearTimeout(feedbackTimer.current);
        setFeedback({ icon, type });
        feedbackTimer.current = setTimeout(
            () => setFeedback({ icon: "", type: "neutral" }),
            duration,
        );
    }

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
            // play the chosen instrument files so targets match the audio
            shuffled.forEach((s) => PlayFromFile(s.file));
            scheduleButton(setShowReplay, REPLAY_SHOW_DELAY);
        }, 300);
    }

    function startLevel3() {
        cancelSequence();
        stopCurrent();
        resetButtons();
        // pick two instruments for level 3 and play them so targets match audio
        const shuffled = [...INSTRUMENTS].sort(() => Math.random() - 0.5).slice(0, 2);
        setL3Targets(shuffled);
        setL3Found([]);
        setL3Done(false);
        setFeedback("");
        setStep("level3");
        setTimeout(() => {
            // play both instrument files (concurrently) so the player hears the same targets
            shuffled.forEach((s) => PlayFromFile(s.file));
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
        setL3Targets([]);
        setL3Found([]);
        setL3Done(false);
    }

    function handleClick(id) {
        if (step === "explore") {
            playInstrument(id);
            showFeedback("♪", "neutral", 4000);
        }

        if (step === "level1") {
            if (l1Done) return;
            if (id === l1Target.id) {
                setL1Done(true);
                const isLast = l1Round === INSTRUMENTS.length - 1;
                if (!isLast) {
                    showFeedback("✓", "correct", CORRECT_ADVANCE_DELAY);
                    const t = setTimeout(
                        () => advanceL1Round(l1Queue, l1Round),
                        CORRECT_ADVANCE_DELAY,
                    );
                    buttonTimers.current.push(t);
                } else {
                    showFeedback("✓", "correct", LEVEL_ADVANCE_DELAY);
                    scheduleButton(setShowNextLevel, LEVEL_ADVANCE_DELAY);
                }
            } else {
                showFeedback("✗", "wrong");
                setTimeout(() => playInstrument(l1Target.id), 800);
            }
        }

        if (step === "level2") {
            if (l2Done) return;
            const targetIds = l2Targets.map((t) => t.id);
            if (!targetIds.includes(id)) {
                showFeedback("✗", "wrong");
                return;
            }
            if (l2Found.includes(id)) return;
            const next = [...l2Found, id];
            setL2Found(next);
            if (next.length === 2) {
                setL2Done(true);
                showFeedback("✓", "correct", DONE_BUTTON_DELAY);
                scheduleButton(setShowDoneButton, DONE_BUTTON_DELAY);
            } else {
                showFeedback("…", "neutral");
            }
        }

        if (step === "level3") {
            if (l3Done) return;
            const targetIds = l3Targets.map((t) => t.id);
            if (!targetIds.includes(id)) {
                showFeedback("✗", "wrong");
                return;
            }
            if (l3Found.includes(id)) return;
            const next = [...l3Found, id];
            setL3Found(next);
            if (next.length === l3Targets.length) {
                setL3Done(true);
                showFeedback("✓", "correct", DONE_BUTTON_DELAY);
                scheduleButton(setShowDoneButton, DONE_BUTTON_DELAY);
            } else {
                showFeedback("…", "neutral");
            }
        }
    }

    function handleReplay() {
        if (step === "level1" && l1Target) playInstrument(l1Target.id);
        if (step === "level2") {
            stopCurrent();
            l2Targets.forEach((t) => PlayFromFile(t.file));
        }
        if (step === "level3") {
            stopCurrent();
            l3Targets.forEach((t) => PlayFromFile(t.file));
        }
    }

    const isComplete = step === "complete";

    const instructions = {
        explore: "Clique sur chaque tête pour entendre l'instrument qui est joué.",
        level1: `Tour ${l1Round + 1} sur ${INSTRUMENTS.length}  Un instrument est en train de jouer. Clique sur la bonne tête.`,
        level2: "Deux instruments sont en train de jouer. Trouve-les tous les deux.",
        level3: "Deux instruments sont en train de jouer. Trouve-les tous les deux.",
        complete: "Tu peux maintenant les différencier tous les trois.",
    };

    return (
        <div
            className="trio"
            style={{
                backgroundColor: "#040208",
                backgroundImage: `linear-gradient(180deg, rgba(4, 2, 8, 0.72) 0%, rgba(10, 5, 16, 0.65) 50%, rgba(4, 2, 8, 0.8) 100%), url(${PUBLIC}/images/scene.png)`,
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <DialogBox
                message={dialogMessage}
                visible={dialogVisible}
                onClose={() => {
                    setDialogVisible(false);
                    if (typeof onClose === "function") onClose();
                }}
                avatar={dialogAvatar}
                name={"Cerb'air"}
                autoCloseMs={0}
            />

            <h1 className="trio-title">Les Trois Instruments</h1>
            <p className="trio-instruction">{instructions[step]}</p>

            <div className="trio-legend">
                {INSTRUMENTS.map((inst) => (
                    <div key={inst.id} className="trio-legend-item">
                        <span className="trio-legend-name">{inst.label}</span>
                    </div>
                ))}
            </div>

            <div className="trio-image-wrap">
                <img
                    src={
                        cerbereHappy
                            ? `${PUBLIC}/images/cerbere_heureux.png`
                            : `${PUBLIC}/images/cerbere_triste.png`
                    }
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

            <p className={`trio-feedback trio-feedback--${feedback.type}`}>
                {feedback.icon}
            </p>

            <div className="trio-actions">
                {/* Replay — appears shortly after audio starts */}
                {(step === "level1" ||
                    step === "level2" ||
                    step === "level3") &&
                    showReplay && (
                        <button className="trio-btn" onClick={handleReplay}>
                            Rejouer
                        </button>
                    )}

                {/* Explore → Level 1 */}
                {step === "explore" && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={startLevel1}
                    >
                        Commencer
                    </button>
                )}

                {/* Level 1 last round done → Level 2 */}
                {step === "level1" && showNextLevel && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={startLevel2}
                    >
                        Suivant
                    </button>
                )}

                {/* Level 2 done → Level 3 */}
                {step === "level2" && showDoneButton && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={startLevel3}
                    >
                        Suivant
                    </button>
                )}

                {/* Level 3 done → Complete */}
                {step === "level3" && showDoneButton && (
                    <button
                        className="trio-btn trio-btn--main"
                        onClick={() => {
                            cancelSequence();
                            setStep("complete");
                            finishTrio();
                        }}
                    >
                        Terminer
                    </button>
                )}

                {/* Complete → restart */}
                {isComplete && (
                    <button className="trio-btn" onClick={reset}>
                        Rejouer
                    </button>
                )}
            </div>
        </div>
    );
}
