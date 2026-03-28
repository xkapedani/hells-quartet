import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Homepage.css";
import Trio from "./puzzles/Trio";
import Drums from "./puzzles/Drums";
import Piano from "./puzzles/Piano";
import Bass from "./puzzles/Bass";

const PUBLIC = process.env.PUBLIC_URL || "";

const CHARACTERS = [
    {
        id: "cerbere",
        name: "Cerbere",
        subtitle: "La musique se construit ensemble !",
        description: "Desc",
        image: "/images/cerbere_triste.png",
        instrument: "Winds",
        component: Trio,
        ready: true,
        stagePos: { bottom: "8%", left: "4%", width: "30%" },
    },
    {
        id: "gnomes",
        name: "Contre & Basse",
        subtitle: "Accorder les désaccords !",
        description: "Desc",
        image: "/images/gnomes_faches.png",
        instrument: "Bass",
        component: Bass,
        ready: true,
        stagePos: { bottom: "8%", left: "27%", width: "22%" },
    },
    {
        id: "millepattes",
        name: "Millody",
        subtitle: "Veillez à ne pas s'emmêller les pattes !",
        description: "Desc",
        image: "/images/mille_pattes_fache.png",
        instrument: "Piano",
        component: Piano,
        ready: true,
        stagePos: { bottom: "6%", left: "48%", width: "28%" },
    },
    {
        id: "pieuvre",
        name: "Krak'n'Roll",
        subtitle: "Ne pas perdre le rythme !",
        description: "Desc",
        image: "/images/pieuvre_triste_sans_fond.png",
        instrument: "Drums",
        component: Drums,
        ready: true,
        stagePos: { bottom: "8%", right: "2%", width: "24%" },
    },
];

const BG_MUSIC_FILE = null;
const BG_MUSIC_VOLUME = 0.35;

export default function Homepage() {
    const [selectedId, setSelectedId] = useState(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);

    const [arrowsVisible, setArrowsVisible] = useState(true);
    const stageRef = useRef(null);

    const bgAudioRef = useRef(null);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [musicStarted, setMusicStarted] = useState(false);

    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => {
        function onScroll() {
            if (!stageRef.current) return;
            const rect = stageRef.current.getBoundingClientRect();
            setArrowsVisible(rect.top > window.innerHeight * 0.6);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = showOverlay ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [showOverlay]);

    const startMusic = useCallback(() => {
        if (!BG_MUSIC_FILE) return;
        if (!bgAudioRef.current) {
            const a = new Audio(`${PUBLIC}/audio/${BG_MUSIC_FILE}`);
            a.loop = true;
            a.volume = BG_MUSIC_VOLUME;
            bgAudioRef.current = a;
        }
        bgAudioRef.current
            .play()
            .then(() => {
                setMusicPlaying(true);
                setMusicStarted(true);
            })
            .catch(() => {});
    }, []);

    const toggleMusic = useCallback(() => {
        const a = bgAudioRef.current;
        if (!a) {
            startMusic();
            return;
        }
        if (a.paused) {
            a.play()
                .then(() => setMusicPlaying(true))
                .catch(() => {});
        } else {
            a.pause();
            setMusicPlaying(false);
        }
    }, [startMusic]);

    useEffect(() => {
        if (!BG_MUSIC_FILE || musicStarted) return;
        function onInteract() {
            startMusic();
            window.removeEventListener("click", onInteract);
            window.removeEventListener("scroll", onInteract);
        }
        window.addEventListener("click", onInteract, { once: true });
        window.addEventListener("scroll", onInteract, { once: true });
        return () => {
            window.removeEventListener("click", onInteract);
            window.removeEventListener("scroll", onInteract);
        };
    }, [musicStarted, startMusic]);

    useEffect(() => {
        const a = bgAudioRef.current;
        if (!a) return;
        if (showOverlay && !a.paused) {
            a.pause();
        } else if (!showOverlay && musicPlaying) {
            a.play().catch(() => {});
        }
    }, [showOverlay]);

    useEffect(() => {
        return () => {
            if (bgAudioRef.current) {
                bgAudioRef.current.pause();
                bgAudioRef.current = null;
            }
        };
    }, []);

    function handleCharacterClick(char) {
        if (!char.ready) return;
        setSelectedId(char.id);
        setShowOverlay(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setOverlayVisible(true));
        });
    }

    function handleBack() {
        setOverlayVisible(false);
        setTimeout(() => {
            setShowOverlay(false);
            setSelectedId(null);
        }, 350);
    }

    function scrollToStage() {
        if (stageRef.current) {
            stageRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }

    const selectedChar = CHARACTERS.find((c) => c.id === selectedId);
    const PuzzleComponent = selectedChar ? selectedChar.component : null;

    return (
        <div className="hp">
            <section className="hp-hero">
                <div className="hp-hero-bg" />

                <div className="hp-hero-content">
                    <h1 className="hp-hero-title">
                        <span className="hp-hero-hell">Hell's</span>
                        <br />
                        <span className="hp-hero-quartet">Quartet</span>
                    </h1>
                    <p className="hp-hero-sub">...</p>
                </div>

                <div
                    className={
                        "hp-arrows" +
                        (arrowsVisible ? "" : " hp-arrows--hidden")
                    }
                    onClick={scrollToStage}
                    role="button"
                    tabIndex={0}
                    aria-label="Scroll down"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") scrollToStage();
                    }}
                >
                    <span className="hp-arrow hp-arrow--1">
                        &rsaquo;&rsaquo;&rsaquo;
                    </span>
                    <span className="hp-arrow hp-arrow--2">
                        &rsaquo;&rsaquo;&rsaquo;
                    </span>
                    <span className="hp-arrow hp-arrow--3">
                        &rsaquo;&rsaquo;&rsaquo;
                    </span>
                </div>
            </section>

            <section className="hp-stage" ref={stageRef}>
                <div className="hp-stage-bg" />

                <div className="hp-stage-floor" />

                <div className="hp-spotlight hp-spotlight--1" />
                <div className="hp-spotlight hp-spotlight--2" />
                <div className="hp-spotlight hp-spotlight--3" />

                {CHARACTERS.map((char) => (
                    <button
                        key={char.id}
                        className={
                            "hp-char" +
                            (char.ready
                                ? " hp-char--ready"
                                : " hp-char--locked") +
                            (hoveredId === char.id ? " hp-char--hovered" : "")
                        }
                        style={char.stagePos}
                        onClick={() => handleCharacterClick(char)}
                        onMouseEnter={() => setHoveredId(char.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        aria-label={char.name}
                    >
                        <img
                            src={`${PUBLIC}${char.image}`}
                            alt={char.name}
                            className="hp-char-img"
                            draggable={false}
                        />

                        <div className="hp-char-tooltip">
                            <span className="hp-char-tooltip-name">
                                {char.name}
                            </span>
                            <span className="hp-char-tooltip-inst">
                                {char.instrument}
                            </span>
                            {!char.ready && (
                                <span className="hp-char-tooltip-lock">
                                    Coming Soon
                                </span>
                            )}
                        </div>
                    </button>
                ))}

                <div className="hp-stage-cta">
                    <span>Click a musician to begin!</span>
                </div>
            </section>

            {BG_MUSIC_FILE && (
                <button
                    className="hp-music-btn"
                    onClick={toggleMusic}
                    aria-label={
                        musicPlaying
                            ? "Mute background music"
                            : "Play background music"
                    }
                    title={musicPlaying ? "Mute music" : "Play music"}
                >
                    {musicPlaying ? (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                    ) : (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                    )}
                </button>
            )}

            {showOverlay && selectedChar && (
                <div
                    className={
                        "hp-overlay" +
                        (overlayVisible ? " hp-overlay--visible" : "")
                    }
                >
                    <div className="hp-overlay-bar">
                        <button
                            className="hp-back-btn"
                            onClick={handleBack}
                            aria-label="Back to homepage"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>Back</span>
                        </button>

                        <div className="hp-overlay-bar-info">
                            <img
                                src={`${PUBLIC}${selectedChar.image}`}
                                alt=""
                                className="hp-overlay-bar-img"
                                draggable={false}
                            />
                            <span className="hp-overlay-bar-name">
                                {selectedChar.name}
                            </span>
                            <span className="hp-overlay-bar-sep">&mdash;</span>
                            <span className="hp-overlay-bar-sub">
                                {selectedChar.subtitle}
                            </span>
                        </div>
                    </div>

                    <div className="hp-overlay-content">
                        {PuzzleComponent ? (
                            <PuzzleComponent onClose={handleBack} />
                        ) : (
                            <div className="hp-coming-soon">
                                <img
                                    src={`${PUBLIC}${selectedChar.image}`}
                                    alt={selectedChar.name}
                                    className="hp-coming-soon-img"
                                    draggable={false}
                                />
                                <p className="hp-coming-soon-title">
                                    This puzzle is still being composed&hellip;
                                </p>
                                <p className="hp-coming-soon-sub">
                                    Check back soon!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
