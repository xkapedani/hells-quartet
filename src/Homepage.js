// four buttons on the homepage, each with an icon and a label
import React from 'react';
import './Homepage.css';

function Homepage() {
  return (
    <div className="homepage">
      <button className="homepage-button">
        <span>drummer</span>
      </button>
      <button className="homepage-button">
        <span>guitarist</span>
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