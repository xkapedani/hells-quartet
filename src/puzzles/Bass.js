import React, { useRef, useState } from "react";
import { PlayFromFile } from "../Player";
import Particles from "./Particles";

// ---------- utils ----------
function generateWavePath(width, height, amplitude, frequency) {
    let path = `M 0 ${height / 2}`;

    for (let x = 0; x <= width; x += 8) {
        const y =
            height / 2 +
            Math.sin((x / width) * frequency * Math.PI * 2) * amplitude;
        path += ` L ${x} ${y}`;
    }

    return path;
}

// ---------- composant corde ----------
function WaveString({
    targetFreq,
    index,
    activeIndex,
    setActiveIndex,
    onTune,
}) {
    const [frequency, setFrequency] = useState(2);

    const isActive = activeIndex === index;
    const isTuned = Math.abs(frequency - targetFreq) < 0.2;

    const width = 520;
    const height = 80;

    const path = generateWavePath(
        width,
        height,
        isActive ? 20 : 10,
        frequency
    );

    function handleMouseMove(e) {
        if (!isActive) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const newFreq = 1 + (x / rect.width) * 8;
        setFrequency(newFreq);

        // feedback sonore léger
        PlayFromFile("one-time-drum.mp3");

        if (Math.abs(newFreq - targetFreq) < 0.2) {
            onTune(index);
        }
    }

    return (
        <div
            onClick={() => setActiveIndex(index)}
            onMouseMove={handleMouseMove}
            style={{
                cursor: "pointer",
                opacity: isActive ? 1 : 0.7,
                transition: "opacity 0.2s",
            }}
        >
            <svg width={width} height={height}>
                <path
                    d={path}
                    stroke={
                        isTuned ? "#4caf50" : isActive ? "#ff9800" : "#222"
                    }
                    strokeWidth={3}
                    fill="transparent"
                />
            </svg>
        </div>
    );
}

export default function WaveGame() {
    const containerRef = useRef(null);
    const gnomesRef = useRef(null);

    const publicPath = process.env.PUBLIC_URL;

    const [targetPattern] = useState([2, 3, 4, 5]);
    const [tunedStrings, setTunedStrings] = useState([
        false,
        false,
        false,
        false,
    ]);
    const [activeIndex, setActiveIndex] = useState(null);
    const [message, setMessage] = useState(
        "Clique sur une corde puis ajuste-la avec ta souris."
    );
    const [gnomesHappy, setGnomesHappy] = useState(false);
    
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

    function handleTune(index) {
        setTunedStrings((prev) => {
            if (prev[index]) return prev;

            const copy = [...prev];
            copy[index] = true;

            setMessage(`Corde ${index + 1} accordée 🎯`);

            if (copy.every(Boolean)) {
                setMessage("Parfait ! Toutes les cordes sont accordées 🎉");
                setGnomesHappy(true);
            }

            return copy;
        });
    }

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: 20,
                gap: 40,
            }}
        >

            {/* PIEUVRE */}
            <img
                ref={gnomesRef}
                src={gnomesHappy ? `${publicPath}/images/gnomes_heureux.png` : `${publicPath}/images/gnomes_faches.png`}
                alt="gnomes"
                style={{
                    width: 400,
                    filter: gnomesHappy ? "hue-rotate(100deg) saturate(140%)" : "none",
                    transition: "all 0.4s",
                    transform: gnomesHappy ? "scale(1.05)" : "scale(1)",
                }}
            />

            {/* ZONE DE JEU */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    alignItems: "center",
                }}
            >
                <h3>{message}</h3>

                {targetPattern.map((freq, i) => (
                    <WaveString
                        key={i}
                        index={i}
                        targetFreq={freq}
                        activeIndex={activeIndex}
                        setActiveIndex={setActiveIndex}
                        onTune={handleTune}
                    />
                ))}
            </div>
        </div>
    );
}