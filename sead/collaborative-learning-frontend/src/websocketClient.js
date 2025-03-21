const token = localStorage.getItem("jwtToken"); // Retrieve JWT from localStorage

// ✅ Ensure the token is passed in the correct format
const socket = new WebSocket("ws://localhost:5000", token ? [`Bearer ${token}`] : []);

// ✅ Handle WebSocket events
socket.onopen = () => {
    console.log("✅ WebSocket Connected");
    socket.send(JSON.stringify({ event: "joinGroup", groupId: "YOUR_GROUP_ID" })); // Replace with actual groupId
};

socket.onmessage = (event) => {
    console.log("📩 Message Received:", event.data);
};

socket.onerror = (error) => {
    console.error("❌ WebSocket Error:", error);
};

socket.onclose = () => {
    console.log("❌ WebSocket Closed");
};

export default socket;
