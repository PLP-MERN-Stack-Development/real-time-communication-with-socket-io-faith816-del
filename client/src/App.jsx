// src/App.jsx
import { useEffect, useState, useRef } from "react";
import { socket } from "./socket/socket";

export default function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // --- Socket Setup ---
  useEffect(() => {
    if (!isLoggedIn) return;
    socket.connect();

    // ✅ Tell the server who just joined
    socket.emit("join", username);

    // Listen for chat messages
    socket.on("chat message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => socket.disconnect();
  }, [isLoggedIn]);

  // --- Auto Scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send Message ---
  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;
    socket.emit("chat message", { user: username, text: input, to: selectedUser });
    setInput("");
  };

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "40px",
            borderRadius: "20px",
            textAlign: "center",
            width: "320px",
            boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h1 style={{ marginBottom: "20px", color: "#333" }}>Enter your name</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              outline: "none",
              marginBottom: "15px",
              textAlign: "center",
            }}
          />
          <button
            onClick={() => {
              if (username.trim() !== "") setIsLoggedIn(true);
            }}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#007bff",
              color: "white",
              cursor: "pointer",
              width: "100%",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN CHAT ---
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: "url('/chat-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        color: "#0a0a0aff",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "70px",
          padding: "0 20px",
          backgroundColor: "rgba(255,255,255,0.9)",
          boxShadow: "0 2px 10px rgba(2, 1, 1, 0.1)",
          flexShrink: 0,
          overflowX: "auto",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "20px", flexShrink: 0 }}>💬 Chat App</div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginLeft: "auto",
            flexWrap: "nowrap",
          }}
        >
          {["😂", "🥰", "🥹", "🤧", "😎", "🤔"].map((emoji, i) => (
            <div
              key={i}
              onClick={() => setSelectedUser(emoji)}
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "24px",
                cursor: "pointer",
                backgroundColor:
                  selectedUser === emoji
                    ? "rgba(0, 123, 255, 0.2)"
                    : "rgba(255,255,255,0.6)",
                border:
                  selectedUser === emoji ? "2px solid #007bff" : "1px solid #ddd",
                transition: "0.2s",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {selectedUser ? (
            messages
              .filter((msg) => msg.user === selectedUser || msg.user === username)
              .map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.user === username ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    padding: "10px 15px",
                    borderRadius: "18px",
                    backgroundColor:
                      msg.user === username
                        ? "rgba(0, 123, 255, 0.2)"
                        : "rgba(10, 9, 9, 0.7)",
                    boxShadow: "0 2px 5px rgba(7, 6, 6, 0.1)",
                    wordBreak: "break-word",
                  }}
                >
                  <strong>{msg.user}:</strong> {msg.text}
                </div>
              ))
          ) : (
            <div style={{ textAlign: "center", color: "#080707ff", marginTop: "20px" }}>
              👆 Select a user to start chatting
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        {selectedUser && (
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              gap: "10px",
              backgroundColor: "rgba(8, 8, 8, 0.9)",
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "20px",
                border: "1px solid #070606ff",
                outline: "none",
                backgroundColor: "pink",
                colour:"black",
                fontSize:"16px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "10px 18px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}