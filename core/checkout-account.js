(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const STORAGE_KEY = "edmarket-checkout-account-v1";

  function load() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch {
      return {};
    }
  }

  function save(account) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(account)
    );

    return account;
  }

  function render() {
    const account = load();

    return `
      <section class="ed-account-screen">
        <div class="ed-account-intro">
          <span class="ed-account-icon">👤</span>
          <div>
            <small>PASO 1 DE 6</small>
            <h2>¿Cómo quieres continuar?</h2>
            <p>
              Guarda tus datos para completar tu compra
              de forma más rápida y segura.
            </p>
          </div>
        </div>

        <div class="ed-account-options">
          <button
            type="button"
            class="ed-account-option is-selected"
            data-ed-account-mode="guest"
          >
            <span>⚡</span>
            <div>
              <strong>Continuar como invitado</strong>
              <small>
                No necesitas crear una cuenta.
              </small>
            </div>
            <b>✓</b>
          </button>

          <button
            type="button"
            class="ed-account-option"
            data-ed-account-mode="login"
          >
            <span>🔐</span>
            <div>
              <strong>Acceder a mi cuenta E&D</strong>
              <small>
                Próximamente: pedidos y direcciones
                sincronizadas.
              </small>
            </div>
            <b>›</b>
          </button>
        </div>

        <form
          id="edAccountForm"
          class="ed-account-form"
          novalidate
        >
          <label>
            <span>Nombre completo</span>
            <input
              name="name"
              type="text"
              autocomplete="name"
              placeholder="Ej. Manuel Hernández"
              value="${escapeHtml(account.name || "")}"
              required
            />
          </label>

          <label>
            <span>Correo electrónico</span>
            <input
              name="email"
              type="email"
              autocomplete="email"
              placeholder="correo@ejemplo.com"
              value="${escapeHtml(account.email || "")}"
              required
            />
          </label>

          <label>
            <span>Teléfono</span>
            <input
              name="phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="10 dígitos"
              value="${escapeHtml(account.phone || "")}"
              required
            />
          </label>

          <p
            id="edAccountMessage"
            class="ed-account-message"
            hidden
          ></p>
        </form>

        <div class="ed-account-security">
          <span>🔒</span>
          <p>
            Tus datos se guardan únicamente para facilitar
            tu compra y la entrega del pedido.
          </p>
        </div>
      </section>
    `;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function mount(container) {
    if (!container) return;

    const loginButton = container.querySelector(
      '[data-ed-account-mode="login"]'
    );

    loginButton?.addEventListener("click", () => {
      const message = container.querySelector(
        "#edAccountMessage"
      );

      if (!message) return;

      message.hidden = false;
      message.textContent =
        "El acceso de clientes se activará en la siguiente etapa.";
    });
  }

  function validate(container) {
    const form = container?.querySelector(
      "#edAccountForm"
    );

    if (!form) {
      return {
        valid: false,
        message: "No se encontró el formulario."
      };
    }

    if (!form.reportValidity()) {
      return {
        valid: false,
        message: "Completa los datos obligatorios."
      };
    }

    const values = Object.fromEntries(
      new FormData(form).entries()
    );

    const phoneDigits = String(values.phone || "")
      .replace(/\D/g, "");

    if (phoneDigits.length < 10) {
      const phone = form.elements.namedItem("phone");
      phone?.setCustomValidity(
        "Escribe un teléfono válido de 10 dígitos."
      );
      phone?.reportValidity();
      phone?.setCustomValidity("");

      return {
        valid: false,
        message: "El teléfono no es válido."
      };
    }

    const account = save({
      mode: "guest",
      name: String(values.name || "").trim(),
      email: String(values.email || "").trim(),
      phone: phoneDigits
    });

    return {
      valid: true,
      data: account
    };
  }

  EDCore.checkoutAccount = {
    version: "1.1.0",
    load,
    save,
    render,
    mount,
    validate
  };

  console.log(
    "✓ E&D Checkout Account v1.1.0 cargado"
  );
})();
