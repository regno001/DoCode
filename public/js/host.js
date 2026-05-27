let socket;
let roomID;
let copyToastTimer;
let timerInterval;
let isStudentCodeHidden = false;

const urlParams = new URLSearchParams(window.location.search);
roomID = urlParams.get("room");

if (!roomID) {
  window.location.href = "index.html";
}

function getElement(id) {
  return document.getElementById(id);
}

function setConnectionStatus(message, state) {
  const status = getElement("connectionStatus");
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("online", state === "online");
  status.classList.toggle("offline", state === "offline");
}

function emitSocket(eventName, payload) {
  if (!socket) return;
  socket.emit(eventName, payload);
}

function appendMessage(sender, message) {
  const chatBox = getElement("chatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  const name = document.createElement("b");
  name.textContent = `${sender}: `;
  div.appendChild(name);
  div.append(document.createTextNode(message));
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendTerminalOutput(text) {
  const hostTerminal = getElement("HostTerminal");
  if (!hostTerminal) return;

  const prefix = hostTerminal.value.trim() ? "\n" : "";
  hostTerminal.value += `${prefix}${text}\n`;
  hostTerminal.scrollTop = hostTerminal.scrollHeight;
}

function renderStudent({ socketId, userName, status }) {
  const studentList = getElement("studentList");
  if (!studentList || !socketId) return;

  let div = getElement(socketId);
  if (!div) {
    div = document.createElement("div");
    div.className = "student-item";
    div.id = socketId;
    studentList.appendChild(div);
  }

  div.textContent = userName || "Student";
  const dot = document.createElement("span");
  dot.className = "online-dot";
  dot.style.background = getStatusColor(status);
  div.appendChild(dot);
}

function getStatusColor(status) {
  const colors = {
    green: "#1aff6e",
    yellow: "#facc15",
    red: "#ff0a0a"
  };

  return colors[status] || colors.green;
}

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

function startTimer() {
  let timeInSeconds = parseInt(getElement("Timer").value, 10) * 60;

  clearInterval(timerInterval);
  emitSocket("timer-started", { roomID });

  timerInterval = setInterval(() => {
    if (timeInSeconds <= 0) {
      clearInterval(timerInterval);
      getElement("timerDisplay").innerText = "00:00";
      emitSocket("timer-stopped", { roomID });
      return;
    }

    timeInSeconds--;

    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    const formatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    getElement("timerDisplay").innerText = formatted;
    emitSocket("timer-update", {
      roomID,
      timeLeft: formatted
    });
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  getElement("timerDisplay").innerText = "00:00";
  emitSocket("timer-stopped", { roomID });
}

function copyRoomID() {
  navigator.clipboard.writeText(roomID);
  showCopyToast();
}

function showCopyToast() {
  const copyToast = getElement("copyToast");
  if (!copyToast) return;

  clearTimeout(copyToastTimer);
  copyToast.classList.add("show");
  copyToastTimer = setTimeout(() => {
    copyToast.classList.remove("show");
  }, 1800);
}

window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.copyRoomID = copyRoomID;

function applyStudentCodeVisibility(hidden) {
  const toggleStudentCode = getElement("toggleStudentCode");
  isStudentCodeHidden = !!hidden;

  if (toggleStudentCode) {
    toggleStudentCode.textContent = isStudentCodeHidden ? "Unhide" : "Hide";
    toggleStudentCode.classList.toggle("active", isStudentCodeHidden);
  }
}

function setupHost(socketOrigin) {
  const displayRoomID = getElement("displayRoomID");
  const hostEditor = getElement("HostEditor");
  const hostTerminal = getElement("HostTerminal");
  const userMsg = getElement("userMsg");
  const studentList = getElement("studentList");
  const downloadHostCode = getElement("downloadHostCode");
  const toggleStudentCode = getElement("toggleStudentCode");
  const languageSelect = getElement("Language");
  const runButton = document.querySelector(".run button");

  displayRoomID.innerText = roomID;

  socket = io(socketOrigin);

  socket.on("connect", () => {
    setConnectionStatus("Online", "online");
    socket.emit("join-room", {
      roomID,
      role: "host",
      userName: "Host"
    });

    if (hostEditor.value) {
      socket.emit("code-update", {
        roomID,
        code: hostEditor.value
      });
    }
  });

  socket.on("disconnect", () => {
    setConnectionStatus("Offline", "offline");
  });

  socket.on("connect_error", () => {
    setConnectionStatus("Server offline", "offline");
  });

  hostEditor.addEventListener("input", () => {
    emitSocket("code-update", {
      roomID,
      code: hostEditor.value
    });
  });

  hostTerminal.addEventListener("input", () => {
    emitSocket("terminal-update", {
      roomID,
      code: hostTerminal.value
    });
  });

  userMsg.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && userMsg.value.trim() !== "") {
      emitSocket("chat-message", {
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

  languageSelect.addEventListener("change", (event) => {
    const lang = event.target.value;

    hostEditor.value = window.getBoilerplate ? window.getBoilerplate(lang) : "";

    emitSocket("language-change", {
      roomID,
      lang
    });

    emitSocket("code-update", {
      roomID,
      code: hostEditor.value
    });
  });

  downloadHostCode.addEventListener("click", () => {
    const language = languageSelect.value;
    downloadCode(hostEditor.value, `host-code${getExtension(language)}`);
  });

  toggleStudentCode.addEventListener("click", () => {
    const nextHiddenState = !isStudentCodeHidden;
    applyStudentCodeVisibility(nextHiddenState);
    emitSocket("code-visibility-change", {
      roomID,
      hidden: nextHiddenState
    });
  });

  socket.on("code-visibility-updated", ({ hidden }) => {
    applyStudentCodeVisibility(hidden);
  });

  socket.on("student-list", (students = []) => {
    studentList.innerHTML = "";
    students.forEach(renderStudent);
  });

  socket.on("student-joined", renderStudent);

  socket.on("student-left", ({ socketId }) => {
    const el = getElement(socketId);
    if (el) el.remove();
  });

  runButton.addEventListener("click", () => {
    emitSocket("run-code", {
      roomID,
      code: hostEditor.value,
      language: languageSelect.value
    });
  });

  socket.on("code-result", (output) => {
    appendTerminalOutput(`> ${output}`);
  });

  socket.on("student-code-result", ({ userName, output }) => {
    appendTerminalOutput(`${userName || "Student"} > ${output}`);
  });

  socket.on("user-status", ({ socketId, status }) => {
    const student = getElement(socketId);
    if (!student) return;

    const dot = student.querySelector(".online-dot");
    if (dot) {
      dot.style.background = getStatusColor(status);
    }
  });
}

function showStartupError(error) {
  setConnectionStatus("Server offline", "offline");
  appendTerminalOutput("Could not connect to the DoCode server. Start it with npm.cmd start and open http://localhost:3000.");
  console.error(error);
}

window.DoCodeSocketReady
  .then(setupHost)
  .catch(showStartupError);
