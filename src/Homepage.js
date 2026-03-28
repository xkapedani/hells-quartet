// four buttons on the homepage, each with an icon and a label
import React from "react";
import "./Homepage.css";

const publicEnv = process.env.PUBLIC_URL;

// add
function Homepage() {
    return (
        <div className="homepage">
            <button className="homepage-button">
                <img src="${publicEnv}/drummer.svg}" alt="Drummer" />
            </button>
            <button className="homepage-button">
                <img
                    src="${publicEnv}/acoustic-guitar-musician.svg}"
                    alt="Drummer"
                />
            </button>
            <button className="homepage-button">
                <span>bassist</span>
            </button>
            <button className="homepage-button">
                <span>vocalist</span>
            </button>
        </div>
    );
}

export default Homepage;
