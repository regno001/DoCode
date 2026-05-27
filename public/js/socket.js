// Socket connection
const socket = io();

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});
