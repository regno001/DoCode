// --- home.js (Sirf Landing Page ke liye) ---

document.addEventListener('DOMContentLoaded', () => {
    const btnHost = document.getElementById('btnHost');
    const btnJoin = document.getElementById('btnJoin');
    const roomInput = document.getElementById('roomID');

    // 1. HOST A CLASS: Naya room create karne ka logic
    if (btnHost) {
        btnHost.addEventListener('click', () => {
            // Ek random 4-digit ID banana (LBC-1234 format mein)
            const randomID = "LBC-" + Math.floor(1000 + Math.random() * 9000);
            
            // Host ko redirect karna ID ke saath
            // URL banega: host.html?room=LBC-4567
            window.location.href = `host.html?room=${randomID}`;
        });
    }

    // 2. JOIN A CLASS: Purana room join karne ka logic
    if (btnJoin) {
       btnJoin.addEventListener("click",()=>{
  const userName = document.getElementById("userName").value.trim();
  const roomID = document.getElementById("roomID").value.trim();

  sessionStorage.setItem("userName",userName);

  window.location.href =
    `student.html?room=${roomID}&name=${encodeURIComponent(userName)}`;
});
    }

    // Enter key dabane par bhi join ho jaye
    if (roomInput) {
        roomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                btnJoin.click();
            }
        });
    }
});
