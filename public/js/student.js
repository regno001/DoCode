document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const roomID = urlParams.get("room");
  const userName = urlParams.get("name") || "Student";
 
  if (!roomID) {
    window.location.href = "index.html";
    return;
  }

  const socket = io();
  const teacherCode = document.getElementById("TeacherCode");
  let activeLanguage = "JavaScript";
  let teacherCodeHidden = false;
  let latestTeacherCode = "";
  let toastTimer;

  document.getElementById("currentRoom").innerText = roomID;

  socket.emit("join-room", {
    roomID,
    role: "student",
    userName
  });

  socket.on("invalid-room", () => {
    alert("Invalid room ID. Please check with your teacher.");
    window.location.href = "index.html";
  });

  socket.on("room-closed", () => {
    alert("This class has ended.");
    window.location.href = "index.html";
  });

  socket.on("code-update", (data) => {
    latestTeacherCode = data.code;
    teacherCode.value = teacherCodeHidden ? "" : latestTeacherCode;
  });
  socket.on("terminal-update" ,(data)=>{
    document.getElementById("TeacherTerminal").value= data.code;
  });

  socket.on("timer-update", (data) => {
    document.getElementById("timerDisplay").innerText = data.timeLeft;
  });

  socket.on("timer-started", () => {
    showStudentToast("Timer started");
  });

  socket.on("timer-stopped", () => {
    document.getElementById("timerDisplay").innerText = "00:00";
    showStudentToast("Timer stopped");
  });

  socket.on("language-updated", (lang) => {
    activeLanguage = lang;
    document.getElementById("activeLang").innerText = lang;
  });

  socket.on("code-visibility-updated", ({ hidden }) => {
    teacherCodeHidden = hidden;
    teacherCode.value = hidden ? "" : latestTeacherCode;
    teacherCode.placeholder = hidden ? "Teacher code is hidden." : "Waiting for teacher to type...";
  });

  ["copy", "cut", "contextmenu"].forEach((eventName) => {
    teacherCode.addEventListener(eventName, (event) => {
      event.preventDefault();
    });
  });

  teacherCode.addEventListener("keydown", (event) => {
    const isCopyShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c";
    if (isCopyShortcut) {
      event.preventDefault();
    }
  });

  const userMsg = document.getElementById("userMsg");
  const chatBox = document.getElementById("chatBox");

  userMsg.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && userMsg.value.trim() !== "") {
      socket.emit("chat-message", {
        roomID,
        message: userMsg.value,
        sender: userName
      });
      
      userMsg.value = "";
    }
  });

  socket.on("receive-message", (data) => {
    const displayName = data.sender === "Host" ? "Host" : "Student";
    appendMessage(displayName, data.message);
  });

  function appendMessage(sender, message) {
    const div = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = `${sender}: `;
    div.appendChild(name);
    div.append(document.createTextNode(message));
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  document.querySelector(".run button").addEventListener("click", () => {
    socket.emit("run-code", {
      roomID,
      code: document.getElementById("StudentEditor").value,
      language: activeLanguage
    });
  });

  socket.on("code-result", (output) => {
    const terminal = document.getElementById("StudentTerminal");
    terminal.value += `\n> ${output}\n`;
    terminal.scrollTop = terminal.scrollHeight;
  });

  document.getElementById("downloadStudentCode").addEventListener("click", () => {
    downloadCode(
      document.getElementById("StudentEditor").value,
      `student-code${getExtension(activeLanguage)}`
    );
  });

  function getExtension(language) {
    const extensions = {
      JavaScript: ".js",
      Python: ".py",
      C: ".c",
      "C++": ".cpp"
    };
    return extensions[language] || ".txt";
  }

  function downloadCode(code, filename) {
    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function showStudentToast(message) {
    const toast = document.getElementById("studentToast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 1800);
  }

  let lastActivitySent = 0;
  const sendActivity = () => {
    const now = Date.now();
    if (now - lastActivitySent < 5000) return;
    lastActivitySent = now;
    socket.emit("user-activity");
  };

  ["keydown", "input"].forEach((eventName) => {
    document.addEventListener(eventName, sendActivity);
  });
  sendActivity();

});

function toggleChat() {
  document.getElementById("chatFloat").classList.toggle("minimized");
}
