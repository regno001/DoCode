const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get("room");

if (!roomID) {
  window.location.href = "index.html";
}

const displayRoomID = document.getElementById("displayRoomID");
const hostEditor = document.getElementById("HostEditor");
const userMsg = document.getElementById("userMsg");
const chatBox = document.getElementById("chatBox");

displayRoomID.innerText = roomID;

const socket = io("http://localhost:3000");

socket.emit("join-room", {
  roomID,
  role: "host",
  userName: "Host"
});

hostEditor.addEventListener("input", () => {
  socket.emit("code-update", {
    roomID,
    code: hostEditor.value
  });
});

userMsg.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && userMsg.value.trim() !== "") {
    socket.emit("chat-message", {
      roomID,
      message: userMsg.value,
      sender: "Host"
    });
    appendMessage(`<b>You:</b> ${userMsg.value}`);
    userMsg.value = "";
  }
});

socket.on("receive-message", (data) => {
  appendMessage(`<b>${data.sender}:</b> ${data.message}`);
});

function appendMessage(msg) {
  const div = document.createElement("div");
  div.innerHTML = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("Language").addEventListener("change", (e) => {
  socket.emit("language-change", {
    roomID,
    lang: e.target.value
  });
});

let timerInterval;

function startTimer() {
  let timeInSeconds = document.getElementById("Timer").value * 60;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timeInSeconds <= 0) {
      clearInterval(timerInterval);
      socket.emit("stop-timer", { roomID });
      return;
    }

    timeInSeconds--;

    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;

    socket.emit("timer-update", {
      roomID,
      timeLeft: `${mins}:${secs < 10 ? "0" : ""}${secs}`
    });
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  socket.emit("stop-timer", { roomID });
}

function copyRoomID() {
  navigator.clipboard.writeText(roomID);
}
