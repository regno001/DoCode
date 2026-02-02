const params = new URLSearchParams(window.location.search);

const roomId = params.get("room");

document.getElementById("roomCode").innerText ="Class Code :" + roomId;
function sendCode(){
const code = document.getElementById("teacherCode").value;

socket.emit("code-update",{
  roomId,
  code,
});
console.log("code sent to student");
}
//Timer 
let timerInterval;
let timeLeft =300;

function startTimer(){
  timeLeft=300;

  socket.emit("start-timer",{
    roomId,
    time:timeLeft,
  });
  document.getElementById("timeStatus").innerText="Timer Stated (5 miniute)";
}

function stopTimer(){
  socket.emit("stop-Timer",roomId);

  document.getElementById("time-Status").innerText = "Timer Stopped";
}

