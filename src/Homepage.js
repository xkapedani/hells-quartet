import React from 'react';
import './Homepage.css';
import { useNavigate } from 'react-router-dom';

const publicPath = process.env.PUBLIC_URL;

function Homepage() {

  const navigate = useNavigate();

  return (
    <div className="homepage">

      <button
        className="homepage-button"
        onClick={() => navigate('/hells-quartet/trio')}
      >
        <img
          src={`${publicPath}/images/cerbere_triste.png`}
          alt="trio icon"
          className="homepage-icon"
        />
      </button>

      <button className="homepage-button">
        <img
          src={`${publicPath}/images/gnomes_faches.png`}
          alt="gnomes icon"
          className="homepage-icon"
        />
      </button>

      <button className="homepage-button">
        <img
          src={`${publicPath}/images/mille_pattes_fache.png`}
          alt="centipede icon"
          className="homepage-icon"
        />
      </button>

      <button className="homepage-button">
        <img
          src={`${publicPath}/images/pieuvre_triste_sans_fond.png`}
          alt="octopus icon"
          className="homepage-icon"
        />
      </button>

    </div>
  );
}

export default Homepage;