(function () {
  "use strict";

  const STORAGE_KEY =
    "edmarket-next-welcome-v3-seen";

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function removeWelcome(element) {
    if (!element) return;

    element.classList.add("is-closing");

    window.setTimeout(() => {
      element.remove();
      document.body.classList.remove(
        "ed-next-welcome-open"
      );
    }, 330);
  }

  function openStore(element) {
    localStorage.setItem(STORAGE_KEY, "1");
    removeWelcome(element);
  }

  function openAccount(element) {
    localStorage.setItem(STORAGE_KEY, "1");
    removeWelcome(element);

    window.setTimeout(() => {
      const accountButton =
        document.querySelector(
          '[data-native-tab="account"],' +
          '[data-tab="account"],' +
          '[href="#account"],' +
          '#accountBtn'
        );

      accountButton?.click?.();
    }, 380);
  }

  function createWelcome() {
    if (
      document.querySelector(
        ".ed-next-welcome"
      )
    ) {
      return;
    }

    const element =
      document.createElement("section");

    element.className = "ed-next-welcome";
    element.setAttribute(
      "aria-label",
      "Bienvenida a E&D Market Next"
    );

    element.innerHTML = `
      <div class="ed-next-welcome-card">
        <div class="ed-next-welcome-brand">
          <div class="ed-next-brand-mark">
            E<span>&</span>D
          </div>

          <div class="ed-next-brand-copy">
            <strong>MARKET</strong>
            <small>NEXT</small>
          </div>
        </div>

        <div class="ed-next-welcome-copy">
          <small>TECNOLOGÍA SIN LÍMITES</small>

          <h1>
            Innovación que
            <span>conecta contigo</span>
          </h1>

          <p>
            Descubre productos, categorías y marcas
            internacionales desde una experiencia
            más rápida, moderna y segura.
          </p>
        </div>

        <div class="ed-next-welcome-visual">
          <div class="ed-next-glow-ring"></div>

          <div
            class="ed-next-device-stack"
            aria-hidden="true"
          >
            🎧 📱 ⌚
          </div>
        </div>

        <div class="ed-next-welcome-actions">
          <button
            type="button"
            class="ed-next-primary"
            data-ed-next-enter
          >
            Explorar productos
          </button>

          <button
            type="button"
            class="ed-next-secondary"
            data-ed-next-account
          >
            Iniciar sesión / Crear cuenta
          </button>
        </div>

        <div class="ed-next-features">
          <div class="ed-next-feature">
            <i>🛡️</i>
            <span>Compra segura</span>
          </div>

          <div class="ed-next-feature">
            <i>⚡</i>
            <span>Experiencia rápida</span>
          </div>

          <div class="ed-next-feature">
            <i>✓</i>
            <span>Servicio confiable</span>
          </div>
        </div>
      </div>
    `;

    element
      .querySelector("[data-ed-next-enter]")
      ?.addEventListener(
        "click",
        () => openStore(element)
      );

    element
      .querySelector("[data-ed-next-account]")
      ?.addEventListener(
        "click",
        () => openAccount(element)
      );

    document.body.classList.add(
      "ed-next-welcome-open"
    );

    document.body.appendChild(element);
  }

  function applyNextIdentity() {
    document.documentElement.classList.add(
      "edmarket-next-ui"
    );

    document.body.classList.add(
      "edmarket-next-ui"
    );

    document
      .querySelectorAll(
        ".bottom-nav a," +
        ".bottom-nav button," +
        ".native-bottom-nav a," +
        ".native-bottom-nav button"
      )
      .forEach(item => {
        item.addEventListener("click", () => {
          item.parentElement
            ?.querySelectorAll(
              ".active,.is-active"
            )
            .forEach(active => {
              active.classList.remove(
                "active",
                "is-active"
              );
            });

          item.classList.add("is-active");
        });
      });
  }

  function init() {
    applyNextIdentity();

    const hasSeen =
      localStorage.getItem(STORAGE_KEY) === "1";

    if (!hasSeen) {
      window.setTimeout(
        createWelcome,
        220
      );
    }

    window.EDMarketNextUI = {
      version: "3.0.0",
      showWelcome() {
        localStorage.removeItem(STORAGE_KEY);
        createWelcome();
      },
      resetWelcome() {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      },
      hideWelcome() {
        localStorage.setItem(STORAGE_KEY, "1");
        removeWelcome(
          document.querySelector(
            ".ed-next-welcome"
          )
        );
      },
      escapeHtml
    };

    console.log(
      "✓ E&D Market Next UI 3.0 cargado"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
