import React, { useEffect, useState } from "react";
import socket from "../websocketClient"; // ✅ Import WebSocket client

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // ✅ Listen for messages from WebSocket server
    useEffect(() => {
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prev) => [...prev, message]); // ✅ Append new messages
        };

        return () => socket.close(); // ✅ Close WebSocket when component unmounts
    }, []);

    // ✅ Function to send a new message
    const sendMessage = () => {
        if (newMessage.trim() === "") return;

        const messageData = { event: "sendMessage", message: newMessage };
        socket.send(JSON.stringify(messageData)); // ✅ Send message
        setNewMessage(""); // Clear input field
    };

    return (
        <div>
            <h2>Group Chat</h2>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg.message}</li>
                ))}
            </ul>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
