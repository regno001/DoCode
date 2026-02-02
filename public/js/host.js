const params = new URLSearchParams(window.location.search);

const roomId = params.get("room");

document.getElementById("roomInfo").innerText ="Class Code :" + roomId;

const editor = document.getElementById("teacherEditor");

//teacher types code 

editor.addEventListener("input",()=>{
  const code=editor.values;

  socket.emit("code-update",{
    roomId:roomId,
    code:code,
  })
})