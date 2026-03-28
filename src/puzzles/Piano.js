import React from "react";

const publicPath = process.env.PUBLIC_URL;

function Piano() {
    return (
        <img src={`${publicPath}/images/mille_pattes_fache.png`} alt="piano" style={{ width: "100%" }} />
    );
}

export default Piano;