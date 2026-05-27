(() => {
  const preloader = document.getElementById("appPreloader");
  const startedAt = performance.now();
  const minimumVisibleTime = 650;
  let hidden = false;

  if (!preloader) return;

  document.body.classList.add("preloader-active");

  function setHidden(shouldHide) {
    hidden = shouldHide;
    preloader.classList.toggle("preloader-hidden", shouldHide);
    preloader.setAttribute("aria-hidden", shouldHide ? "true" : "false");
    document.body.classList.toggle("preloader-active", !shouldHide);
  }

  function hidePreloader() {
    if (hidden) return;

    const elapsed = performance.now() - startedAt;
    const delay = Math.max(0, minimumVisibleTime - elapsed);

    window.setTimeout(() => {
      setHidden(true);
    }, delay);
  }

  if (document.readyState === "complete") {
    hidePreloader();
  } else {
    window.addEventListener("load", hidePreloader, { once: true });
  }

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      hidePreloader();
    }
  });

  window.addEventListener("beforeunload", () => {
    setHidden(false);
  });

  window.setTimeout(hidePreloader, 3000);
})();
