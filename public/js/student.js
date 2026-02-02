const socket = io();

const codeDisplay = document.getElementById('codeDisplay');
const terminalDisplay = document.getElementById('terminalDisplay');
const displayRoomID = document.getElementById('displayRoomID');

const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get('room');
displayRoomID.innerText = roomID;

// Join Room
socket.emit('join-room', { roomID, role: 'student' });

// Receive Code Updates
socket.on('receive-code', (code) => {
    codeDisplay.value = code;
});

// Receive Terminal Updates
socket.on('receive-terminal', (content) => {
    terminalDisplay.value = content;
});