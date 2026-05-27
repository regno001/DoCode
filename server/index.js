const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { exec } = require("child_process"); 
const fs = require("fs"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const users = {};
const hosts = {};
const activeRooms = new Set();
const userActivity = {};
const roomCode = {}; 
const roomCodeHidden = {};
const roomStudents = {};
const hostCloseTimers = {};

app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

io.on("connection", (socket) => {
    socket.on("join-room", ({ roomID, role, userName }) => {
        if (role === "host") {
            if (hostCloseTimers[roomID]) {
                clearTimeout(hostCloseTimers[roomID]);
                delete hostCloseTimers[roomID];
            }

            activeRooms.add(roomID);
            socket.join(roomID);
            hosts[socket.id] = { roomID };
            socket.emit("student-list", Object.values(roomStudents[roomID] || {}));
            socket.emit("code-visibility-updated", { hidden: !!roomCodeHidden[roomID] });

            if (roomCode[roomID]) {
                socket.emit("code-update", { code: roomCode[roomID] });
            }

            return;
        }
        if (role === "student") {
            if (!activeRooms.has(roomID)) {
                socket.emit("invalid-room");
                return;
            }
            socket.join(roomID);
            users[socket.id] = { roomID, userName };
            if (!roomStudents[roomID]) roomStudents[roomID] = {};
            roomStudents[roomID][socket.id] = {
                socketId: socket.id,
                userName,
                status: "green"
            };
            socket.emit("code-visibility-updated", { hidden: !!roomCodeHidden[roomID] });

            if (roomCode[roomID]) {
                socket.emit("code-update", { code: roomCode[roomID] });
            }
            userActivity[socket.id] = Date.now();
            socket.to(roomID).emit("student-joined", { socketId: socket.id, userName });
        }
    });

    socket.on("run-code", ({ roomID, code, language }) => {
        let command = "";
        const safeSocketId = socket.id.replace(/[^a-zA-Z0-9_-]/g, "");
        let filename = `temp_${safeSocketId}`;
        let outputFile = "";
        const binaryExtension = process.platform === "win32" ? ".exe" : ".out";
        switch (language) {
            case "JavaScript": filename += ".js"; command = `node "${filename}"`; break;
            case "Python": filename += ".py"; command = `python "${filename}"`; break;
            case "C":
                filename += ".c";
                outputFile = `${filename}${binaryExtension}`;
                command = `gcc "${filename}" -o "${outputFile}" && "${process.platform === "win32" ? outputFile : `./${outputFile}`}"`;
                break;
            case "C++":
                filename += ".cpp";
                outputFile = `${filename}${binaryExtension}`;
                command = `g++ "${filename}" -o "${outputFile}" && "${process.platform === "win32" ? outputFile : `./${outputFile}`}"`;
                break;
            default: socket.emit("code-result", "Language not supported."); return;
        }
        const filePath = path.join(__dirname, filename);
        const outputPath = outputFile ? path.join(__dirname, outputFile) : "";

        fs.writeFile(filePath, code, (err) => {
            if (err) return socket.emit("code-result", "Error: File creation failed.");
            exec(command, {
                 timeout: 5000,
                 cwd: __dirname,
                 maxBuffer: 1024 * 1024
             }, (error, stdout, stderr) => {
                let output = error ? stderr || error.message : stdout || "Success (No output).";
                socket.emit("code-result", output);
                if (hosts[socket.id]) {
                    io.to(roomID).emit("terminal-update", { code: output });
                } else if (users[socket.id]) {
                    socket.to(roomID).emit("student-code-result", {
                        userName: users[socket.id].userName || "Student",
                        output
                    });
                }
                fs.unlink(filePath, () => {});
                if (outputPath && fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
            });
        });
    });

    socket.on("code-update", ({ roomID, code }) => {
        roomCode[roomID] = code; 
        socket.to(roomID).emit("code-update", { code });
    });

    socket.on("terminal-update", ({ roomID, code }) => {
        socket.to(roomID).emit("terminal-update", { code });
    });

    socket.on("chat-message", ({ roomID, message, sender }) => {
        io.to(roomID).emit("receive-message", { sender, message });
    });

    socket.on("timer-update", ({ roomID, timeLeft }) => {
        socket.to(roomID).emit("timer-update", { timeLeft });
    });

    socket.on("timer-started", ({ roomID }) => {
        socket.to(roomID).emit("timer-started");
    });

    socket.on("timer-stopped", ({ roomID }) => {
        socket.to(roomID).emit("timer-stopped");
    });

    socket.on("stop-timer", ({ roomID }) => {
        socket.to(roomID).emit("timer-stopped");
    });

    socket.on("language-change", ({ roomID, lang }) => {
        socket.to(roomID).emit("language-updated", lang);
    });

    socket.on("code-visibility-change", ({ roomID, hidden }) => {
        roomCodeHidden[roomID] = !!hidden;
        io.to(roomID).emit("code-visibility-updated", { hidden: !!hidden });
    });

    socket.on("disconnect", () => {
        const host = hosts[socket.id];
        if (host) {
            const closingRoomID = host.roomID;
            delete hosts[socket.id];

            hostCloseTimers[closingRoomID] = setTimeout(() => {
                activeRooms.delete(closingRoomID);
                delete roomCode[closingRoomID];
                delete roomCodeHidden[closingRoomID];
                delete roomStudents[closingRoomID];
                io.to(closingRoomID).emit("room-closed");
                delete hostCloseTimers[closingRoomID];
            }, 5000);
        }

        const user = users[socket.id];
        if (user) {
            if (roomStudents[user.roomID]) {
                delete roomStudents[user.roomID][socket.id];
                if (Object.keys(roomStudents[user.roomID]).length === 0) {
                    delete roomStudents[user.roomID];
                }
            }

            socket.to(user.roomID).emit("student-left", { socketId: socket.id });
            delete users[socket.id];
            delete userActivity[socket.id];
        }
    });

    socket.on("user-activity", () => {
        userActivity[socket.id] = Date.now();
    });
});

setInterval(() => {
    const now = Date.now();
    for (let socketId in users) {
        const lastActive = userActivity[socketId] || now;
        const diff = (now - lastActive) / 1000;
        let status = diff >= 300 ? "red" : (diff >= 180 ? "yellow" : "green");
        const roomID = users[socketId].roomID;
        if (roomStudents[roomID] && roomStudents[roomID][socketId]) {
            roomStudents[roomID][socketId].status = status;
        }
        io.to(users[socketId].roomID).emit("user-status", { socketId, status });
    }
}, 5000);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST;

if (HOST) {
    server.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });
} else {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
