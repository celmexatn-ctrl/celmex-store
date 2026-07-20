(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const STORAGE_KEY =
    "edmarket-checkout-payment-v1";

  const PAYMENT_METHODS = [
    {
      id: "card",
      icon: "💳",
      name: "Tarjeta de crédito o débito",
      description:
        "Pago protegido mediante una plataforma certificada.",
      status: "Disponible al conectar el procesador",
      badge: "Pago seguro",
      enabled: true
    },
    {
      id: "spei",
      icon: "🏦",
      name: "Transferencia SPEI",
      description:
        "Recibirás instrucciones y una referencia para completar el pago.",
      status: "Confirmación manual temporal",
      badge: "Transferencia",
      enabled: true
    },
    {
      id: "cash",
      icon: "💵",
      name: "Pago en efectivo",
      description:
        "La referencia y los establecimientos disponibles se mostrarán al confirmar.",
      status: "Sujeto a disponibilidad",
      badge: "Efectivo",
      enabled: true
    },
    {
      id: "wallet",
      icon: "👛",
      name: "E&D Wallet",
      description:
        "Usa saldo, cashback y recompensas dentro de E&D Market.",
      status: "Próximamente",
      badge: "Wallet",
      enabled: false
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

  function save(payment) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(payment)
    );

    return payment;
  }

  function renderMethod(method, selectedId) {
    const selected =
      method.id === selectedId;

    return `
      <button
        type="button"
        class="ed-payment-method
          ${selected ? "is-selected" : ""}
          ${method.enabled ? "" : "is-disabled"}"
        data-ed-payment-method="${method.id}"
        aria-pressed="${selected}"
        aria-disabled="${!method.enabled}"
        ${method.enabled ? "" : "disabled"}
      >
        <span class="ed-payment-method-icon">
          ${method.icon}
        </span>

        <span class="ed-payment-method-copy">
          <span class="ed-payment-method-title">
            <strong>${method.name}</strong>
            <small>${method.badge}</small>
          </span>

          <p>${method.description}</p>
          <b>${method.status}</b>
        </span>

        <span
          class="ed-payment-indicator"
          aria-hidden="true"
        >
          ${selected ? "✓" : ""}
        </span>
      </button>
    `;
  }

  function renderDetails(methodId) {
    if (methodId === "card") {
      return `
        <div class="ed-payment-detail-card">
          <div class="ed-payment-detail-heading">
            <span>🛡️</span>

            <div>
              <strong>Pago protegido</strong>
              <p>
                Los datos de tarjeta se capturarán
                únicamente dentro del procesador
                certificado que conectemos.
              </p>
            </div>
          </div>

          <div class="ed-payment-security-row">
            <span>🔐 Datos cifrados</span>
            <span>🧾 Comprobante digital</span>
            <span>✅ Validación bancaria</span>
          </div>

          <p class="ed-payment-demo-warning">
            Modo de desarrollo: esta pantalla no solicita
            ni almacena números de tarjeta.
          </p>
        </div>
      `;
    }

    if (methodId === "spei") {
      return `
        <div class="ed-payment-detail-card">
          <div class="ed-payment-detail-heading">
            <span>🏦</span>

            <div>
              <strong>Transferencia bancaria</strong>
              <p>
                Al confirmar el pedido se generarán
                instrucciones para realizar la transferencia.
              </p>
            </div>
          </div>

          <ol class="ed-payment-instructions">
            <li>Confirma tu pedido.</li>
            <li>Recibe la referencia de pago.</li>
            <li>Realiza la transferencia desde tu banco.</li>
            <li>Conserva el comprobante.</li>
          </ol>
        </div>
      `;
    }

    if (methodId === "cash") {
      return `
        <div class="ed-payment-detail-card">
          <div class="ed-payment-detail-heading">
            <span>💵</span>

            <div>
              <strong>Pago mediante referencia</strong>
              <p>
                Los establecimientos, vigencia y posibles
                comisiones aparecerán antes de generar
                el pedido.
              </p>
            </div>
          </div>

          <p class="ed-payment-demo-warning">
            La referencia real se habilitará cuando
            conectemos un proveedor autorizado.
          </p>
        </div>
      `;
    }

    return `
      <div class="ed-payment-detail-card is-empty">
        <span>💳</span>

        <div>
          <strong>Selecciona un método de pago</strong>
          <p>
            Aquí aparecerán sus condiciones,
            instrucciones y protecciones.
          </p>
        </div>
      </div>
    `;
  }

  function renderCoupon(saved) {
    return `
      <section class="ed-payment-benefits">
        <div class="ed-payment-section-title">
          <div>
            <small>BENEFICIOS E&D</small>
            <strong>Cupón y recompensas</strong>
          </div>

          <span>🎁</span>
        </div>

        <div class="ed-payment-coupon">
          <label for="edPaymentCoupon">
            Código de cupón
          </label>

          <div>
            <input
              id="edPaymentCoupon"
              type="text"
              inputmode="text"
              autocomplete="off"
              maxlength="30"
              placeholder="Escribe tu código"
              value="${escapeHtml(saved.coupon || "")}"
            />

            <button
              type="button"
              data-ed-apply-coupon
            >
              Aplicar
            </button>
          </div>

          <p
            id="edPaymentCouponMessage"
            hidden
          ></p>
        </div>

        <div class="ed-payment-rewards">
          <div>
            <span>💰</span>

            <p>
              <strong>Cashback E&D</strong>
              <small>
                Se calculará en el resumen final
                según los productos y promociones.
              </small>
            </p>
          </div>

          <b>Por calcular</b>
        </div>

        <div class="ed-payment-rewards is-future">
          <div>
            <span>⭐</span>

            <p>
              <strong>Puntos E&D Rewards</strong>
              <small>
                Programa de recompensas en preparación.
              </small>
            </p>
          </div>

          <b>Próximamente</b>
        </div>
      </section>
    `;
  }

  function render() {
    const saved = load();
    const selectedId = saved.methodId || "";

    return `
      <section class="ed-payment-screen">
        <div class="ed-step-heading">
          <span class="ed-step-heading-icon">💳</span>

          <div>
            <small>PASO 4 DE 6</small>
            <h2>Selecciona cómo pagar</h2>

            <p>
              Elige la opción que prefieras.
              No se realizará ningún cargo hasta
              confirmar el pedido.
            </p>
          </div>
        </div>

        <div class="ed-payment-development">
          <span>🧪</span>

          <div>
            <strong>Entorno de desarrollo</strong>
            <p>
              Los métodos se pueden probar visualmente,
              pero todavía no procesan dinero real.
            </p>
          </div>
        </div>

        <div class="ed-payment-section-title">
          <div>
            <small>MÉTODOS DISPONIBLES</small>
            <strong>Forma de pago</strong>
          </div>

          <span>
            ${PAYMENT_METHODS.filter(
              method => method.enabled
            ).length} opciones
          </span>
        </div>

        <div
          id="edPaymentMethods"
          class="ed-payment-methods"
        >
          ${PAYMENT_METHODS
            .map(method =>
              renderMethod(method, selectedId)
            )
            .join("")}
        </div>

        <input
          id="edPaymentSelected"
          type="hidden"
          value="${escapeHtml(selectedId)}"
        />

        <div
          id="edPaymentDetails"
          class="ed-payment-details"
        >
          ${renderDetails(selectedId)}
        </div>

        ${renderCoupon(saved)}

        <p
          id="edPaymentMessage"
          class="ed-form-message"
          hidden
        ></p>

        <div class="ed-payment-trust">
          <span>🔒</span>

          <div>
            <strong>Checkout seguro E&D</strong>
            <p>
              E&D Market no almacenará datos completos
              de tarjetas. Los pagos se procesarán mediante
              servicios especializados y autorizados.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function selectMethod(container, methodId) {
    const method = PAYMENT_METHODS.find(
      item =>
        item.id === methodId &&
        item.enabled
    );

    if (!method) return;

    const input = container.querySelector(
      "#edPaymentSelected"
    );

    if (input) {
      input.value = method.id;
    }

    container
      .querySelectorAll(
        "[data-ed-payment-method]"
      )
      .forEach(button => {
        const selected =
          button.dataset.edPaymentMethod ===
          method.id;

        button.classList.toggle(
          "is-selected",
          selected
        );

        button.setAttribute(
          "aria-pressed",
          String(selected)
        );

        const indicator = button.querySelector(
          ".ed-payment-indicator"
        );

        if (indicator) {
          indicator.textContent =
            selected ? "✓" : "";
        }
      });

    const details = container.querySelector(
      "#edPaymentDetails"
    );

    if (details) {
      details.innerHTML =
        renderDetails(method.id);
    }
  }

  function applyCoupon(container) {
    const input = container.querySelector(
      "#edPaymentCoupon"
    );

    const message = container.querySelector(
      "#edPaymentCouponMessage"
    );

    const coupon = String(
      input?.value || ""
    )
      .trim()
      .toUpperCase();

    if (!message) return;

    message.hidden = false;

    if (!coupon) {
      message.className = "is-error";
      message.textContent =
        "Escribe un código para validarlo.";

      return;
    }

    message.className = "is-info";
    message.textContent =
      "El cupón se verificará en el resumen antes de confirmar.";

    if (input) {
      input.value = coupon;
    }
  }

  function mount(container) {
    if (!container) return;

    container
      .querySelectorAll(
        "[data-ed-payment-method]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectMethod(
              container,
              button.dataset.edPaymentMethod
            );
          }
        );
      });

    container
      .querySelector("[data-ed-apply-coupon]")
      ?.addEventListener("click", () => {
        applyCoupon(container);
      });
  }

  function showMessage(container, message) {
    const element = container?.querySelector(
      "#edPaymentMessage"
    );

    if (!element) return;

    element.hidden = false;
    element.textContent = message;
  }

  function validate(container) {
    const selectedId =
      container?.querySelector(
        "#edPaymentSelected"
      )?.value;

    const method = PAYMENT_METHODS.find(
      item =>
        item.id === selectedId &&
        item.enabled
    );

    if (!method) {
      showMessage(
        container,
        "Selecciona un método de pago para continuar."
      );

      return {
        valid: false
      };
    }

    const coupon = String(
      container?.querySelector(
        "#edPaymentCoupon"
      )?.value || ""
    )
      .trim()
      .toUpperCase();

    const payment = save({
      methodId: method.id,
      name: method.name,
      badge: method.badge,
      coupon,
      processingStatus:
        "pending_configuration",
      testMode: true,
      selectedAt:
        new Date().toISOString()
    });

    return {
      valid: true,
      data: payment
    };
  }

  EDCore.checkoutPayment = {
    version: "1.4.0",
    methods: [...PAYMENT_METHODS],
    load,
    save,
    render,
    mount,
    validate
  };

  console.log(
    "✓ E&D Checkout Payment v1.4.0 cargado"
  );
})();
