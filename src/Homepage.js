import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Homepage.css";
import Trio from "./puzzles/Trio";
import Drums from "./puzzles/Drums";
import Piano from "./puzzles/Piano";
import Bass from "./puzzles/Bass";
import * as Tone from "tone";
import { PlayFromFile, stopCurrent } from "./Player.js";
import DialogBox from "./components/DialogBox";

const PUBLIC = process.env.PUBLIC_URL || "";

const CHARACTERS = [
    {
        id: "cerbere",
        name: "Cerb'air",
        subtitle: "La musique se construit ensemble !",
        description: "Desc",
        image: "/images/cerbere_triste.png",
        instrument: "Vents",
        component: Trio,
        ready: true,
        stagePos: { bottom: "14%", left: "60%", width: "34%", zIndex: 2 },
    },
    {
        id: "gnomes",
        name: "Contre & Basse",
        subtitle: "Accorder les désaccords !",
        description: "Desc",
        image: "/images/gnomes_faches.png",
        instrument: "Contrebasse",
        component: Bass,
        ready: true,
        stagePos: { bottom: "32%", left: "30%", width: "26%", zIndex: 5 },
    },
    {
        id: "millepattes",
        name: "Millody",
        subtitle: "Veillez à ne pas s'emmêler les pattes !",
        description: "Desc",
        image: "/images/mille_pattes_fache.png",
        instrument: "Piano",
        component: Piano,
        ready: true,
        stagePos: { bottom: "30%", left: "52%", width: "22%", zIndex: 1 },
    },
    {
        id: "pieuvre",
        name: "Krak'n'Roll",
        subtitle: "Ne perdez pas le rythme !",
        description: "Desc",
        image: "/images/pieuvre_triste_sans_fond.png",
        instrument: "Batterie",
        component: Drums,
        ready: true,
        stagePos: { bottom: "18%", left: "10%", width: "32%", zIndex: 2 },
    },
];

const BG_MUSIC_FILE = null;
const BG_MUSIC_VOLUME = 0.35;

export default function Homepage() {
    const [selectedId, setSelectedId] = useState(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);
    // Intro full-page image visibility (click to fade out and reveal title)
    const [introMounted, setIntroMounted] = useState(true);
    const [introVisible, setIntroVisible] = useState(true);
    const [heroDialogVisible, setHeroDialogVisible] = useState(false);
    const [heroShown, setHeroShown] = useState(false);

    const [arrowsVisible, setArrowsVisible] = useState(true);
    const stageRef = useRef(null);

    const introTimeoutRef = useRef(null);

    const bgAudioRef = useRef(null);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [musicStarted, setMusicStarted] = useState(false);

    const [hoveredId, setHoveredId] = useState(null);
    const [completedPuzzles, setCompletedPuzzles] = useState({
        drums: false,
        bass: false,
        trio: false,
        piano: false,
    });
    const [thankedShown, setThankedShown] = useState(false);
    const [showThanksDialog, setShowThanksDialog] = useState(false);
    const allHappy =
        completedPuzzles &&
        Object.values(completedPuzzles).every((v) => Boolean(v));

    useEffect(() => {
        try {
            const drums = localStorage.getItem("puzzle-drums-completed") === "1";
            const bass = localStorage.getItem("puzzle-bass-completed") === "1";
            const trio = localStorage.getItem("puzzle-trio-completed") === "1";
            const piano =
                localStorage.getItem("puzzle-piano-completed") === "1";
            const thanks = localStorage.getItem("puzzle-thanks-shown") === "1";
            const hero = localStorage.getItem("hero-lore-shown") === "1";
            setCompletedPuzzles({ drums, bass, trio, piano });
            setThankedShown(Boolean(thanks));
            setHeroShown(Boolean(hero));
        } catch (e) {
            setCompletedPuzzles({
                drums: false,
                bass: false,
                trio: false,
                piano: false,
            });
        }
    }, []);

    useEffect(() => {
        if (allHappy && !showOverlay && !thankedShown) {
            setShowThanksDialog(true);
            try {
                localStorage.setItem("puzzle-thanks-shown", "1");
            } catch (e) {}
            setThankedShown(true);
        }
    }, [allHappy, showOverlay, thankedShown]);

    useEffect(() => {
        if (!introMounted && !heroShown) {
            setHeroDialogVisible(true);
            try {
                localStorage.setItem("hero-lore-shown", "1");
            } catch (e) {}
            setHeroShown(true);
        }
    }, [introMounted, heroShown]);

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
            // cleanup possible intro timeout
            if (introTimeoutRef.current) {
                clearTimeout(introTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        updateMusicOnBack();
    }, [completedPuzzles]);

    function handleIntroClick() {
        PlayFromFile("awful-title-screen/awful-all.mp3");
        setIntroVisible(false);
        // remove from DOM after transition
        introTimeoutRef.current = setTimeout(() => setIntroMounted(false), 600);
    }

    function handleCharacterClick(char) {
        if (!char.ready) return;
        stopCurrent();
        setSelectedId(char.id);
        setShowOverlay(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setOverlayVisible(true));
        });
    }

    function updateMusicOnBack() {
        // Play corresponding happy music following which puzzle was completed
        if (completedPuzzles.trio && completedPuzzles.drums && completedPuzzles.bass && completedPuzzles.piano) {
            PlayFromFile("final-song.mp3");
        } else if (completedPuzzles.trio && completedPuzzles.drums && completedPuzzles.bass) {
            PlayFromFile("trio-drums-bass.mp3");
        } else if (completedPuzzles.trio && completedPuzzles.drums && completedPuzzles.piano) {
            PlayFromFile("trio-drums-piano.mp3");
        } else if (completedPuzzles.trio && completedPuzzles.bass && completedPuzzles.piano) {
            PlayFromFile("trio-bass-piano.mp3");
        } else if (completedPuzzles.drums && completedPuzzles.bass && completedPuzzles.piano) {
            PlayFromFile("drums-bass-piano.mp3");
        } else if (completedPuzzles.trio && completedPuzzles.drums) {
            PlayFromFile("trio-drums.mp3");
        } else if (completedPuzzles.trio && completedPuzzles.bass) {
            PlayFromFile("trio-bass.mp3");
        } else if (completedPuzzles.trio && completedPuzzles.piano) {
            PlayFromFile("trio-piano.mp3");
        } else if (completedPuzzles.drums && completedPuzzles.bass) {
            PlayFromFile("bass-drums.mp3");
        } else if (completedPuzzles.drums && completedPuzzles.piano) {
            PlayFromFile("drums-piano.mp3");
        } else if (completedPuzzles.bass && completedPuzzles.piano) {
            PlayFromFile("piano-bass.mp3");
        } else if (completedPuzzles.trio) {
            PlayFromFile("trio.mp3");
        } else if (completedPuzzles.drums) {
            PlayFromFile("drums.mp3");
        } else if (completedPuzzles.bass) {
            PlayFromFile("bass.mp3");
        } else if (completedPuzzles.piano) {
            PlayFromFile("piano.mp3");
        }
    } 

    function handleBack() {
        setOverlayVisible(false);
        // refresh completed puzzle flags immediately so homepage reflects changes
        try {
            const drums = localStorage.getItem("puzzle-drums-completed") === "1";
            const bass = localStorage.getItem("puzzle-bass-completed") === "1";
            const trio = localStorage.getItem("puzzle-trio-completed") === "1";
            const piano =
                localStorage.getItem("puzzle-piano-completed") === "1";
            setCompletedPuzzles({ drums, bass, trio, piano });
        } catch (e) {
            setCompletedPuzzles({
                drums: false,
                bass: false,
                trio: false,
                piano: false,
            });
        }
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

    function handleRecommencer() {
        try {
            localStorage.clear();
        } catch (e) {}
        // reload to initial state
        window.location.reload();
    }

    return (
        <div className="hp">
            <section className="hp-hero">
                <div className="hp-hero-bg" />

                {introMounted && (
                    <>
                        <div
                            className={
                                "hp-intro-image" +
                                (introVisible ? "" : " hp-intro-image--hidden")
                            }
                            onClick={handleIntroClick}
                            role="button"
                            aria-label="Intro image - click to continue"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleIntroClick();
                            }}
                            style={{
                                backgroundImage: `url(${PUBLIC}/images/scene-ferme.png)`,
                            }}
                        />

                        <DialogBox
                            message={"Bienvenue au spectacle ! Chut, le spectacle va commencer..."}
                            visible={introVisible}
                            position="bottom"
                        />
                    </>
                )}

                <div className="hp-hero-title-box">
                    <div className="hp-hero-content">
                        <h1 className="hp-hero-title">
                            <span className="hp-hero-hell">Quartet</span>
                            <br />
                            <span className="hp-hero-quartet">de l'Enfer</span>
                        </h1>
                    </div>
                </div>

                {/* Show the hero lore as a dialog instead of subtitle */}
                {!introMounted && (
                    <DialogBox
                        message={
                            "Quel désastre ! Peux-tu aider le Quartet de l'Enfer à régler ses problèmes afin qu'ils puissent rejouer en harmonie tous ensemble ? Aide chaque musicien à retrouver sa musique!"
                        }
                        visible={heroDialogVisible && !showOverlay}
                        onClose={() => setHeroDialogVisible(false)}
                        position="bottom"
                    />
                )}

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
                            src={
                                char.id === "cerbere" && completedPuzzles.trio
                                    ? `${PUBLIC}/images/cerbere_heureux.png`
                                    : char.id === "pieuvre" &&
                                        completedPuzzles.drums
                                      ? `${PUBLIC}/images/pieuvre_heureuse_2.png`
                                      : char.id === "gnomes" &&
                                          completedPuzzles.bass
                                        ? `${PUBLIC}/images/gnomes_heureux.png`
                                        : char.id === "millepattes" &&
                                            completedPuzzles.piano
                                          ? `${PUBLIC}/images/mille_pattes_heureux.png`
                                          : `${PUBLIC}${char.image}`
                            }
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
                                    Bientôt disponible
                                </span>
                            )}
                        </div>
                    </button>
                ))}

                <div className="hp-stage-cta">
                    <span>Clique sur un musicien pour commencer !</span>
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
                            <span>Retour</span>
                        </button>

                        <div className="hp-overlay-bar-info">
                            <img
                                src={
                                    selectedChar.id === "cerbere" &&
                                    completedPuzzles.trio
                                        ? `${PUBLIC}/images/cerbere_heureux.png`
                                        : selectedChar.id === "millepattes" &&
                                          completedPuzzles.piano
                                        ? `${PUBLIC}/images/mille_pattes_heureux.png`
                                        : selectedChar.id === "pieuvre" &&
                                          completedPuzzles.drums
                                        ? `${PUBLIC}/images/pieuvre_heureuse_2.png`
                                        : selectedChar.id === "gnomes" &&
                                          completedPuzzles.bass
                                        ? `${PUBLIC}/images/gnomes_heureux.png`
                                        : `${PUBLIC}${selectedChar.image}`
                                }
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
                            <PuzzleComponent onClose={handleBack} resetOnOpen={true} />
                        ) : (
                            <div className="hp-coming-soon">
                                <img
                                    src={`${PUBLIC}${selectedChar.image}`}
                                    alt={selectedChar.name}
                                    className="hp-coming-soon-img"
                                    draggable={false}
                                />
                                <p className="hp-coming-soon-title">
                                    Ce puzzle est en cours de
                                    construction&hellip;
                                </p>
                                <p className="hp-coming-soon-sub">
                                    Revenez bientôt !
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Thank-you dialog: show only once (persisted) */}
            {showThanksDialog && (
                <DialogBox
                    message={"Merci d'avoir aidé les monstres ! Tu peux recommencer une partie pour rejouer les puzzles et la musique autant de fois que tu veux !"}
                    visible={true}
                    autoCloseMs={4500}
                    onClose={() => setShowThanksDialog(false)}
                    position="bottom"
                />
            )}

            {/* Restart button: visible whenever all monsters are happy and the scene is open on homepage */}
            {allHappy && !showOverlay && (
                <div className="hp-victory-actions" aria-hidden={false}>
                    <button className="hp-restart-btn" onClick={handleRecommencer}>
                        Réinitialiser le Quartet
                    </button>
                </div>
            )}
        </div>
    );
}
