import React, { useEffect, useState } from "react";
import "./DialogBox.css";

export default function DialogBox({
    message = "",
    visible = false,
    onClose = () => {},
    autoCloseMs = 4500,
    avatar = null,
    name = "",
    position = "bottom",
    typeSpeed = 10,
    typeJitter = 20,
}) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        let typer;
        let idx = 0;
        setDisplayed("");
        if (visible && message) {
            const base = Math.max(1, Number(typeSpeed) || 8);
            const jitter = Math.max(0, Number(typeJitter) || 12);
            typer = setInterval(() => {
                idx += 1;
                setDisplayed(message.slice(0, idx));
                if (idx >= message.length) clearInterval(typer);
            }, base + Math.round(Math.random() * jitter));
        }
        return () => clearInterval(typer);
    }, [message, visible, typeSpeed, typeJitter]);

    useEffect(() => {
        if (!visible) return undefined;
        if (!autoCloseMs) return undefined;
        const id = setTimeout(() => onClose(), autoCloseMs);
        return () => clearTimeout(id);
    }, [visible, autoCloseMs, onClose]);

    if (!visible) return null;

    return (
        <div className={`dq-root dq-${position}`} role="dialog" aria-live="polite">
            <div className="dq-bubble">
                {avatar && (
                    <div className="dq-avatar">
                        <img src={avatar} alt={name || "avatar"} />
                    </div>
                )}
                <div className="dq-content">
                    {name && <div className="dq-name">{name}</div>}
                    <div className="dq-text">{displayed}</div>
                </div>
                <button className="dq-close" onClick={onClose} aria-label="close">✕</button>
            </div>
            <div className="dq-tail" />
        </div>
    );
}
