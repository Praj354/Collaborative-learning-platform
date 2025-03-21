import React from "react";
import Chat from "./components/Chat"; // ✅ Import Chat Component

function App() {
    return (
        <div className="App">
            <h1>Collaborative Learning Platform</h1>
            <Chat /> {/* ✅ Embed Chat component */}
        </div>
    );
}

export default App;
