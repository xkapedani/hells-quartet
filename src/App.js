import "./App.css";
import { Route, Routes } from "react-router-dom";
import Homepage from "./Homepage.js";
import Trio from "./puzzles/Trio.js";
import Drums from "./puzzles/Drums.js";

function App() {
    return (
        <div className="App">
            <Routes>
                <Route path="/hells-quartet" element={<Homepage />} />
                <Route path="/hells-quartet/trio" element={<Trio />} />
                <Route path="/hells-quartet/drums" element={<Drums />} />
                {/* Catch-all redirects to homepage */}
                <Route path="*" element={<Homepage />} />
            </Routes>
        </div>
    );
}

export default App;
