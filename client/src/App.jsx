// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "./socket/socket";

export default function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // username or "All"
  const [messages, setMessages] = useState([]); // {id,user,text,to,timestamp,delivered,read}
  const [users, setUsers] = useState([]); // usernames
  const [typingFrom, setTypingFrom] = useState(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const getEmojiFor = useMemo(() => {
    const emojis = ["😂","🥰","🥹","🤧","😎","🤔","🦄","🐱","🦊","🐼","🐸","🦋","🌈","⭐","🔥","🎧","🧠","🎯"];
    const cache = new Map();
    return (u) => {
      if (!u) return "👤";
      if (cache.has(u)) return cache.get(u);
      const idx = Math.abs([...u].reduce((a,c)=>a+c.charCodeAt(0),0)) % emojis.length;
      const e = emojis[idx];
      cache.set(u, e);
      return e;
    };
  }, []);

  // --- Socket Setup ---
  useEffect(() => {
    if (!isLoggedIn) return;
    socket.connect();

    socket.emit("join", username);

    socket.on("user list", (list) => setUsers(list));
    socket.on("chat message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("typing", (payload) => {
      if (payload?.from !== username) setTypingFrom(payload.from);
    });
    socket.on("stop typing", () => setTypingFrom(null));
    socket.on("message delivered", ({ id }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, delivered: true } : m)));
    });
    socket.on("message read", ({ id }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    });

    return () => {
      socket.off("user list");
      socket.off("chat message");
      socket.off("typing");
      socket.off("stop typing");
      socket.off("message delivered");
      socket.off("message read");
      socket.disconnect();
    };
  }, [isLoggedIn, username]);

  // --- Auto Scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send Message ---
  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = new Date().toISOString();
    const payload = {
      id,
      user: username,
      text: input,
      to: selectedUser === "All" ? null : selectedUser,
      timestamp,
    };
    socket.emit("chat message", payload);
    setMessages((prev) => [...prev, payload]);
    setInput("");
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    const to = selectedUser === "All" ? null : selectedUser;
    if (value.length > 0) socket.emit("typing", { from: username, to });
    else socket.emit("stop typing", { from: username, to });
  };

  const filteredMessages = useMemo(() => {
    if (!selectedUser) return [];
    if (selectedUser === "All") return messages.filter((m) => !m.to);
    return messages.filter(
      (m) => (m.user === username && m.to === selectedUser) || (m.user === selectedUser && m.to === username)
    );
  }, [messages, selectedUser, username]);

  // mark read when viewing
  useEffect(() => {
    if (!selectedUser) return;
    const unreadFromOther = filteredMessages.filter((m) => m.user !== username && !m.read);
    unreadFromOther.forEach((m) => socket.emit("message read", { id: m.id, from: m.user, to: username }));
  }, [filteredMessages, selectedUser, username]);

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
          {["All", ...users.filter((u) => u !== username)].map((u) => (
            <div
              key={u}
              onClick={() => setSelectedUser(u)}
              title={u}
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
                  selectedUser === u ? "rgba(0, 123, 255, 0.2)" : "rgba(255,255,255,0.6)",
                border: selectedUser === u ? "2px solid #007bff" : "1px solid #ddd",
                transition: "0.2s",
              }}
            >
              {u === "All" ? "🌐" : getEmojiFor(u)}
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
            filteredMessages.map((msg, i) => (
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
                        : "rgba(255, 255, 255, 0.8)",
                    boxShadow: "0 2px 5px rgba(7, 6, 6, 0.1)",
                    wordBreak: "break-word",
                  }}
                >
                  <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4 }}>
                    {msg.user} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                  </div>
                  <div>{msg.text}</div>
                  {msg.user === username && (
                    <div style={{ fontSize: "11px", opacity: 0.6, marginTop: 4 }}>
                      {msg.read ? "Read" : msg.delivered ? "Delivered" : "Sending..."}
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div style={{ textAlign: "center", color: "#080707ff", marginTop: "20px" }}>
              👆 Select a user to start chatting
            </div>
          )}
          {typingFrom && selectedUser !== "All" && typingFrom === selectedUser && (
            <div style={{ fontSize: 12, color: "#333" }}>{typingFrom} is typing...</div>
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
              onChange={handleInputChange}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "20px",
                border: "1px solid #070606ff",
                outline: "none",
                backgroundColor: "rgba(255,255,255,0.95)",
                color: "#111",
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