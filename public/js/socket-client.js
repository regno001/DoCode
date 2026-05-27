(() => {
  const candidates = [];
  const query = new URLSearchParams(window.location.search);
  const explicitServer = query.get("server");

  function addCandidate(origin) {
    if (!origin || candidates.includes(origin)) return;
    candidates.push(origin.replace(/\/$/, ""));
  }

  addCandidate(explicitServer);

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    addCandidate(window.location.origin);

    if (window.location.port && window.location.port !== "3000") {
      addCandidate(`${window.location.protocol}//${window.location.hostname}:3000`);
    }
  }

  addCandidate("http://localhost:3000");
  addCandidate("http://127.0.0.1:3000");

  function loadSocketClient(origin) {
    return new Promise((resolve, reject) => {
      if (typeof window.io === "function") {
        resolve(origin);
        return;
      }

      const script = document.createElement("script");
      script.src = `${origin}/socket.io/socket.io.js`;
      script.async = true;

      script.addEventListener("load", () => {
        if (typeof window.io === "function") {
          resolve(origin);
        } else {
          script.remove();
          reject(new Error(`Socket.IO client was not available from ${origin}`));
        }
      });

      script.addEventListener("error", () => {
        script.remove();
        reject(new Error(`Could not load Socket.IO client from ${origin}`));
      });

      document.head.appendChild(script);
    });
  }

  window.DoCodeSocketReady = (async () => {
    const errors = [];

    for (const origin of candidates) {
      try {
        const socketOrigin = await loadSocketClient(origin);
        window.DoCodeSocketOrigin = socketOrigin;
        return socketOrigin;
      } catch (error) {
        errors.push(error.message);
      }
    }

    throw new Error(errors.join(" | "));
  })();
})();
