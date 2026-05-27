let socket;
let roomID;
let userName;
let activeLanguage = "JavaScript";
let teacherCodeHidden = false;
let latestTeacherCode = "";
let toastTimer;
let lastActivitySent = 0;

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
  const toast = getElement("studentToast");
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function sendActivity() {
  const now = Date.now();
  if (now - lastActivitySent < 5000) return;
  lastActivitySent = now;
  emitSocket("user-activity");
}

function applyTeacherCodeVisibility(hidden) {
  const teacherCode = getElement("TeacherCode");
  if (!teacherCode) return;

  teacherCodeHidden = !!hidden;
  teacherCode.value = teacherCodeHidden ? "" : latestTeacherCode;
  teacherCode.placeholder = teacherCodeHidden ? "Teacher code is hidden by the host." : "Waiting for teacher to type...";
  teacherCode.classList.toggle("code-hidden", teacherCodeHidden);
}

function setupStudent(socketOrigin) {
  const urlParams = new URLSearchParams(window.location.search);
  roomID = urlParams.get("room");
  userName = urlParams.get("name") || sessionStorage.getItem("userName") || "Student";

  if (!roomID) {
    window.location.href = "index.html";
    return;
  }

  const teacherCode = getElement("TeacherCode");
  const teacherTerminal = getElement("TeacherTerminal");
  const userMsg = getElement("userMsg");
  const studentEditor = getElement("StudentEditor");
  const studentTerminal = getElement("StudentTerminal");
  const runButton = document.querySelector(".run button");
  const downloadStudentCode = getElement("downloadStudentCode");

  getElement("currentRoom").innerText = roomID;

  socket = io(socketOrigin);

  socket.on("connect", () => {
    setConnectionStatus("Online", "online");
    socket.emit("join-room", {
      roomID,
      role: "student",
      userName
    });
    sendActivity();
  });

  socket.on("disconnect", () => {
    setConnectionStatus("Offline", "offline");
  });

  socket.on("connect_error", () => {
    setConnectionStatus("Server offline", "offline");
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
    latestTeacherCode = data.code || "";
    teacherCode.value = teacherCodeHidden ? "" : latestTeacherCode;
  });

  socket.on("terminal-update", (data) => {
    teacherTerminal.value = data.code || "";
  });

  socket.on("timer-update", (data) => {
    getElement("timerDisplay").innerText = data.timeLeft;
  });

  socket.on("timer-started", () => {
    showStudentToast("Timer started");
  });

  socket.on("timer-stopped", () => {
    getElement("timerDisplay").innerText = "00:00";
    showStudentToast("Timer stopped");
  });

  socket.on("language-updated", (lang) => {
    activeLanguage = lang;
    getElement("activeLang").innerText = lang;
  });

  socket.on("code-visibility-updated", ({ hidden }) => {
    applyTeacherCodeVisibility(hidden);
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

  userMsg.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && userMsg.value.trim() !== "") {
      emitSocket("chat-message", {
        roomID,
        message: userMsg.value,
        sender: userName
      });

      userMsg.value = "";
    }
  });

  socket.on("receive-message", (data) => {
    appendMessage(data.sender || "Student", data.message);
  });

  runButton.addEventListener("click", () => {
    emitSocket("run-code", {
      roomID,
      code: studentEditor.value,
      language: activeLanguage
    });
  });

  socket.on("code-result", (output) => {
    studentTerminal.value += `\n> ${output}\n`;
    studentTerminal.scrollTop = studentTerminal.scrollHeight;
  });

  downloadStudentCode.addEventListener("click", () => {
    downloadCode(studentEditor.value, `student-code${getExtension(activeLanguage)}`);
  });

  ["keydown", "input"].forEach((eventName) => {
    document.addEventListener(eventName, sendActivity);
  });
}

function showStartupError(error) {
  setConnectionStatus("Server offline", "offline");
  showStudentToast("Start the DoCode server and open http://localhost:3000.");
  console.error(error);
}

function toggleChat() {
  getElement("chatFloat").classList.toggle("minimized");
}

window.toggleChat = toggleChat;

window.DoCodeSocketReady
  .then(setupStudent)
  .catch(showStartupError);
