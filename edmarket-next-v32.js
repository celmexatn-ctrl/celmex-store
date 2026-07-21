(function () {
  "use strict";

  const VERSION = "3.2.0";

  const OLD_LOGO_PATTERN =
    /assets\/logo\.png(?:\?[^"']*)?$/i;

  const NEXT_ICON =
    "assets/branding-next/icon-next.svg?v=3200";

  function replaceOldLogo(image) {
    if (!(image instanceof HTMLImageElement)) {
      return false;
    }

    const source =
      image.getAttribute("src") || "";

    if (!OLD_LOGO_PATTERN.test(source)) {
      return false;
    }

    image.src = NEXT_ICON;
    image.dataset.edNextLogo = "true";

    return true;
  }

  function replaceAllOldLogos(root = document) {
    const images = [];

    if (root instanceof HTMLImageElement) {
      images.push(root);
    }

    if (root.querySelectorAll) {
      images.push(
        ...root.querySelectorAll("img")
      );
    }

    let changed = 0;

    images.forEach(image => {
      if (replaceOldLogo(image)) {
        changed += 1;
      }
    });

    return changed;
  }

  function upgradeHeaderBrand(root = document) {
    root
      .querySelectorAll?.(".brand")
      .forEach(brand => {
        if (
          brand.querySelector(
            ".ed-next-header-badge"
          )
        ) {
          return;
        }

        const text =
          String(brand.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();

        if (!text.includes("E&D")) {
          return;
        }

        const title =
          brand.querySelector("strong");

        if (!title) return;

        const badge =
          document.createElement("span");

        badge.className =
          "ed-next-header-badge";

        badge.textContent = "NEXT";

        title.appendChild(badge);
      });
  }

  function upgradeDeviceComposition(
    root = document
  ) {
    root
      .querySelectorAll?.(
        ".ed-next-device-stack"
      )
      .forEach(container => {
        if (
          container.dataset.edNextV32 ===
          "true"
        ) {
          return;
        }

        container.dataset.edNextV32 =
          "true";

        container.innerHTML = `
          <div
            class="ed-next-device-stage"
            aria-hidden="true"
          >
            <div class="ed-next-device-aura"></div>
            <div class="ed-next-watch"></div>
            <div class="ed-next-phone"></div>
            <div class="ed-next-buds"></div>
          </div>
        `;
      });
  }

  function normalizeNavigation() {
    const navigation =
      document.querySelector(".bottom-nav");

    if (!navigation) return;

    const items =
      navigation.querySelectorAll(
        "button, a"
      );

    items.forEach(item => {
      if (
        item.dataset.edNextBound === "true"
      ) {
        return;
      }

      item.dataset.edNextBound = "true";

      item.addEventListener(
        "click",
        () => {
          items.forEach(other => {
            other.classList.remove(
              "active",
              "is-active"
            );
          });

          item.classList.add(
            "is-active"
          );
        }
      );
    });
  }

  function apply(root = document) {
    document.documentElement.classList.add(
      "edmarket-next-v32"
    );

    document.body?.classList.add(
      "edmarket-next-v32"
    );

    replaceAllOldLogos(root);
    upgradeHeaderBrand(root);
    upgradeDeviceComposition(root);
    normalizeNavigation();
  }

  function observe() {
    if (!document.body) return null;

    let scheduled = false;

    const observer =
      new MutationObserver(records => {
        if (scheduled) return;

        const hasChanges =
          records.some(record =>
            record.addedNodes.length > 0
          );

        if (!hasChanges) return;

        scheduled = true;

        requestAnimationFrame(() => {
          scheduled = false;
          apply(document);
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
    apply(document);
    observe();

    window.EDMarketNextV32 = {
      version: VERSION,

      refresh() {
        apply(document);
        return true;
      },

      showWelcome() {
        window.EDMarketNextUI
          ?.showWelcome?.();

        window.setTimeout(
          () => apply(document),
          40
        );
      },

      resetWelcome() {
        return window.EDMarketNextUI
          ?.resetWelcome?.();
      }
    };

    console.log(
      "✓ E&D Market Next UI 3.2 cargado"
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
