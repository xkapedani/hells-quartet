import React, { useEffect, useRef, useState } from "react";
import { PlayFromFile } from "../Player";

function Drums() {
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
    const MATCH_WINDOW = 200; // ms before/after for matching
    const [cooldown, setCooldown] = useState(false);
    const recordStartRef = useRef(0);
    const publicPath = process.env.PUBLIC_URL;

    useEffect(() => {
        // set initial pattern from first example
        setPattern(examples[0]);
        setCurrentExampleIndex(0);
        return () => {
            // cleanup scheduled timeouts
            playingTimeoutsRef.current.forEach((id) => clearTimeout(id));
            playingTimeoutsRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // play a sample sound file at given scheduled ms
    function playSampleAt(time) {
        const id = setTimeout(() => {
            PlayFromFile("one-time-drum.mp3");
        }, time);
        playingTimeoutsRef.current.push(id);
    }

    async function playPattern() {
        if (!pattern || pattern.length === 0) return;
        playingTimeoutsRef.current.forEach((id) => clearTimeout(id));
        playingTimeoutsRef.current = [];
        // schedule visual and audio for each beat
        pattern.forEach((t, i) => {
            // schedule audio sample
            playSampleAt(t);
            // schedule visual highlight
            const id = setTimeout(() => setActiveBeat(i), t);
            playingTimeoutsRef.current.push(id);
        });
        // clear after last beat
        const last = pattern[pattern.length - 1] + 300;
        const clearId = setTimeout(() => {
            setPlaying(false);
            setActiveBeat(-1);
            setMessage("Now reproduce the rhythm by clicking the drum below.");
        }, last);
        playingTimeoutsRef.current.push(clearId);
    }

    function stopRecording(passedClicks) {
        setRecording(false);
        setMessage("Evaluating...");
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
            setMessage("Recording... now click for each beat to match the rhythm.");
            // feedback for start
            PlayFromFile("one-time-drum.mp3");
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
            setMessage("No clicks recorded. Try again.");
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
            setMessage("Nice! You matched the rhythm.");
            if (currentExampleIndex !== null) {
                    setCompletedExamples((prev) => {
                        const copy = [...prev];
                        copy[currentExampleIndex] = true;
                        // if all completed, make pieuvre happy
                        if (copy.every(Boolean)) {
                            setPieuvreHappy(true);
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
                                setPattern(examples[next]);
                                setMessage(`Loaded example ${next + 1}`);
                            }
                        }
                        return copy;
                    });
            } else {
                setPieuvreHappy(true);
            }
        } else {
            const hint = diffs.length ? ` diffs: ${diffs.map((d) => Math.round(d)).join(",")}` : "";
            setMessage("Not quite — try again or listen once more." + hint);
            setPieuvreHappy(false);
        }
        setRecording(false);
        // cooldown for 2s before next attempt
        setCooldown(true);
        setTimeout(() => setCooldown(false), 2000);
    }

    return (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100%", padding: 20, boxSizing: "border-box", justifyContent: "center" }}>
            <div style={{ marginTop: 8, textAlign: "center" }}>
                <img
                    src={pieuvreHappy ? `${publicPath}/images/pieuvre_triste_sans_fond.png` : `${publicPath}/images/pieuvre_triste_sans_fond.png`}
                    alt="pieuvre"
                    onClick={() => { if (!playing && pattern.length>0 && !cooldown) playPattern(); }}
                    role="button"
                    tabIndex={0}
                    style={{
                        width: 1040,
                        height: "auto",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto",
                        filter: pieuvreHappy ? "hue-rotate(100deg) saturate(140%)" : "none",
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

            <div style={{ textAlign: "center", minHeight: 24 }}>{message}</div>

                <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
                    {completedExamples.map((done, i) => (
                        <img
                            key={i}
                            src={done ? `${publicPath}/images/star-full.png` : `${publicPath}/images/star-empty.png`}
                            alt={done ? `Star ${i+1} full` : `Star ${i+1} empty`}
                            style={{ width: 50, height: 50 }}
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
                        src={cooldown ? `${publicPath}/images/drum-empty.png` : `${publicPath}/images/drum-full.png`}
                        alt="drum"
                        style={{ width: 420, height: "auto", pointerEvents: "none" }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Drums;