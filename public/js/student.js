document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const roomID = urlParams.get("room");

  if (!roomID) {
    window.location.href = "index.html";
    return;
  }

  const socket = io("http://localhost:3000");

  document.getElementById("currentRoom").innerText = roomID;

  socket.emit("join-room", {
    roomID,
    role: "student",
    userName: "Student"
  });

  socket.on("code-update", (data) => {
    document.getElementById("TeacherCode").value = data.code;
  });
  socket.on("terminal-update" ,(data)=>{
    document.getElementById("TeacherTerminal").value= data.code;
  });

  socket.on("timer-update", (data) => {
    document.getElementById("timerDisplay").innerText = data.timeLeft;
  });

  socket.on("timer-stopped", () => {
    
    document.getElementById("timerDisplay").innerText = "00:00";
  });

  socket.on("language-updated", (lang) => {
    document.getElementById("activeLang").innerText = lang;
  });

  const userMsg = document.getElementById("userMsg");
  const chatBox = document.getElementById("chatBox");

  userMsg.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && userMsg.value.trim() !== "") {
      socket.emit("chat-message", {
        roomID,
        message: userMsg.value,
        sender: "Student"
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

});

function toggleChat() {
  document.getElementById("chatFloat").classList.toggle("minimized");
}
