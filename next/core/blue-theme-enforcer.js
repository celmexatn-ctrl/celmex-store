(function () {
  "use strict";

  const GOLD_HEX = new Set([
    "#d7a928",
    "#d7a528",
    "#d7a51b",
    "#d7a928ff",
    "#e4b72f",
    "#e4ba3d",
    "#dcb33d",
    "#dcb744",
    "#d8ad31",
    "#d8b23f",
    "#dca91d",
    "#efc950",
    "#f0ce58",
    "#f0d05e",
    "#f1d05c",
    "#e8bd3d",
    "#b99431",
    "#b8922d",
    "#cda42c",
    "#ffcf3f",
    "#ffd54f"
  ]);

  const replacements = {
    color: "#43c6ff",
    borderColor: "rgba(67, 198, 255, 0.32)",
    backgroundColor: "#087cff"
  };

  let timer = null;

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function isOldGold(value) {
    const normalized = normalize(value);

    if (!normalized) {
      return false;
    }

    if (GOLD_HEX.has(normalized)) {
      return true;
    }

    return (
      normalized.includes("rgb(215,169,40)") ||
      normalized.includes("rgba(215,169,40") ||
      normalized.includes("rgb(224,180,47)") ||
      normalized.includes("rgba(224,180,47") ||
      normalized.includes("rgb(240,208,94)") ||
      normalized.includes("rgba(240,208,94") ||
      normalized.includes("rgb(228,183,47)") ||
      normalized.includes("rgba(228,183,47") ||
      normalized.includes("rgb(239,201,80)") ||
      normalized.includes("rgba(239,201,80")
    );
  }

  function replaceInlineStyle(element) {
    if (!element?.style) {
      return;
    }

    const properties = [
      "color",
      "border-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "background-color",
      "outline-color",
      "text-decoration-color",
      "fill",
      "stroke"
    ];

    properties.forEach(property => {
      const current =
        element.style.getPropertyValue(property);

      if (!isOldGold(current)) {
        return;
      }

      let next = "#43c6ff";

      if (property.includes("border")) {
        next =
          "rgba(67, 198, 255, 0.32)";
      }

      if (property === "background-color") {
        next = "#087cff";
      }

      element.style.setProperty(
        property,
        next,
        "important"
      );
    });

    const background =
      element.style.getPropertyValue(
        "background"
      );

    if (isOldGold(background)) {
      element.style.setProperty(
        "background",
        "linear-gradient(135deg,#149cff,#087cff 52%,#073fc9)",
        "important"
      );
    }

    const boxShadow =
      element.style.getPropertyValue(
        "box-shadow"
      );

    if (isOldGold(boxShadow)) {
      element.style.setProperty(
        "box-shadow",
        "0 11px 28px rgba(7,93,234,.30)",
        "important"
      );
    }
  }

  function replaceCssVariables(element) {
    if (!element?.style) {
      return;
    }

    const variables = [
      "--gold",
      "--gold-soft",
      "--gold-strong",
      "--accent",
      "--accent-2",
      "--primary",
      "--primary-color",
      "--brand-color"
    ];

    variables.forEach(variable => {
      const current =
        element.style.getPropertyValue(
          variable
        );

      if (
        current &&
        isOldGold(current)
      ) {
        element.style.setProperty(
          variable,
          "#087cff",
          "important"
        );
      }
    });
  }

  function enforce(root = document) {
    document.documentElement
      .classList.add(
        "ed-blue-final"
      );

    const elements = [
      root.documentElement,
      root.body,
      ...root.querySelectorAll?.(
        "[style]"
      ) || []
    ].filter(Boolean);

    elements.forEach(element => {
      replaceInlineStyle(element);
      replaceCssVariables(element);
    });

    return elements.length;
  }

  function schedule() {
    window.clearTimeout(timer);

    timer =
      window.setTimeout(
        () => enforce(document),
        80
      );
  }

  function observe() {
    const observer =
      new MutationObserver(records => {
        let needsUpdate = false;

        for (const record of records) {
          if (
            record.type === "attributes" ||
            record.addedNodes.length
          ) {
            needsUpdate = true;
            break;
          }
        }

        if (needsUpdate) {
          schedule();
        }
      });

    observer.observe(
      document.documentElement,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          "style",
          "class",
          "open"
        ]
      }
    );
  }

  function mount() {
    enforce(document);
    observe();

    window.setTimeout(
      () => enforce(document),
      500
    );

    window.setTimeout(
      () => enforce(document),
      1500
    );

    window.EDNext =
      window.EDNext || {};

    window.EDNext.blueTheme = {
      enforce: () => enforce(document)
    };

    console.log(
      "✓ E&D Final Electric Blue Identity v2.4 cargada"
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
