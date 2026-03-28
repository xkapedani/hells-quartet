import React, { useEffect, useRef, useState } from "react";
import { PlayFromFile } from "../Player";
import Particles from "./Particles";
import DialogBox from "../components/DialogBox";

function Drums({ onClose }) {
    const [pattern, setPattern] = useState([]); // cumulative times in ms
    const [playing, setPlaying] = useState(false);
    const [recording, setRecording] = useState(false);
    const [userClicks, setUserClicks] = useState([]);
    const [message, setMessage] = useState("");
    const [pieuvreHappy, setPieuvreHappy] = useState(false);

    // three example patterns (cumulative ms)
    const [examples, setExamples] = useState([
        [500, 1000, 1500, 2000],
        [400, 700, 1100, 1600],
        [300, 650, 1000, 1550, 1900],
    ]);
    const [currentExampleIndex, setCurrentExampleIndex] = useState(null);
    const [completedExamples, setCompletedExamples] = useState([false, false, false]);
    const [activeBeat, setActiveBeat] = useState(-1);
    const playingTimeoutsRef = useRef([]);
    const containerRef = useRef(null);
    const octopusRef = useRef(null);
    const drumImgRef = useRef(null);
    const particlesRef = useRef(null);
    const MATCH_WINDOW = 200; // ms before/after for matching
    const [cooldown, setCooldown] = useState(false);
    const recordStartRef = useRef(0);
    const publicPath = process.env.PUBLIC_URL;
    const [autoPlayNext, setAutoPlayNext] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [dialogAvatar, setDialogAvatar] = useState(null);

    function showDialog(msg, opts = {}) {
        setDialogMessage(msg);
        setDialogAvatar(opts.avatar || null);
        setDialogVisible(true);
    }

    useEffect(() => {
        // set initial pattern from first example, or restore completion from localStorage
        try {
            const done = localStorage.getItem("puzzle-drums-completed");
            if (done === "1") {
                setPieuvreHappy(true);
                setCompletedExamples([true, true, true]);
                setCurrentExampleIndex(null);
                setMessage("Le puzzle est déjà terminé.");
            } else {
                setPattern(examples[0]);
                setCurrentExampleIndex(0);
            }
        } catch (e) {
            setPattern(examples[0]);
            setCurrentExampleIndex(0);
        }
        return () => {
            // cleanup scheduled timeouts
            playingTimeoutsRef.current.forEach((id) => clearTimeout(id));
            playingTimeoutsRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (autoPlayNext && pattern && pattern.length > 0) {
            // small delay to allow DOM/layout settle
            const id = setTimeout(() => {
                setAutoPlayNext(false);
                playPattern();
            }, 80);
            return () => clearTimeout(id);
        }
        return undefined;
    }, [autoPlayNext, pattern]);

    // When navigating to this component (e.g., from the homepage), automatically
    // start the first melody after a short delay so the user sees it.
    useEffect(() => {
        const id = setTimeout(() => {
            setAutoPlayNext(true);
        }, 2000);
        return () => clearTimeout(id);
    }, []);

    // show a friendly intro dialog when entering the drums screen
    useEffect(() => {
        const avatar = `${publicPath}/images/pieuvre_triste_tete.png`;
        showDialog("Bonjour, je suis Krack'n'roll et je suis très triste car je n'arrive pas à jouer le bon rythme. Peux-tu m'aider ?", { avatar });
        const target = containerRef.current || document;
        const hideOnFirst = () => setDialogVisible(false);
        try {
            target.addEventListener("pointerdown", hideOnFirst, { once: true });
        } catch (e) {
            // some targets (like null) may not support options; fallback
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

    // when octopus becomes happy, show a short celebratory dialog and
    // hide it on the user's first click.
    useEffect(() => {
        if (pieuvreHappy) {
            const avatar = `${publicPath}/images/pieuvre_heureuse_tete.png`;
            showDialog("Merci je suis heureux à nouveau !", { avatar });
            const target = containerRef.current || document;
            const hideOnFirst = () => {
                setDialogVisible(false);
                if (typeof onClose === "function") onClose();
            };
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
        return undefined;
    }, [pieuvreHappy, onClose]);


    // play a sample sound file at given scheduled ms
    function playSampleAt(time) {
        const id = setTimeout(() => {
            PlayFromFile("one-time-drum.mp3");
        }, time);
        playingTimeoutsRef.current.push(id);
    }

    function getRelativeCenter(ref) {
        const container = containerRef.current;
        const el = ref && ref.current;
        if (!container || !el) return { x: 0, y: 0 };
        const crect = container.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        const x = rect.left - crect.left + rect.width / 2;
        const y = rect.top - crect.top + rect.height / 2;
        return { x, y };
    }

    

    async function playPattern() {
        if (!pattern || pattern.length === 0) return;
        setPlaying(true);
        playingTimeoutsRef.current.forEach((id) => clearTimeout(id));
        playingTimeoutsRef.current = [];
        // schedule visual and audio for each beat
        pattern.forEach((t, i) => {
            // schedule audio sample
            playSampleAt(t);
            // schedule particle spawn at same time
            const spawnId = setTimeout(() => {
                // compute position at spawn time (in case layout changed)
                const octoPos = getRelativeCenter(octopusRef);
                const jitterX = (Math.random() - 0.5) * 40;
                particlesRef.current && particlesRef.current.spawnAt(octoPos.x + jitterX, octoPos.y);
            }, t);
            playingTimeoutsRef.current.push(spawnId);
            // schedule visual highlight
            const id = setTimeout(() => setActiveBeat(i), t);
            playingTimeoutsRef.current.push(id);
        });
        // clear after last beat
        const last = pattern[pattern.length - 1] + 300;
        const clearId = setTimeout(() => {
            setPlaying(false);
            setActiveBeat(-1);
            setMessage("Maintenant reproduis le rythme en cliquant sur le tambour ci-dessous.");
        }, last);
        playingTimeoutsRef.current.push(clearId);
    }

    // play a given pattern array immediately (does not rely on state pattern)
    function playPatternWith(pat) {
        if (!pat || pat.length === 0) return;
        setPattern(pat);
        setPlaying(true);
        playingTimeoutsRef.current.forEach((id) => clearTimeout(id));
        playingTimeoutsRef.current = [];
        pat.forEach((t, i) => {
            playSampleAt(t);
            const spawnId = setTimeout(() => {
                const octoPos = getRelativeCenter(octopusRef);
                const jitterX = (Math.random() - 0.5) * 40;
                particlesRef.current && particlesRef.current.spawnAt(octoPos.x + jitterX, octoPos.y);
            }, t);
            playingTimeoutsRef.current.push(spawnId);
            const id = setTimeout(() => setActiveBeat(i), t);
            playingTimeoutsRef.current.push(id);
        });
        const last = pat[pat.length - 1] + 300;
        const clearId = setTimeout(() => {
            setPlaying(false);
            setActiveBeat(-1);
            setMessage("Maintenant reproduis le rythme en cliquant sur le tambour ci-dessous.");
        }, last);
        playingTimeoutsRef.current.push(clearId);
    }

    function stopRecording(passedClicks) {
        setRecording(false);
        setMessage("Évaluation...");
        setTimeout(() => evaluateAttempt(passedClicks), 200);
    }

    function onDrumClick() {
        if (cooldown) return;
        const now = performance.now();
        // first click starts the recording session (acts as 'start')
        if (!recording) {
            recordStartRef.current = now;
            // record the initial click as time 0 so it counts as the first beat
            // use functional update to avoid race conditions when clicks happen quickly
            setUserClicks(() => {
                const arr = [0];
                return arr;
            });
            setRecording(true);
            setMessage("Enregistrement... maintenant clique pour chaque battement afin de reproduire le rythme.");
            // feedback for start
            PlayFromFile("one-time-drum.mp3");
            // spawn initial note particle at drum on start
            const drumPosStart = getRelativeCenter(drumImgRef);
            particlesRef.current && particlesRef.current.spawnAt(drumPosStart.x, drumPosStart.y);
            return;
        }
        // recording: record click time relative to start
        const t = now - recordStartRef.current;
        setUserClicks((s) => {
            const next = [...s, t];
            // only log the adjusted user clicks (add pattern[0] to each) for comparison
            const offset = pattern && pattern.length ? pattern[0] : 0;
            const adjusted = next.map((v) => +(v + offset));
            // eslint-disable-next-line no-console
            console.log("user clicks updated:", adjusted);
            // auto-stop when we have at least as many clicks as pattern beats
            if (next.length >= pattern.length) {
                // pass the latest clicks to stopRecording so evaluation uses the freshest data
                setTimeout(() => stopRecording(next), 100);
            }
            return next;
        });
        // also play click feedback
        PlayFromFile("one-time-drum.mp3");
        // spawn a note particle on the drum
        const drumPos = getRelativeCenter(drumImgRef);
        particlesRef.current && particlesRef.current.spawnAt(drumPos.x, drumPos.y);
    }

    function computeIntervals(times) {
        // times: cumulative times (ms)
        const intervals = [];
        let prev = 0;
        for (let t of times) {
            intervals.push(t - prev);
            prev = t;
        }
        return intervals;
    }

    function evaluateAttempt(passedUserArray) {
        if (!userClicks || userClicks.length === 0) {
            setMessage("Aucun clic enregistré. Réessaie.");
            setRecording(false);
            return;
        }
        // element-wise compare adjusted user cumulative clicks to needed pattern timings
        // prefer passedUserArray (fresh snapshot) if provided to avoid stale state
        const user = (passedUserArray || userClicks).slice(0, pattern.length);
        // eslint-disable-next-line no-console
        console.log("needed timings:", pattern);
        const offset = pattern && pattern.length ? pattern[0] : 0;
        const adjustedUser = user.map((v) => v + offset);

        const diffs = [];
        let ok = true;
        if (adjustedUser.length < pattern.length) {
            ok = false;
        } else {
            for (let i = 0; i < pattern.length; i++) {
                const p = pattern[i];
                const u = adjustedUser[i];
                const d = Math.abs(p - u);
                diffs.push(d);
                if (d > MATCH_WINDOW) ok = false;
            }
        }

        if (ok) {
            setMessage("Bien joué ! Tu es en rythme.");
            let allCompleted = false;
            if (currentExampleIndex !== null) {
                // mark current completed and compute next candidate synchronously
                const copy = [...completedExamples];
                copy[currentExampleIndex] = true;
                setCompletedExamples(copy);
                // if all completed, make pieuvre happy
                if (copy.every(Boolean)) {
                    setPieuvreHappy(true);
                    try { localStorage.setItem("puzzle-drums-completed", "1"); } catch (e) {}
                    allCompleted = true;
                } else {
                    // find next not-completed example, preferring the next index
                    let next = -1;
                    for (let j = currentExampleIndex + 1; j < copy.length; j++) {
                        if (!copy[j]) {
                            next = j;
                            break;
                        }
                    }
                    if (next === -1) {
                        for (let j = 0; j < copy.length; j++) {
                            if (!copy[j]) {
                                next = j;
                                break;
                            }
                        }
                    }
                    if (next !== -1) {
                        setCurrentExampleIndex(next);
                        // immediately play the computed next pattern to avoid race on setState
                        const nextPattern = examples[next];
                        setPattern(nextPattern);
                        setMessage(`Exemple ${next + 1}`);
                        // play next pattern right away using provided array
                        playPatternWith(nextPattern);
                    }
                }
            } else {
                setPieuvreHappy(true);
                try { localStorage.setItem("puzzle-drums-completed", "1"); } catch (e) {}
                allCompleted = true;
            }
            // celebration: spawn heart particles around octopus
            const octoPosSuccess = getRelativeCenter(octopusRef);
            particlesRef.current && particlesRef.current.spawnBurst(octoPosSuccess.x, octoPosSuccess.y, 10, { src: `${publicPath}/images/heart.png`, radius: 200, size: 48, lifetime: 6000 });
            // only autoplay next melody when not all examples are completed
            if (!allCompleted && !autoPlayNext) setAutoPlayNext(true);
        } else {
            const hint = diffs.length ? ` diffs: ${diffs.map((d) => Math.round(d)).join(",")}` : "";
            setMessage("Pas tout à fait, réessaie ou écoute une fois de plus." + hint);
            setPieuvreHappy(false);
            // negative feedback: spawn thunder particles around octopus
            const octoPosFail = getRelativeCenter(octopusRef);
            particlesRef.current && particlesRef.current.spawnBurst(octoPosFail.x, octoPosFail.y, 10, { src: `${publicPath}/images/thunder.png`, radius: 200, size: 56, lifetime: 6000 });
            // after thunder, replay the same melody (short delay so thunder is visible)
            setTimeout(() => {
                playPattern();
            }, 500);
        }
        setRecording(false);
        // cooldown for 2s before next attempt
        setCooldown(true);
        setTimeout(() => setCooldown(false), 2000);
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                height: "100%",
                padding: 20,
                boxSizing: "border-box",
                justifyContent: "center",
                backgroundImage: `url(${publicPath}/images/scene.png)`,
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <Particles ref={particlesRef} publicPath={publicPath} />
            <DialogBox
                message={dialogMessage}
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
                avatar={dialogAvatar}
                name={"Krak'n'roll"}
                autoCloseMs={0}
            />
            <div style={{ marginTop: 8, textAlign: "center" }}>
                <img
                    ref={octopusRef}
                    src={pieuvreHappy ? `${publicPath}/images/pieuvre_heureuse_2.png` : `${publicPath}/images/pieuvre_triste_sans_fond.png`}
                    alt="pieuvre"
                    onClick={() => { if (!playing && pattern.length>0 && !cooldown) playPattern(); }}
                    role="button"
                    tabIndex={0}
                    // crop image to be square
                    style={{
                        width: 740,
                        height: 640,
                        objectFit: "cover",
                        display: "block",
                        margin: "0 auto",
                        filter: pieuvreHappy ? "brightness(1.05) saturate(1.2) drop-shadow(0 12px 36px rgba(200,50,50,0.25))" : "none",
                        transition: "filter 400ms ease, transform 400ms ease",
                        transform: pieuvreHappy ? "scale(1.05)" : "scale(1)",
                        cursor: (playing || pattern.length===0 || cooldown) ? "not-allowed" : "pointer",
                    }}
                />
            </div>

            <div
                style={{
                    marginTop: 20,
                    width: "100%",
                    maxWidth: 720,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                }}
            >

                <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
                    {completedExamples.map((done, i) => (
                        <img
                            key={i}
                            src={done ? `${publicPath}/images/star-full.png` : `${publicPath}/images/star-empty.png`}
                            alt={done ? `Star ${i+1} full` : `Star ${i+1} empty`}
                            style={{ width: 100, height: 100 }}
                        />
                    ))}
                </div>

                <div
                    onClick={onDrumClick}
                    role="button"
                    aria-label="drum pad"
                    style={{
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: cooldown ? "not-allowed" : "pointer",
                        userSelect: "none",
                    }}
                >
                    {/* image of drum-full, when on cooldown image of drum-empty */}
                    <img
                        ref={drumImgRef}
                        src={cooldown ? `${publicPath}/images/drum-empty.png` : `${publicPath}/images/drum-full.png`}
                        alt="drum"
                        style={{ width: 300, height: 500, objectFit: "cover", pointerEvents: "none" }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Drums;