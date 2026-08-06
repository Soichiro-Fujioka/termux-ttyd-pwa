(function () {
  var defaults = {
    ttydUrl: window.location.protocol + "//" + window.location.hostname + ":7681/",
    terminalPadding: "0"
  };
  var startupConfig = window.TERMUX_TTYD_PWA_CONFIG || {};

  var storageKey = "termux-ttyd-pwa.settings";
  var frame = document.getElementById("terminalFrame");
  var edgeSwipeZone = document.getElementById("edgeSwipeZone");
  var drawer = document.getElementById("controlDrawer");
  var drawerBackdrop = document.getElementById("drawerBackdrop");
  var settingsPanel = document.getElementById("settingsPanel");
  var settingsToggle = document.getElementById("settingsToggle");
  var fullscreenToggle = document.getElementById("fullscreenToggle");
  var reloadTerminal = document.getElementById("reloadTerminal");
  var form = document.getElementById("settingsForm");
  var ttydUrlInput = document.getElementById("ttydUrl");
  var terminalPaddingInput = document.getElementById("terminalPadding");

  function readSettings() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(storageKey) || "{}"), startupConfig);
    } catch (error) {
      return Object.assign({}, defaults, startupConfig);
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  function applyForm(settings) {
    ttydUrlInput.value = settings.ttydUrl;
    terminalPaddingInput.value = settings.terminalPadding;
  }

  function applyLayout(settings) {
    document.documentElement.style.setProperty("--terminal-padding", normalizeTerminalPadding(settings.terminalPadding));
  }

  function normalizeTerminalPadding(value) {
    var padding = String(value || "").trim();

    if (!padding) return "0";
    if (/^-?\d+(?:\.\d+)?$/.test(padding) && padding !== "0") return padding + "px";
    return padding;
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerBackdrop.hidden = false;
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerBackdrop.hidden = true;
    settingsPanel.hidden = true;
    settingsToggle.setAttribute("aria-expanded", "false");
    focusFrame();
  }

  function normalizeUrl(value) {
    try {
      return new URL(value, window.location.href).toString();
    } catch (error) {
      return defaults.ttydUrl;
    }
  }

  function isAllowedTtydUrl(value) {
    var url;

    try {
      url = new URL(value, window.location.href);
    } catch (error) {
      return false;
    }

    return (url.protocol === "http:" || url.protocol === "https:") && (
      url.hostname === window.location.hostname ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "localhost" ||
      url.hostname === "[::1]"
    );
  }

  function normalizeTtydUrl(value) {
    var normalized = normalizeUrl(value);
    return isAllowedTtydUrl(normalized) ? normalized : defaults.ttydUrl;
  }

  function loadTerminal(settings) {
    applyLayout(settings);
    frame.src = normalizeTtydUrl(settings.ttydUrl);
  }

  function focusFrame() {
    frame.focus();
    try {
      frame.contentWindow.focus();
    } catch (error) {
      // Cross-origin ttyd frames can still be focused through the iframe element.
    }
  }

  function isFullscreen() {
    return Boolean(document.fullscreenElement) || window.matchMedia("(display-mode: fullscreen)").matches;
  }

  function updateFullscreenState() {
    var active = isFullscreen();
    fullscreenToggle.classList.toggle("is-active", active);
    fullscreenToggle.setAttribute("aria-pressed", active ? "true" : "false");
    fullscreenToggle.textContent = active ? "Fullscreen: On" : "Fullscreen";
  }

  var settings = readSettings();
  applyForm(settings);
  loadTerminal(settings);
  updateFullscreenState();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }

  frame.addEventListener("load", function () {
    focusFrame();
  });

  settingsToggle.addEventListener("click", function () {
    var nextHidden = !settingsPanel.hidden;
    settingsPanel.hidden = nextHidden;
    settingsToggle.setAttribute("aria-expanded", nextHidden ? "false" : "true");
  });

  fullscreenToggle.addEventListener("click", function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {
        updateFullscreenState();
      });
    } else {
      document.exitFullscreen().catch(function () {
        updateFullscreenState();
      });
    }
    closeDrawer();
  });

  document.addEventListener("fullscreenchange", updateFullscreenState);

  try {
    window.matchMedia("(display-mode: fullscreen)").addEventListener("change", updateFullscreenState);
  } catch (error) {}

  drawerBackdrop.addEventListener("click", closeDrawer);

  reloadTerminal.addEventListener("click", function () {
    loadTerminal(settings);
    closeDrawer();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!isAllowedTtydUrl(ttydUrlInput.value)) {
      ttydUrlInput.setCustomValidity("Use an http(s) URL on the same host, localhost, 127.0.0.1, or ::1.");
      ttydUrlInput.reportValidity();
      return;
    }
    ttydUrlInput.setCustomValidity("");
    settings = {
      ttydUrl: normalizeTtydUrl(ttydUrlInput.value),
      terminalPadding: normalizeTerminalPadding(terminalPaddingInput.value)
    };
    writeSettings(settings);
    applyForm(settings);
    applyLayout(settings);
    loadTerminal(settings);
    closeDrawer();
  });

  var swipeStartX = 0;
  var swipeStartY = 0;
  var swipeTracking = false;

  function onSwipeStart(event) {
    if (event.touches.length !== 1) return;
    swipeStartX = event.touches[0].clientX;
    swipeStartY = event.touches[0].clientY;
    swipeTracking = true;
  }

  function onSwipeEnd(event) {
    if (!swipeTracking || event.changedTouches.length !== 1) return;
    var touch = event.changedTouches[0];
    var deltaX = touch.clientX - swipeStartX;
    var deltaY = Math.abs(touch.clientY - swipeStartY);
    swipeTracking = false;

    if (deltaY > 80) return;
    if (swipeStartX > window.innerWidth - 28 && deltaX < -45) {
      openDrawer();
    } else if (drawer.classList.contains("is-open") && deltaX > 45) {
      closeDrawer();
    }
  }

  edgeSwipeZone.addEventListener("touchstart", onSwipeStart, { passive: true });
  edgeSwipeZone.addEventListener("touchend", onSwipeEnd, { passive: true });
  drawer.addEventListener("touchstart", onSwipeStart, { passive: true });
  drawer.addEventListener("touchend", onSwipeEnd, { passive: true });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  window.addEventListener("resize", function () {
    try {
      frame.contentWindow.dispatchEvent(new Event("resize"));
    } catch (error) {}
  });
})();
