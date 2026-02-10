const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const users = {};
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

io.on('connection',(socket)=>{
    console.log('user connected',socket.id);

    socket.on('join-room',({roomID , role , userName})=>{
        socket.join(roomID);
          if(role=== "student"){
            socket.to(roomID).emit("student-joined",{
                socketId:socket.id,
                userName
            
        });
    }
    });
    socket.on("disconnect",()=>{
        const user = users[socket.id];
        if(user){
            socket.to(user.roomID).emit("student-left",{
                socketID:socket.id
            });
            delete users[socket.id];
        }
    })

    socket.on('code-update',(data)=>{
        socket.to(data.roomID).emit('code-update',{code: data.code});
    });
    socket.on('terminal-update',(data)=>{
        socket.to(data.roomID).emit('terminal-update',{code:data.code});
    })

    socket.on('timer-update',(data)=>{
        socket.to(data.roomID).emit('timer-update',{timeLeft: data.timeLeft});
    });

    socket.on('stop-timer',(data)=>{
        socket.to(data.roomID).emit('stop-timer');
    });

    socket.on("language-change", ({roomID,lang})=>{
        console.log("Language change to :",lang ,"in room ",roomID);

        socket.to(roomID).emit("language-updated",lang);
    });

    socket.on('disconnect',()=>{
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT , ()=>{
    console.log(`Server running at http://localhost:${PORT}`);
})