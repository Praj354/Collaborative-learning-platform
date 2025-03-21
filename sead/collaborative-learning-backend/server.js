require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");
const { verifyGroupMembership } = require("./utils/groupUtils");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true }); // ✅ Use `noServer` mode

// ✅ WebSocket Upgrade Handling (Fixes Subprotocol Issue)
server.on("upgrade", (req, socket, head) => {
  let token = req.headers["sec-websocket-protocol"]; // ✅ Extract token from subprotocol

  if (!token || !token.startsWith("Bearer ")) {
      console.log("❌ WebSocket Authentication Failed: No valid token provided");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
  }

  token = token.split(" ")[1]; // ✅ Extract actual JWT token

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user; // ✅ Attach user data to request
      console.log(`✅ WebSocket Authenticated: User ID ${req.user.id}`);

      wss.handleUpgrade(req, socket, head, (ws) => {
          ws.userId = req.user.id; // ✅ Store user ID in WebSocket connection
          wss.emit("connection", ws, req);
      });
  } catch (err) {
      console.log("❌ WebSocket Authentication Failed: Invalid Token");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
  }
});


// ✅ WebSocket Connection Handling
wss.on("connection", async (ws, req) => {
    console.log("✅ New WebSocket Connection");

    try {
        // 🔹 Extract Token from WebSocket Headers
        const token = ws.protocol; // ✅ Use the protocol to get the token
        if (!token) throw new Error("❌ Authentication required");

        // 🔹 Verify JWT Token
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.user.id;
            ws.userId = userId; // ✅ Store user ID on WebSocket connection
            ws.isAuthenticated = true;
        } catch (err) {
            throw new Error("❌ Invalid authentication");
        }

        ws.isAlive = true; // ✅ Track connection status

        // ✅ Handle WebSocket Messages
        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (!ws.isAuthenticated) {
                    ws.send(JSON.stringify({ error: "❌ Authentication required" }));
                    return ws.close();
                }

                // 🔹 Handle joining a group chat
                if (data.event === "joinGroup") {
                    const isMember = await verifyGroupMembership(ws.userId, data.groupId);
                    if (!isMember) {
                        console.log(`❌ Access Denied: User ${ws.userId} is not in group ${data.groupId}`);
                        ws.send(JSON.stringify({ error: "Access denied: Not a group member" }));
                        return ws.close();
                    }

                    ws.groupId = data.groupId;
                    console.log(`📢 User ${ws.userId} joined group chat: ${data.groupId}`);
                }

                // 🔹 Handle sending messages in a group chat
                if (data.event === "sendMessage") {
                    if (!ws.groupId) {
                        ws.send(JSON.stringify({ error: "❌ You must join a group first" }));
                        return;
                    }

                    console.log(`📩 Message from ${ws.userId} in group ${ws.groupId}: ${data.message}`);

                    // 🔹 Broadcast to all connected clients in the same group
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN && client.groupId === ws.groupId) {
                            client.send(JSON.stringify({ sender: ws.userId, message: data.message }));
                        }
                    });
                }
            } catch (error) {
                console.error("❌ Invalid message format:", error);
                ws.send(JSON.stringify({ error: "❌ Invalid message format" }));
            }
        });

        ws.on("pong", () => (ws.isAlive = true)); // ✅ Keep connection alive
        ws.on("close", () => console.log(`❌ WebSocket Closed for User ${ws.userId || "Unknown"}`));
        ws.on("error", (err) => console.error("❌ WebSocket Error:", err));

    } catch (err) {
        console.error(err.message);
        ws.send(JSON.stringify({ error: err.message }));
        return ws.close();
    }
});

// ✅ Auto-disconnect users removed from study groups
async function removeDisconnectedUsers(groupId, memberId) {
    wss.clients.forEach((client) => {
        if (client.userId === memberId && client.groupId === groupId) {
            client.send(JSON.stringify({ error: "You have been removed from the group" }));
            client.close();
            console.log(`🔴 User ${memberId} disconnected from group ${groupId}`);
        }
    });
}

// ✅ WebSocket Health Check (Detects Disconnected Clients)
setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.isAlive === false) return client.terminate();
        client.isAlive = false;
        client.ping();
    });
}, 30000);

// ✅ Helmet Security (Allow WebSocket connections)
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", "ws://localhost:5000", "wss://localhost:5000"], // WebSocket Allowed
            },
        },
    })
);

// ✅ CORS Middleware (Allows WebSocket & API Requests)
app.use(cors({ origin: "*" }));

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/protected", require("./routes/protectedRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

console.log("Loaded Routes:");
console.log(app._router.stack);

// ✅ Basic API Route
app.get("/", (req, res) => {
    res.send("Collaborative Learning Platform API is running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = { app, server, wss, removeDisconnectedUsers };
