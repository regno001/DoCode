// --- student.js (For Split-Screen Layout) ---

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomID = urlParams.get('room');
    const socket = io(); // Socket.io connection

    // --- UI ELEMENTS ---
    const teacherCode = document.getElementById('TeacherCode');
    const teacherTerminal = document.getElementById('TeacherTerminal');
    const studentEditor = document.getElementById('StudentEditor');
    const timerDisplay = document.getElementById('timerDisplay');
    const currentRoomElement = document.getElementById('currentRoom');
    const chatBox = document.getElementById('chatBox');
    const userMsg = document.getElementById('userMsg');

    // --- 1. ACCESS CONTROL & INITIALIZATION ---
    if (!roomID) {
        alert("Invalid Access! Please join using a Room ID.");
        window.location.href = "index.html";
        return;
    }

    // Room ID screen par dikhana (Check if element exists first)
    if (currentRoomElement) {
        currentRoomElement.innerText = roomID;
    }

    // --- 2. JOIN ROOM ---
    socket.emit('join-room', { 
        roomID: roomID, 
        role: 'student', 
        userName: 'Student' 
    });

    // --- 3. SYNC TEACHER'S WORK (READ-ONLY) ---
    // Jab teacher code update kare
    socket.on('code-update', (data) => {
        if (teacherCode) {
            teacherCode.value = data.code;
        }
    });

    // Jab teacher terminal update kare
    socket.on('receive-terminal', (data) => {
        if (teacherTerminal) {
            teacherTerminal.value = data.content;
        }
    });

    // --- 4. TIMER LOGIC ---
    socket.on('timer-update', (data) => {
        if (timerDisplay) {
            timerDisplay.innerText = data.timeLeft;
        }
    });

    socket.on('stop-timer', () => {
        if (timerDisplay) {
            timerDisplay.innerText = "00:00";
        }
        alert("Time is up! The session has ended.");
    });

    // --- 5. CHAT SYSTEM ---
    if (userMsg) {
        userMsg.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && userMsg.value.trim() !== "") {
                const message = userMsg.value;
                
                // Server ko bhejo
                socket.emit('chat-message', { roomID, message, sender: 'Student' });
                
                // Khud ke box mein dikhao
                appendMessage(`<b>You:</b> ${message}`);
                userMsg.value = "";
            }
        });
    }

    socket.on('receive-message', (data) => {
        appendMessage(`<b>${data.sender}:</b> ${data.message}`);
    });

    function appendMessage(msg) {
        if (chatBox) {
            const msgDiv = document.createElement('div');
            msgDiv.style.marginBottom = "5px";
            msgDiv.innerHTML = msg;
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
});