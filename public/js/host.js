const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get('room');
const displayRoomID= document.getElementById("displayRoomID");
const hostEditor = document.getElementById("HostEditor");
const userMsg = document.getElementById("userMsg");
const chatBox = document.getElementById("chatBox");

if(!roomID){
  alert("Please Create A roomID or Enter a RoomID");
  window.location.href("index.html");
}else{
  if(displayRoomID) displayRoomID.innerText = roomID;

}

const socket=io();
socket.emit('join-room',{
  roomID:roomID,
  role:'host',
  userName:'Host'
});

hostEditor.addEventListener('input',()=>{
  const code = hostEditor.value;
  socket.emit('code-update',{roomID,code});

});

userMsg.addEventListener('keypress',(e)=>{
  if(e.key ==='Enter' && userMsg.value.trim()!==""){
    const message = userMsg.value;

    socket.emit('chat-message',{roomID,message,sender:'Host'});

    appendMessage(`<b>You:</b>${message}`);
    userMsg.value="";
  }
});

socket.on('receive-message',(data)=>{
  appendMessage(`<b>${data.sender}:</b>${data.message}`);
});

function appendMessage(msg){
  let msgElement = document.createElement('div');
  msgElement=document.createElement('div');
  msgElement.innerHTML=msg;
  chatBox.appendChild(msgElement);
  chatBox.scrollTop=chatBox.scrollHeight;
}

function copyRoomID(){
  const idText = displayRoomID.innerText;
  navigator.clipboard.writeText(idText).then(()=>{
    alert("RoomId Has Been Copied"+idText);
  });
}

document.getElementById('Language').addEventListener('change',(e)=>{
  const selectedLang = e.target.value;
  socket.emit('language-change',{roomID, lang:selectedLang });;
});

let timerInterval;

function startTimer(){
  const miniutes =document.getElementById('Timer').value;
  let timeInSeconds = miniutes*60;

  clearInterval(timerInterval);

  timerInterval = setInterval(()=>{
    if(timeInSeconds<=0){
      clearInterval(timerInterval);
      socket.emit('stop-timer',{roomID});
      alert("Time's Up! Timer is Stopped");
      return;
     
    }
     timeInseconds--;
    let mins = Math.floor(timeInSeconds/60);
    let secs = timeInSeconds%60;

    console.log(`Time Left :${mins}:${res<10?'0':''}${secs}`);

    socket.emit('timer-update',{
      roomID,
      timeLeft:`${mins}:${secs<10?'0':''}${secs}`
    });

  },1000);
}

function stopTimer(){
  clearInterval(timerInterval);
  socket.emit('stop-timer',{roomID});
}