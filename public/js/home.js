function generateRoomID(){
  return Math.random().toString(36).substring(2,8);
}

//Host

function createRoom(){
  const roomId = generateRoomID();
  socket.emit("create-room" ,roomId);

  socket.once("room-created",(id)=>{
    window.location.href = `host.html?room=${id}`;
  });
}

//Student

function joinClass(){
  const roomId = document.getElementById("roomId").value.trim();

  if(!roomId){
    alert("please Enter correct class code");
    return;
  }

socket.emit("join-room",roomId);

socket.once("room-joined",(id)=>{
  window.location.href=`student.html?room=${id}`;
});
}