(function () {
  "use strict";

  window.EDNext = window.EDNext || {};

  const STORAGE_KEY =
    "edmarket-layout-debug-v21";

  let resizeTimer = null;

  function isDebugEnabled() {
    return (
      localStorage.getItem(STORAGE_KEY) ===
      "true"
    );
  }

  function markOverflowingElements() {
    const viewportWidth =
      document.documentElement.clientWidth;

    const elements =
      Array.from(
        document.body.querySelectorAll("*")
      );

    const problems = [];

    elements.forEach(element => {
      element.classList.remove(
        "ed-layout-overflow"
      );

      if (
        element.closest(
          "svg, defs, symbol"
        )
      ) {
        return;
      }

      const style =
        window.getComputedStyle(element);

      if (
        style.position === "fixed" ||
        style.position === "absolute"
      ) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      const exceedsRight =
        rect.right >
        viewportWidth + 2;

      const exceedsLeft =
        rect.left < -2;

      const internalOverflow =
        element.scrollWidth >
        element.clientWidth + 3;

      const allowsHorizontalScroll =
        style.overflowX === "auto" ||
        style.overflowX === "scroll";

      if (
        exceedsRight ||
        exceedsLeft ||
        (
          internalOverflow &&
          !allowsHorizontalScroll
        )
      ) {
        problems.push({
          element,
          rect,
          exceedsRight,
          exceedsLeft,
          internalOverflow
        });

        if (isDebugEnabled()) {
          element.classList.add(
            "ed-layout-overflow"
          );
        }
      }
    });

    return problems;
  }

  function audit({
    log = true
  } = {}) {
    const problems =
      markOverflowingElements();

    const result = {
      width:
        document.documentElement
          .clientWidth,

      height:
        window.innerHeight,

      devicePixelRatio:
        window.devicePixelRatio,

      problems:
        problems.map(item => ({
          tag:
            item.element.tagName
              .toLowerCase(),

          id:
            item.element.id || "",

          className:
            typeof item.element.className ===
            "string"
              ? item.element.className
              : "",

          scrollWidth:
            item.element.scrollWidth,

          clientWidth:
            item.element.clientWidth,

          left:
            Math.round(item.rect.left),

          right:
            Math.round(item.rect.right)
        }))
    };

    if (log) {
      if (problems.length) {
        console.warn(
          `E&D Layout Audit: ${problems.length} posibles desbordamientos.`,
          result
        );
      } else {
        console.log(
          "✓ E&D Layout Audit: encuadre correcto.",
          result
        );
      }
    }

    return result;
  }

  function enableDebug() {
    localStorage.setItem(
      STORAGE_KEY,
      "true"
    );

    document.documentElement
      .classList.add(
        "ed-layout-debug"
      );

    return audit();
  }

  function disableDebug() {
    localStorage.setItem(
      STORAGE_KEY,
      "false"
    );

    document.documentElement
      .classList.remove(
        "ed-layout-debug"
      );

    document
      .querySelectorAll(
        ".ed-layout-overflow"
      )
      .forEach(element => {
        element.classList.remove(
          "ed-layout-overflow"
        );
      });

    console.log(
      "✓ Diagnóstico visual desactivado."
    );
  }

  function toggleDebug() {
    if (isDebugEnabled()) {
      disableDebug();
    } else {
      enableDebug();
    }
  }

  function scheduleAudit() {
    window.clearTimeout(resizeTimer);

    resizeTimer =
      window.setTimeout(() => {
        audit({
          log: false
        });
      }, 220);
  }

  function mount() {
    window.EDNext.layout = {
      audit,
      enableDebug,
      disableDebug,
      toggleDebug,
      isDebugEnabled
    };

    if (isDebugEnabled()) {
      document.documentElement
        .classList.add(
          "ed-layout-debug"
        );
    }

    window.setTimeout(
      () => audit(),
      1300
    );

    window.addEventListener(
      "resize",
      scheduleAudit,
      {
        passive: true
      }
    );

    window.addEventListener(
      "orientationchange",
      scheduleAudit,
      {
        passive: true
      }
    );

    if (
      window.visualViewport
    ) {
      window.visualViewport
        .addEventListener(
          "resize",
          scheduleAudit,
          {
            passive: true
          }
        );
    }

    console.log(
      "✓ E&D Responsive UI System v2.1 cargado"
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      mount,
      {
        once: true
      }
    );
  } else {
    mount();
  }
})();
