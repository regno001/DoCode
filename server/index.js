const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};
const activeRooms = new Set();

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomID, role, userName }) => {

    if (role === "host") {
      activeRooms.add(roomID);
      socket.join(roomID);
      return;
    }

    if (role === "student") {

      if (!activeRooms.has(roomID)) {
        socket.emit("invalid-room");
        return;
      }

      socket.join(roomID);

      users[socket.id] = {
        roomID,
        userName
      };

      socket.to(roomID).emit("student-joined", {
        socketId: socket.id,
        userName
      });

      return;
    }

  });

  socket.on("disconnect", () => {

    const user = users[socket.id];

    if (user) {

      socket.to(user.roomID).emit("student-left", {
        socketId: socket.id
      });

      delete users[socket.id];
    }

    console.log("User disconnected:", socket.id);
  });

  socket.on("code-update", ({ roomID, code }) => {
    socket.to(roomID).emit("code-update", { code });
  });

  socket.on("terminal-update", ({ roomID, code }) => {
    socket.to(roomID).emit("terminal-update", { code });
  });

  socket.on("timer-update", ({ roomID, timeLeft }) => {
    socket.to(roomID).emit("timer-update", { timeLeft });
  });

  socket.on("stop-timer", ({ roomID }) => {
    socket.to(roomID).emit("timer-stopped");
  });

  socket.on("language-change", ({ roomID, lang }) => {
    socket.to(roomID).emit("language-updated", lang);
  });

  socket.on("chat-message", ({ roomID, message, sender }) => {
    socket.to(roomID).emit("receive-message", {
      sender,
      message
    });
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
