import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

const Particles = forwardRef(({ publicPath }, ref) => {
    const [particles, setParticles] = useState([]);
    const nextIdRef = useRef(1);
    const timeoutsRef = useRef([]);

    useImperativeHandle(ref, () => ({
        spawnAt(x, y) {
            const id = nextIdRef.current++;
            const imgIndex = Math.floor(Math.random() * 12) + 1;
            const dx = Math.round((Math.random() - 0.5) * 80);
            const p = { id, x, y, imgIndex, dx, floating: false };
            setParticles((s) => [...s, p]);
            const t1 = setTimeout(() => {
                setParticles((arr) => arr.map((q) => (q.id === id ? { ...q, floating: true } : q)));
            }, 20);
            const t2 = setTimeout(() => {
                setParticles((arr) => arr.filter((q) => q.id !== id));
            }, 900);
            timeoutsRef.current.push(t1, t2);
        },
    }));

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach((id) => clearTimeout(id));
            timeoutsRef.current = [];
        };
    }, []);

    return (
        <div style={{ position: "absolute", pointerEvents: "none", left: 0, top: 0, right: 0, bottom: 0, overflow: "visible" }}>
            {particles.map((p) => {
                const imgSrc = `${publicPath}/images/coloured-note-${p.imgIndex}.png`;
                const baseStyle = {
                    position: "absolute",
                    left: Math.round(p.x) + "px",
                    top: Math.round(p.y) + "px",
                    width: 100,
                    height: 100,
                    transform: "translate(-50%, -50%)",
                    transition: "transform 700ms cubic-bezier(.2,.9,.2,1), opacity 700ms",
                    opacity: p.floating ? 0 : 1,
                    zIndex: 999,
                    willChange: "transform, opacity",
                };
                if (p.floating) {
                    baseStyle.transform = `translate(calc(-50% + ${p.dx}px), -120px)`;
                }
                return <img key={p.id} src={imgSrc} alt="note" style={baseStyle} />;
            })}
        </div>
    );
});

export default Particles;
