document.addEventListener('DOMContentLoaded', () => {
    const btnHost = document.getElementById('btnHost');
    const btnJoin = document.getElementById('btnJoin');
    const roomInput = document.getElementById('roomID');

    // Host: Room ID generate karo aur host.html pe bhejo
    btnHost.addEventListener('click', () => {
        const generatedID = 'LBC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        window.location.href = `host.html?room=${generatedID}`;
    });

    // Join: Input check karo aur student.html pe bhejo
    btnJoin.addEventListener('click', () => {
        const roomID = roomInput.value.trim();
        if (roomID) {
            window.location.href = `student.html?room=${roomID}`;
        } else {
            alert('Please enter a valid Room ID!');
        }
    });
});