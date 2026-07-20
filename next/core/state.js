(function () {
  "use strict";

  window.EDNext = window.EDNext || {};

  const STORAGE_KEY =
    "edmarket-next-v2-enabled";

  function isEnabled() {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      return true;
    }

    return stored === "true";
  }

  function enable() {
    localStorage.setItem(
      STORAGE_KEY,
      "true"
    );

    window.location.reload();
  }

  function disable() {
    localStorage.setItem(
      STORAGE_KEY,
      "false"
    );

    window.location.reload();
  }

  function toggle() {
    if (isEnabled()) {
      disable();
    } else {
      enable();
    }
  }

  EDNext.state = {
    version: "2.0.0-phase-1",
    isEnabled,
    enable,
    disable,
    toggle
  };
})();
