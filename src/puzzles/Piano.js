import React from "react";

const PUBLIC = process.env.PUBLIC_URL || "";

function Piano() {
    return (
        <div
            className="trio"
            style={{
                backgroundImage: `url(${PUBLIC}/images/scene.png)`,
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <h1 className="trio-title">Retrouve la note</h1>
            <img
                src={`${PUBLIC}/images/mille_pattes_fache.png`}
                alt="piano"
            />
        </div>
    );
}

export default Piano;
