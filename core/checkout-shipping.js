(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const STORAGE_KEY =
    "edmarket-checkout-shipping-v1";

  const SHIPPING_METHODS = [
    {
      id: "standard",
      icon: "🚚",
      name: "Envío estándar",
      time: "Entrega estimada de 3 a 7 días hábiles",
      description:
        "La opción recomendada para la mayoría de los pedidos.",
      priceLabel: "Costo por confirmar",
      badge: "Recomendado"
    },
    {
      id: "express",
      icon: "⚡",
      name: "Envío exprés",
      time: "Entrega estimada de 1 a 3 días hábiles",
      description:
        "Disponible según producto, código postal y cobertura.",
      priceLabel: "Cotización exprés",
      badge: "Más rápido"
    },
    {
      id: "pickup",
      icon: "🏬",
      name: "Recoger en punto E&D",
      time: "Fecha y ubicación por confirmar",
      description:
        "Recibe instrucciones cuando el pedido esté preparado.",
      priceLabel: "Sin envío",
      badge: "Recolección"
    }
  ];

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function load() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch {
      return {};
    }
  }

  function save(shipping) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(shipping)
    );

    return shipping;
  }

  function getAddress() {
    return (
      EDCore.checkoutAddress?.load?.() ||
      {}
    );
  }

  function formatAddress(address) {
    const line1 = [
      address.street,
      address.exterior
        ? `#${address.exterior}`
        : "",
      address.interior
        ? `Int. ${address.interior}`
        : ""
    ]
      .filter(Boolean)
      .join(" ");

    const line2 = [
      address.neighborhood,
      address.city,
      address.state
    ]
      .filter(Boolean)
      .join(", ");

    const line3 = address.postalCode
      ? `C.P. ${address.postalCode}`
      : "";

    return [line1, line2, line3]
      .filter(Boolean)
      .map(escapeHtml);
  }

  function renderAddressSummary() {
    const address = getAddress();
    const lines = formatAddress(address);

    if (!lines.length) {
      return `
        <div class="ed-shipping-address is-empty">
          <span>📍</span>

          <div>
            <strong>Dirección pendiente</strong>
            <p>
              Regresa al paso anterior para completar
              el domicilio de entrega.
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="ed-shipping-address">
        <span>📍</span>

        <div>
          <small>ENTREGA EN</small>
          <strong>${lines[0] || ""}</strong>

          ${lines
            .slice(1)
            .map(line => `<p>${line}</p>`)
            .join("")}
        </div>

        <button
          type="button"
          data-ed-edit-address
          aria-label="Editar dirección"
        >
          Editar
        </button>
      </div>
    `;
  }

  function renderMethod(method, selectedId) {
    const selected =
      method.id === selectedId;

    return `
      <button
        type="button"
        class="ed-shipping-method ${
          selected ? "is-selected" : ""
        }"
        data-ed-shipping-method="${method.id}"
        aria-pressed="${selected}"
      >
        <span class="ed-shipping-method-icon">
          ${method.icon}
        </span>

        <span class="ed-shipping-method-copy">
          <span class="ed-shipping-method-topline">
            <strong>${method.name}</strong>
            <small>${method.badge}</small>
          </span>

          <b>${method.time}</b>
          <p>${method.description}</p>
        </span>

        <span class="ed-shipping-method-side">
          <strong>${method.priceLabel}</strong>

          <i aria-hidden="true">
            ${selected ? "✓" : ""}
          </i>
        </span>
      </button>
    `;
  }

  function render() {
    const saved = load();

    const selectedId =
      saved.methodId || "standard";

    return `
      <section class="ed-shipping-screen">
        <div class="ed-step-heading">
          <span class="ed-step-heading-icon">🚚</span>

          <div>
            <small>PASO 3 DE 6</small>
            <h2>¿Cómo deseas recibirlo?</h2>

            <p>
              Selecciona la modalidad de entrega.
              La disponibilidad y el costo definitivo
              se confirmarán antes del pago.
            </p>
          </div>
        </div>

        ${renderAddressSummary()}

        <div class="ed-shipping-section-heading">
          <div>
            <small>OPCIONES DISPONIBLES</small>
            <strong>Método de entrega</strong>
          </div>

          <span>
            ${SHIPPING_METHODS.length} opciones
          </span>
        </div>

        <div
          id="edShippingMethods"
          class="ed-shipping-methods"
        >
          ${SHIPPING_METHODS
            .map(method =>
              renderMethod(method, selectedId)
            )
            .join("")}
        </div>

        <input
          id="edShippingSelected"
          type="hidden"
          value="${escapeHtml(selectedId)}"
        />

        <p
          id="edShippingMessage"
          class="ed-form-message"
          hidden
        ></p>

        <div class="ed-shipping-note">
          <span>ℹ️</span>

          <div>
            <strong>Información de entrega</strong>

            <p>
              Los tiempos son estimados y comienzan
              después de confirmar el pago y preparar
              el pedido.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function selectMethod(container, methodId) {
    const method = SHIPPING_METHODS.find(
      item => item.id === methodId
    );

    if (!method) return;

    const input = container.querySelector(
      "#edShippingSelected"
    );

    if (input) {
      input.value = method.id;
    }

    container
      .querySelectorAll(
        "[data-ed-shipping-method]"
      )
      .forEach(button => {
        const selected =
          button.dataset.edShippingMethod ===
          method.id;

        button.classList.toggle(
          "is-selected",
          selected
        );

        button.setAttribute(
          "aria-pressed",
          String(selected)
        );

        const indicator =
          button.querySelector(
            ".ed-shipping-method-side i"
          );

        if (indicator) {
          indicator.textContent =
            selected ? "✓" : "";
        }
      });
  }

  function mount(container) {
    if (!container) return;

    container
      .querySelectorAll(
        "[data-ed-shipping-method]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectMethod(
              container,
              button.dataset.edShippingMethod
            );
          }
        );
      });

    container
      .querySelector("[data-ed-edit-address]")
      ?.addEventListener("click", () => {
        EDCore.checkoutShell?.goTo?.(
          "address"
        );
      });
  }

  function showMessage(container, message) {
    const element = container?.querySelector(
      "#edShippingMessage"
    );

    if (!element) return;

    element.hidden = false;
    element.textContent = message;
  }

  function validate(container) {
    const selectedId =
      container?.querySelector(
        "#edShippingSelected"
      )?.value;

    const method = SHIPPING_METHODS.find(
      item => item.id === selectedId
    );

    if (!method) {
      showMessage(
        container,
        "Selecciona una modalidad de entrega."
      );

      return {
        valid: false
      };
    }

    const address = getAddress();

    if (
      method.id !== "pickup" &&
      (
        !address.street ||
        !address.postalCode ||
        !address.state
      )
    ) {
      showMessage(
        container,
        "Completa la dirección antes de continuar."
      );

      return {
        valid: false
      };
    }

    const shipping = save({
      methodId: method.id,
      name: method.name,
      time: method.time,
      priceLabel: method.priceLabel,
      selectedAt:
        new Date().toISOString()
    });

    return {
      valid: true,
      data: shipping
    };
  }

  EDCore.checkoutShipping = {
    version: "1.3.0",
    methods: [...SHIPPING_METHODS],
    load,
    save,
    render,
    mount,
    validate
  };

  console.log(
    "✓ E&D Checkout Shipping v1.3.0 cargado"
  );
})();
