(function () {
  "use strict";

  const VERSION = "3.1.0";

  const logoSelectors = [
    ".logo",
    ".brand",
    ".ed-brand",
    ".marketplace-brand",
    ".app-logo",
    ".header-logo"
  ];

  function addNextBadge(element) {
    if (!element) return;

    if (
      element.querySelector(
        ".ed-next-logo-badge"
      )
    ) {
      return;
    }

    const normalizedText =
      String(element.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    if (
      !normalizedText.includes("E&D") &&
      !normalizedText.includes("MARKET")
    ) {
      return;
    }

    const badge =
      document.createElement("span");

    badge.className =
      "ed-next-logo-badge";

    badge.textContent = "NEXT";

    element.appendChild(badge);
  }

  function upgradeLogos(root = document) {
    logoSelectors.forEach(selector => {
      root
        .querySelectorAll(selector)
        .forEach(addNextBadge);
    });
  }

  function removeGoldInlineStyles(root = document) {
    const elements =
      root.querySelectorAll(
        '[style*="#d4af37"],' +
        '[style*="#D4AF37"],' +
        '[style*="#f5c542"],' +
        '[style*="#F5C542"],' +
        '[style*="#c99b28"],' +
        '[style*="#C99B28"],' +
        '[style*="gold"],' +
        '[style*="GoldenRod"]'
      );

    elements.forEach(element => {
      const style =
        element.getAttribute("style") || "";

      const cleaned = style
        .replace(
          /color\s*:\s*(#d4af37|#f5c542|#c99b28|gold|goldenrod)\s*;?/gi,
          ""
        )
        .replace(
          /border-color\s*:\s*(#d4af37|#f5c542|#c99b28|gold|goldenrod)\s*;?/gi,
          ""
        )
        .replace(
          /background(?:-color)?\s*:\s*(#d4af37|#f5c542|#c99b28|gold|goldenrod)\s*;?/gi,
          ""
        );

      element.setAttribute(
        "style",
        cleaned
      );
    });
  }

  function applyIdentity(root = document) {
    document.documentElement.classList.add(
      "edmarket-next-v31"
    );

    document.body?.classList.add(
      "edmarket-next-v31"
    );

    upgradeLogos(root);
    removeGoldInlineStyles(root);
  }

  function watchDynamicContent() {
    if (!document.body) return;

    const observer =
      new MutationObserver(records => {
        records.forEach(record => {
          record.addedNodes.forEach(node => {
            if (
              !(node instanceof Element)
            ) {
              return;
            }

            applyIdentity(node);

            logoSelectors.forEach(selector => {
              if (node.matches?.(selector)) {
                addNextBadge(node);
              }
            });
          });
        });
      });

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    return observer;
  }

  function init() {
    applyIdentity();
    watchDynamicContent();

    window.EDMarketNextV31 = {
      version: VERSION,

      refresh() {
        applyIdentity();
        return true;
      },

      showWelcome() {
        window.EDMarketNextUI
          ?.showWelcome?.();
      },

      resetWelcome() {
        return window.EDMarketNextUI
          ?.resetWelcome?.();
      }
    };

    console.log(
      "✓ E&D Market Next UI 3.1 cargado"
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
