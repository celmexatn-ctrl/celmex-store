(function () {
  "use strict";

  const ROOT_CLASS =
    "ed-smooth-scroll-ready";

  const LOCK_CLASSES = [
    "modal-open",
    "dialog-open",
    "no-scroll",
    "overflow-hidden",
    "ed-checkout-open",
    "ed-v3-sheet-open",
    "sheet-open"
  ];

  let lastKnownY = 0;
  let repairTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function isVisible(element) {
    if (!element) return false;

    const style =
      window.getComputedStyle(element);

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 &&
      (
        element.open === true ||
        element.hasAttribute("open") ||
        element.classList.contains("is-open") ||
        element.classList.contains("active") ||
        element.classList.contains("show") ||
        element.getBoundingClientRect().height > 0
      )
    );
  }

  function hasVisibleOverlay() {
    const selectors = [
      "dialog[open]",
      ".ed-v3-sheet.is-open",
      "#edV3Sheet.is-open",
      ".ed-checkout-dialog[open]",
      "#edCheckoutDialog[open]",
      ".admin-dialog[open]",
      ".simple-dialog[open]"
    ];

    return selectors.some(selector =>
      Array.from(
        document.querySelectorAll(selector)
      ).some(isVisible)
    );
  }

  function unlockPageWhenSafe() {
    if (hasVisibleOverlay()) {
      return;
    }

    const html =
      document.documentElement;

    const body =
      document.body;

    LOCK_CLASSES.forEach(className => {
      html.classList.remove(className);
      body.classList.remove(className);
    });

    html.style.removeProperty("overflow");
    html.style.removeProperty("position");
    html.style.removeProperty("height");
    html.style.removeProperty("touch-action");

    body.style.removeProperty("overflow");
    body.style.removeProperty("position");
    body.style.removeProperty("height");
    body.style.removeProperty("top");
    body.style.removeProperty("width");
    body.style.removeProperty("touch-action");

    if (
      lastKnownY > 0 &&
      window.scrollY === 0
    ) {
      window.scrollTo({
        top: lastKnownY,
        behavior: "instant"
      });
    }
  }

  function configureScrollable(element) {
    if (!element) return;

    element.classList.add(
      "ed-scroll-surface"
    );

    element.style.setProperty(
      "-webkit-overflow-scrolling",
      "touch"
    );

    element.style.setProperty(
      "overscroll-behavior-y",
      "contain"
    );

    element.style.setProperty(
      "touch-action",
      "pan-y"
    );
  }

  function configureHorizontalRail(element) {
    if (!element) return;

    element.classList.add(
      "ed-horizontal-rail"
    );

    element.style.setProperty(
      "-webkit-overflow-scrolling",
      "touch"
    );

    element.style.setProperty(
      "overscroll-behavior-x",
      "contain"
    );

    element.style.setProperty(
      "touch-action",
      "pan-x pan-y"
    );

    element.addEventListener(
      "touchstart",
      event => {
        const touch =
          event.touches[0];

        touchStartX =
          touch.clientX;

        touchStartY =
          touch.clientY;
      },
      {
        passive: true
      }
    );

    element.addEventListener(
      "touchmove",
      event => {
        const touch =
          event.touches[0];

        const distanceX =
          Math.abs(
            touch.clientX -
            touchStartX
          );

        const distanceY =
          Math.abs(
            touch.clientY -
            touchStartY
          );

        if (distanceY > distanceX) {
          return;
        }
      },
      {
        passive: true
      }
    );
  }

  function applyScrollRules() {
    document.documentElement
      .classList.add(ROOT_CLASS);

    document.documentElement
      .style.setProperty(
        "scroll-behavior",
        "smooth"
      );

    document.body
      .style.setProperty(
        "-webkit-overflow-scrolling",
        "touch"
      );

    document.body
      .style.setProperty(
        "overscroll-behavior-y",
        "auto"
      );

    const verticalSelectors = [
      ".ed-v3-sheet-content",
      "#edV3SheetContent",
      ".ed-pricing-form",
      ".ed-pricing-results",
      ".ed-checkout-shell",
      ".ed-checkout-body",
      ".ed-checkout-content",
      "#edCheckoutDialog",
      ".admin-dialog",
      ".admin-content",
      ".simple-dialog",
      ".product-dialog",
      ".quote-dialog"
    ];

    verticalSelectors.forEach(selector => {
      document
        .querySelectorAll(selector)
        .forEach(configureScrollable);
    });

    const horizontalSelectors = [
      ".edp-product-rail",
      ".ed-market-shortcuts",
      ".ed-next-shortcuts",
      ".ed-next-category-rail",
      ".ed-next-product-rail",
      ".chips",
      ".featured-strip",
      ".shopify-product-grid",
      ".ed-category-rail"
    ];

    horizontalSelectors.forEach(selector => {
      document
        .querySelectorAll(selector)
        .forEach(configureHorizontalRail);
    });
  }

  function repairScroll() {
    window.clearTimeout(repairTimer);

    repairTimer =
      window.setTimeout(() => {
        applyScrollRules();
        unlockPageWhenSafe();
      }, 90);
  }

  function observeDialogs() {
    const observer =
      new MutationObserver(() => {
        repairScroll();
      });

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: [
          "class",
          "open",
          "style",
          "hidden"
        ]
      }
    );
  }

  function observeCloseActions() {
    document.addEventListener(
      "click",
      event => {
        const target =
          event.target.closest(
            [
              ".close",
              "[data-ed-v3-sheet-close]",
              "#edV3SheetClose",
              "[data-ed-pricing-close]",
              "[data-ed-checkout-close]",
              ".ed-checkout-close",
              "[aria-label='Cerrar']",
              "[aria-label='Close']"
            ].join(",")
          );

        if (!target) return;

        window.setTimeout(
          unlockPageWhenSafe,
          180
        );

        window.setTimeout(
          unlockPageWhenSafe,
          500
        );
      },
      {
        passive: true
      }
    );

    document.addEventListener(
      "close",
      () => {
        window.setTimeout(
          unlockPageWhenSafe,
          100
        );
      },
      true
    );
  }

  function rememberPosition() {
    window.addEventListener(
      "scroll",
      () => {
        if (!hasVisibleOverlay()) {
          lastKnownY =
            window.scrollY;
        }
      },
      {
        passive: true
      }
    );
  }

  function mount() {
    applyScrollRules();
    observeDialogs();
    observeCloseActions();
    rememberPosition();

    window.addEventListener(
      "resize",
      repairScroll,
      {
        passive: true
      }
    );

    window.addEventListener(
      "orientationchange",
      repairScroll,
      {
        passive: true
      }
    );

    window.EDNext =
      window.EDNext || {};

    window.EDNext.scroll = {
      repair: repairScroll,
      unlock: unlockPageWhenSafe,
      apply: applyScrollRules
    };

    window.setTimeout(
      repairScroll,
      700
    );

    window.setTimeout(
      repairScroll,
      1600
    );

    console.log(
      "✓ E&D Smooth Scroll v2.3 cargado"
    );
  }

  if (
    document.readyState ===
    "loading"
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
