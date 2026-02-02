const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// 🔥 serve public folder
app.use(express.static(path.join(__dirname, "../public")));

// socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", (roomId) => {
    socket.join(roomId);
    socket.role = "host";
    console.log("Room created:", roomId);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.role = "student";
    console.log("Joined room:", roomId);
  });

  socket.on("code-update", (data) => {
    socket.to(data.roomId).emit("receive-code", data.code);
  });
});

// start server
server.listen(5000, () => {
  console.log("✅ Server running at http://localhost:5000");
});
