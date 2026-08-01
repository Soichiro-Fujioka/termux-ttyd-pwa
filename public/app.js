(function () {
  var defaults = {
    ttydUrl: window.location.protocol + "//" + window.location.hostname + ":7681/",
    fontFamily: "monospace",
    fontSize: "16",
    imeMode: "EN"
  };

  var storageKey = "termux-ttyd-pwa.settings";
  var frame = document.getElementById("terminalFrame");
  var settingsPanel = document.getElementById("settingsPanel");
  var settingsToggle = document.getElementById("settingsToggle");
  var fullscreenToggle = document.getElementById("fullscreenToggle");
  var focusTerminal = document.getElementById("focusTerminal");
  var imeToggle = document.getElementById("imeToggle");
  var reloadTerminal = document.getElementById("reloadTerminal");
  var form = document.getElementById("settingsForm");
  var ttydUrlInput = document.getElementById("ttydUrl");
  var fontFamilyInput = document.getElementById("fontFamily");
  var fontSizeInput = document.getElementById("fontSize");

  function readSettings() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch (error) {
      return Object.assign({}, defaults);
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  function applyForm(settings) {
    ttydUrlInput.value = settings.ttydUrl;
    fontFamilyInput.value = settings.fontFamily;
    fontSizeInput.value = settings.fontSize;
    imeToggle.textContent = "IME: " + settings.imeMode;
    imeToggle.setAttribute("aria-pressed", settings.imeMode === "JA" ? "true" : "false");
  }

  function normalizeUrl(value) {
    try {
      return new URL(value, window.location.href).toString();
    } catch (error) {
      return defaults.ttydUrl;
    }
  }

  function loadTerminal(settings) {
    frame.src = normalizeUrl(settings.ttydUrl);
  }

  function focusFrame() {
    frame.focus();
    try {
      frame.contentWindow.focus();
    } catch (error) {
      // Cross-origin ttyd frames can still be focused through the iframe element.
    }
  }

  function applyFont(settings) {
    document.documentElement.style.setProperty("--terminal-font-family", settings.fontFamily);
    document.documentElement.style.setProperty("--terminal-font-size", settings.fontSize + "px");

    try {
      var doc = frame.contentDocument;
      if (!doc) return;
      var style = doc.getElementById("termux-ttyd-pwa-font");
      if (!style) {
        style = doc.createElement("style");
        style.id = "termux-ttyd-pwa-font";
        doc.head.appendChild(style);
      }
      style.textContent = ".xterm, .xterm-rows, .terminal { font-family: " + JSON.stringify(settings.fontFamily) + " !important; font-size: " + Number(settings.fontSize) + "px !important; }";
      window.setTimeout(function () {
        frame.contentWindow.dispatchEvent(new Event("resize"));
      }, 60);
    } catch (error) {
      // Browser isolation may block direct styling when ttyd runs on another port.
    }
  }

  var settings = readSettings();
  applyForm(settings);
  loadTerminal(settings);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }

  frame.addEventListener("load", function () {
    applyFont(settings);
    focusFrame();
  });

  focusTerminal.addEventListener("click", focusFrame);

  settingsToggle.addEventListener("click", function () {
    var nextHidden = !settingsPanel.hidden;
    settingsPanel.hidden = nextHidden;
    settingsToggle.setAttribute("aria-expanded", nextHidden ? "false" : "true");
    if (nextHidden) focusFrame();
  });

  imeToggle.addEventListener("click", function () {
    settings.imeMode = settings.imeMode === "EN" ? "JA" : "EN";
    writeSettings(settings);
    applyForm(settings);
    focusFrame();
  });

  fullscreenToggle.addEventListener("click", function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen().catch(function () {});
    }
  });

  reloadTerminal.addEventListener("click", function () {
    loadTerminal(settings);
    focusFrame();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    settings = {
      ttydUrl: normalizeUrl(ttydUrlInput.value),
      fontFamily: fontFamilyInput.value.trim() || defaults.fontFamily,
      fontSize: String(Math.min(48, Math.max(8, Number(fontSizeInput.value) || Number(defaults.fontSize)))),
      imeMode: settings.imeMode
    };
    writeSettings(settings);
    applyForm(settings);
    applyFont(settings);
    loadTerminal(settings);
    settingsPanel.hidden = true;
    settingsToggle.setAttribute("aria-expanded", "false");
    focusFrame();
  });

  window.addEventListener("resize", function () {
    try {
      frame.contentWindow.dispatchEvent(new Event("resize"));
    } catch (error) {}
  });
})();
