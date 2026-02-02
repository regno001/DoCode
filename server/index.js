const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a specific room
    socket.on('join-room', ({ roomID, role }) => {
        socket.join(roomID);
        console.log(`User ${socket.id} joined room: ${roomID} as ${role}`);
    });

    // Sync Code from Host to Students
    socket.on('code-update', (data) => {
        // Broadcast only to others in the same room
        socket.to(data.roomID).emit('receive-code', data.code);
    });

    // Sync Terminal from Host to Students
    socket.on('terminal-update', (data) => {
        socket.to(data.roomID).emit('receive-terminal', data.content);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});