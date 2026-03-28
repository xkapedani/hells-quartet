import React, {
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    forwardRef,
} from "react";

const Particles = forwardRef(({ publicPath }, ref) => {
    const [particles, setParticles] = useState([]);
    const nextIdRef = useRef(1);
    const timeoutsRef = useRef([]);

    useImperativeHandle(ref, () => ({
        spawnAt(x, y, opts = {}) {
            const id = nextIdRef.current++;
            const imgIndex =
                opts.imgIndex || Math.floor(Math.random() * 12) + 1;
            const dx =
                typeof opts.dx === "number"
                    ? opts.dx
                    : Math.round((Math.random() - 0.5) * 80);
            const src = opts.src || null;
            const size = opts.size || 200;
            const lifetime =
                typeof opts.lifetime === "number" ? opts.lifetime : 900;
            const p = {
                id,
                x,
                y,
                imgIndex,
                dx,
                floating: false,
                src,
                size,
                lifetime,
            };
            setParticles((s) => [...s, p]);
            const t1 = setTimeout(() => {
                setParticles((arr) =>
                    arr.map((q) =>
                        q.id === id ? { ...q, floating: true } : q,
                    ),
                );
            }, 20);
            const t2 = setTimeout(() => {
                setParticles((arr) => arr.filter((q) => q.id !== id));
            }, lifetime);
            timeoutsRef.current.push(t1, t2);
        },
        spawnBurst(x, y, count = 8, opts = {}) {
            const radius = opts.radius || 80;
            for (let i = 0; i < count; i++) {
                const angle =
                    (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
                const r = radius * (0.6 + Math.random() * 0.6);
                const px = x + Math.cos(angle) * r + (Math.random() - 0.5) * 20;
                const py = y + Math.sin(angle) * r + (Math.random() - 0.5) * 20;
                const dx = Math.round((Math.random() - 0.5) * 100);
                const spawnOpts = {
                    src: opts.src,
                    imgIndex: opts.imgIndex,
                    dx,
                    size: opts.size || 200,
                    lifetime: opts.lifetime || 1000,
                };
                // stagger slightly
                const delay = Math.round(Math.random() * 120);
                const to = setTimeout(() => {
                    // spawn each particle
                    // if src provided, use that; otherwise colored notes
                    ref &&
                        ref.current &&
                        ref.current.spawnAt &&
                        ref.current.spawnAt(px, py, spawnOpts);
                }, delay);
                timeoutsRef.current.push(to);
            }
        },
    }));

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach((id) => clearTimeout(id));
            timeoutsRef.current = [];
        };
    }, []);

    return (
        <div
            style={{
                position: "absolute",
                pointerEvents: "none",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                overflow: "visible",
            }}
        >
            {particles.map((p) => {
                const imgSrc =
                    p.src ||
                    `${publicPath}/images/coloured-note-${p.imgIndex}.png`;
                const anim = p.lifetime || 900;
                const baseStyle = {
                    position: "absolute",
                    left: Math.round(p.x) + "px",
                    top: Math.round(p.y) + "px",
                    width: p.size || 200,
                    height: p.size || 200,
                    transform: "translate(-50%, -50%)",
                    transition: `transform ${anim}ms cubic-bezier(.2,.9,.2,1), opacity ${anim}ms`,
                    opacity: p.floating ? 0 : 1,
                    zIndex: 999,
                    willChange: "transform, opacity",
                };
                if (p.floating) {
                    baseStyle.transform = `translate(calc(-50% + ${p.dx}px), -120px)`;
                }
                return (
                    <img key={p.id} src={imgSrc} alt="note" style={baseStyle} />
                );
            })}
        </div>
    );
});

export default Particles;
