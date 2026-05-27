const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get("room");

if (!roomID) {
  window.location.href = "index.html";
}

const displayRoomID = document.getElementById("displayRoomID");
const hostEditor = document.getElementById("HostEditor");
const hostTerminal = document.getElementById("HostTerminal");
const userMsg = document.getElementById("userMsg");
const chatBox = document.getElementById("chatBox");
const studentList = document.getElementById("studentList");
const copyToast = document.getElementById("copyToast");
const downloadHostCode = document.getElementById("downloadHostCode");
const toggleStudentCode = document.getElementById("toggleStudentCode");
let copyToastTimer;
let isStudentCodeHidden = false;

displayRoomID.innerText = roomID;

const socket = io();

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
hostTerminal.addEventListener("input",()=>{
  socket.emit("terminal-update",{
  roomID,
  code:hostTerminal.value    
  })
})

userMsg.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && userMsg.value.trim() !== "") {
    socket.emit("chat-message", {
      roomID,
      message: userMsg.value,
      sender: "Host"
    });
    userMsg.value = "";
  }
});


socket.on("receive-message", (data) => {
  appendMessage(data.sender, data.message);
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



document.getElementById("Language").addEventListener("change", (e) => {
  const lang = e.target.value;

  hostEditor.value = getBoilerplate(lang);

  socket.emit("language-change", {
    roomID,
    lang
  });

  socket.emit("code-update", {
    roomID,
    code: hostEditor.value
  });
});

downloadHostCode.addEventListener("click", () => {
  const language = document.getElementById("Language").value;
  downloadCode(hostEditor.value, `host-code${getExtension(language)}`);
});

toggleStudentCode.addEventListener("click", () => {
  isStudentCodeHidden = !isStudentCodeHidden;
  toggleStudentCode.textContent = isStudentCodeHidden ? "Unhide" : "Hide";
  socket.emit("code-visibility-change", {
    roomID,
    hidden: isStudentCodeHidden
  });
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

let timerInterval;

function startTimer() {

  let timeInSeconds =
    parseInt(document.getElementById("Timer").value) * 60;

  clearInterval(timerInterval);
  socket.emit("timer-started", { roomID });

  timerInterval = setInterval(() => {

    if (timeInSeconds <= 0) {
      clearInterval(timerInterval);

      document.getElementById("timerDisplay").innerText = "00:00";

      socket.emit("timer-stopped", { roomID });

      return;
    }

    timeInSeconds--;

    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;

    const formatted =
      `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    document.getElementById("timerDisplay").innerText = formatted;

    socket.emit("timer-update", {
      roomID,
      timeLeft: formatted
    });

  }, 1000);
}


function stopTimer() {
  clearInterval(timerInterval);
  document.getElementById("timerDisplay").innerText = "00:00";
  socket.emit("timer-stopped", { roomID });
}

function copyRoomID() {
  navigator.clipboard.writeText(roomID);
  showCopyToast();
}

function showCopyToast() {
  if (!copyToast) return;
  clearTimeout(copyToastTimer);
  copyToast.classList.add("show");
  copyToastTimer = setTimeout(() => {
    copyToast.classList.remove("show");
  }, 1800);
}

socket.on("student-joined", ({ socketId, userName }) => {

  if (document.getElementById(socketId)) return;

  const div = document.createElement("div");
  div.className = "student-item";
  div.id = socketId;
  div.append(document.createTextNode(userName || "Student"));
  const dot = document.createElement("span");
  dot.className = "online-dot";
  div.appendChild(dot);

  document.getElementById("studentList").appendChild(div);
});

socket.on("student-left", ({ socketId }) => {
  const el = document.getElementById(socketId);
  if (el) el.remove();
});

document.querySelector(".run button").addEventListener("click", () => {
  const language = document.getElementById("Language").value;

  socket.emit("run-code", {
    roomID,
    code: hostEditor.value,
    language
  });
});

socket.on("code-result", (output) => {
  appendTerminalOutput(`> ${output}`);
});

socket.on("student-code-result", ({ userName, output }) => {
  appendTerminalOutput(`${userName || "Student"} > ${output}`);
});

function appendTerminalOutput(text) {
  const prefix = hostTerminal.value.trim() ? "\n" : "";
  hostTerminal.value += `${prefix}${text}\n`;
  hostTerminal.scrollTop = hostTerminal.scrollHeight;
}

socket.on("user-status", ({ socketId, status }) => {
  const student = document.getElementById(socketId);

  if (!student) return;

  const dot = student.querySelector(".online-dot");

  if (dot) {
    const colors = {
      green: "#1aff6e",
      yellow: "#facc15",
      red: "#ff0a0a"
    };
    dot.style.background = colors[status] || colors.red;
  }
});


