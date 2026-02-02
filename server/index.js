io.on("connection",(socket)=>{
  socket.on("create-room",(roomId)=>{
    socket.join(roomId);
    socket.role = "host";
  })


socket.on("join-room" , (roomId)=>{
  socket.join(roomId);
  socket.role="student";
});


socket.on("code-update",(data)=>{
  socket.io(data.roomId).emit("receive-code",data.code);
});

});