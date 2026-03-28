import './App.css';
import { Route, Routes } from 'react-router-dom';
import Homepage from './Homepage.js';
import Trio from './puzzles/Trio.js';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/hells-quartet" element={<Homepage />} />
        <Route path="/hells-quartet/trio" element={<Trio />} />
      </Routes>
    </div>
  );
}

export default App;