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
        <img
            src={`${PUBLIC}/images/mille_pattes_fache.png`}
            alt="piano"
            style={{ width: "100%" }}
        />
        </div>
    );
}

export default Piano;
