// four buttons on the homepage, each with an icon and a label
import React from 'react';
import './Homepage.css';

const publicPath = process.env.PUBLIC_URL;

function Homepage() {
  return (
    <div className="homepage">
      <button className="homepage-button">
        <img src={`${publicPath}/images/cerbere_triste.png`} alt="trio icon" className="homepage-icon" />
      </button>
      <button className="homepage-button">
        <img src={`${publicPath}/images/gnomes_faches.png`} alt="cello icon" className="homepage-icon" />
      </button>
      <button className="homepage-button">
        <img src={`${publicPath}/images/mille_pattes_fache.png`} alt="piano icon" className="homepage-icon" />
      </button>
      <button className="homepage-button">
        <img src={`${publicPath}/images/pieuvre_triste_sans_fond.png`} alt="drums icon" className="homepage-icon" />
      </button>
    </div>
  );
}

export default Homepage;