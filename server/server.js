// --- server.js ---
// Basic Socket.IO chat server setup

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend Vite dev server
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// --- Test Route ---
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});

// --- Socket.IO Logic ---
const users = {}; // Store connected users

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When user joins with a username
  socket.on("join", (username) => {
    users[socket.id] = username;
    console.log(`${username} joined the chat`);
    io.emit("user list", Object.values(users)); // Send updated user list to everyone
  });

  // When a message is sent
  socket.on("chat message", (msg) => {
    console.log("Message received:", msg);
    io.emit("chat message", msg); // Broadcast to all users
  });

  // When user disconnects
  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    console.log(`${username || "A user"} disconnected`);
    io.emit("user list", Object.values(users)); // Update user list
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});