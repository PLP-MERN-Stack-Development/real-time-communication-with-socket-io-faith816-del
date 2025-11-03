import { io } from "socket.io-client";

// Connect to your backend server
export const socket = io("http://localhost:5000", {
  autoConnect: false, // We'll manually connect when user logs in
  transports: ["websocket"],
});