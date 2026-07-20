(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const STORAGE_KEY =
    "edmarket-checkout-summary-v1";

  const SHOPIFY_CART_KEY =
    "edmarket-shopify-cart-v1";

  let currentSummary = null;

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatMoney(
    amount,
    currency = "MXN"
  ) {
    const value = Number(amount || 0);

    try {
      return new Intl.NumberFormat(
        "es-MX",
        {
          style: "currency",
          currency,
          minimumFractionDigits: 2
        }
      ).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  }

  function loadSavedSummary() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch {
      return {};
    }
  }

  function saveSummary(summary) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(summary)
    );

    currentSummary = summary;

    return summary;
  }

  function getCheckoutData() {
    return {
      account:
        EDCore.checkoutAccount?.load?.() ||
        {},
      address:
        EDCore.checkoutAddress?.load?.() ||
        {},
      shipping:
        EDCore.checkoutShipping?.load?.() ||
        {},
      payment:
        EDCore.checkoutPayment?.load?.() ||
        {}
    };
  }

  function getCartId() {
    return localStorage.getItem(
      SHOPIFY_CART_KEY
    ) || "";
  }

  async function getCart() {
    const cartId = getCartId();

    if (
      !cartId ||
      !window.EDShopifyCart?.getCart
    ) {
      return null;
    }

    try {
      return await window.EDShopifyCart.getCart(
        cartId
      );
    } catch (error) {
      console.warn(
        "No se pudo recuperar el carrito:",
        error
      );

      return null;
    }
  }

  function formatAddress(address = {}) {
    const firstLine = [
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

    const secondLine = [
      address.neighborhood,
      address.city,
      address.state
    ]
      .filter(Boolean)
      .join(", ");

    const postalCode =
      address.postalCode
        ? `C.P. ${address.postalCode}`
        : "";

    return [
      firstLine,
      secondLine,
      postalCode
    ].filter(Boolean);
  }

  function renderHeader() {
    return `
      <div class="ed-step-heading">
        <span class="ed-step-heading-icon">
          🧾
        </span>

        <div>
          <small>PASO 5 DE 6</small>

          <h2>Revisa tu pedido</h2>

          <p>
            Confirma que tus productos,
            entrega y forma de pago sean
            correctos antes de continuar.
          </p>
        </div>
      </div>
    `;
  }

  function renderLoading() {
    return `
      <section class="ed-summary-screen">
        ${renderHeader()}

        <div class="ed-summary-loading">
          <span class="ed-summary-spinner">
          </span>

          <div>
            <strong>
              Preparando tu resumen
            </strong>

            <p>
              Estamos recuperando los datos
              del carrito y del checkout.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function renderProducts(cart) {
    const lines =
      cart?.lines?.nodes || [];

    if (!lines.length) {
      return `
        <div class="ed-summary-empty-cart">
          <span>🛒</span>

          <div>
            <strong>
              No hay productos disponibles
            </strong>

            <p>
              Abriste el checkout de prueba
              sin un carrito activo.
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="ed-summary-products">
        ${lines.map((line, index) => {
          const productTitle =
            line?.merchandise?.product?.title ||
            "Producto E&D Market";

          const variantTitle =
            line?.merchandise?.title || "";

          const quantity =
            Number(line?.quantity || 1);

          return `
            <article class="ed-summary-product">
              <div class="ed-summary-product-image">
                <span>📦</span>
              </div>

              <div class="ed-summary-product-copy">
                <small>
                  PRODUCTO ${index + 1}
                </small>

                <strong>
                  ${escapeHtml(productTitle)}
                </strong>

                ${
                  variantTitle &&
                  variantTitle !==
                    "Default Title"
                    ? `
                      <p>
                        ${escapeHtml(
                          variantTitle
                        )}
                      </p>
                    `
                    : ""
                }

                <span>
                  Cantidad: ${quantity}
                </span>
              </div>

              <b>
                ×${quantity}
              </b>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderDelivery(data) {
    const addressLines =
      formatAddress(data.address);

    return `
      <article class="ed-summary-info-card">
        <div class="ed-summary-info-icon">
          📍
        </div>

        <div class="ed-summary-info-copy">
          <small>ENTREGA</small>

          <strong>
            ${
              escapeHtml(
                data.shipping.name ||
                "Método por confirmar"
              )
            }
          </strong>

          <p>
            ${
              escapeHtml(
                data.shipping.time ||
                "Tiempo por confirmar"
              )
            }
          </p>

          ${
            addressLines.length
              ? `
                <address>
                  ${addressLines
                    .map(line =>
                      `<span>${escapeHtml(
                        line
                      )}</span>`
                    )
                    .join("")}
                </address>
              `
              : `
                <p>
                  Dirección no disponible.
                </p>
              `
          }
        </div>

        <button
          type="button"
          data-ed-summary-edit="address"
        >
          Editar
        </button>
      </article>
    `;
  }

  function renderPayment(data) {
    return `
      <article class="ed-summary-info-card">
        <div class="ed-summary-info-icon">
          💳
        </div>

        <div class="ed-summary-info-copy">
          <small>FORMA DE PAGO</small>

          <strong>
            ${
              escapeHtml(
                data.payment.name ||
                "Método por confirmar"
              )
            }
          </strong>

          <p>
            ${
              data.payment.testMode
                ? "Modo de prueba: no se realizará ningún cargo."
                : "El pago se procesará al confirmar."
            }
          </p>

          ${
            data.payment.coupon
              ? `
                <span class="ed-summary-coupon">
                  🎟 Cupón:
                  ${escapeHtml(
                    data.payment.coupon
                  )}
                </span>
              `
              : ""
          }
        </div>

        <button
          type="button"
          data-ed-summary-edit="payment"
        >
          Editar
        </button>
      </article>
    `;
  }

  function renderContact(data) {
    return `
      <article class="ed-summary-info-card">
        <div class="ed-summary-info-icon">
          👤
        </div>

        <div class="ed-summary-info-copy">
          <small>CONTACTO</small>

          <strong>
            ${
              escapeHtml(
                data.account.name ||
                "Cliente invitado"
              )
            }
          </strong>

          <p>
            ${
              escapeHtml(
                data.account.email || ""
              )
            }
          </p>

          <p>
            ${
              escapeHtml(
                data.account.phone || ""
              )
            }
          </p>
        </div>

        <button
          type="button"
          data-ed-summary-edit="account"
        >
          Editar
        </button>
      </article>
    `;
  }

  function renderTotals(cart) {
    const subtotal =
      cart?.cost?.subtotalAmount;

    const currency =
      subtotal?.currencyCode || "MXN";

    const subtotalValue =
      Number(subtotal?.amount || 0);

    const hasCart =
      Number(cart?.totalQuantity || 0) > 0;

    return `
      <section class="ed-summary-total-card">
        <div class="ed-summary-total-title">
          <div>
            <small>RESUMEN DE PAGO</small>
            <strong>Total del pedido</strong>
          </div>

          <span>🔒</span>
        </div>

        <div class="ed-summary-total-row">
          <span>
            Subtotal
            ${
              hasCart
                ? `(${cart.totalQuantity} artículos)`
                : ""
            }
          </span>

          <b>
            ${
              hasCart
                ? formatMoney(
                    subtotalValue,
                    currency
                  )
                : "Por calcular"
            }
          </b>
        </div>

        <div class="ed-summary-total-row">
          <span>Envío</span>
          <b>Por confirmar</b>
        </div>

        <div class="ed-summary-total-row">
          <span>Descuento</span>
          <b>$0.00</b>
        </div>

        <div class="ed-summary-total-row is-benefit">
          <span>Cashback E&D</span>
          <b>Por calcular</b>
        </div>

        <div class="ed-summary-grand-total">
          <div>
            <small>TOTAL ESTIMADO</small>

            <strong>
              ${
                hasCart
                  ? formatMoney(
                      subtotalValue,
                      currency
                    )
                  : "Pendiente"
              }
            </strong>
          </div>

          <span>MXN</span>
        </div>

        <p>
          El total definitivo se confirmará
          cuando se calculen envío, promociones
          y forma de pago.
        </p>
      </section>
    `;
  }

  function buildSummary(cart) {
    const data = getCheckoutData();

    const summary = {
      ...data,
      cart: cart
        ? {
            id: cart.id || "",
            totalQuantity:
              Number(
                cart.totalQuantity || 0
              ),
            subtotalAmount:
              Number(
                cart.cost
                  ?.subtotalAmount
                  ?.amount || 0
              ),
            currencyCode:
              cart.cost
                ?.subtotalAmount
                ?.currencyCode ||
              "MXN",
            lines:
              cart.lines?.nodes || []
          }
        : null,
      testMode: true,
      reviewedAt:
        new Date().toISOString()
    };

    return saveSummary(summary);
  }

  function renderSummary(cart) {
    const data = getCheckoutData();

    return `
      <section class="ed-summary-screen">
        ${renderHeader()}

        <section class="ed-summary-section">
          <div class="ed-summary-section-heading">
            <div>
              <small>TU COMPRA</small>
              <strong>Productos</strong>
            </div>

            <span>
              ${
                Number(
                  cart?.totalQuantity || 0
                )
              } artículos
            </span>
          </div>

          ${renderProducts(cart)}
        </section>

        <section class="ed-summary-section">
          <div class="ed-summary-section-heading">
            <div>
              <small>DATOS DEL PEDIDO</small>
              <strong>Entrega y pago</strong>
            </div>
          </div>

          <div class="ed-summary-info-list">
            ${renderDelivery(data)}
            ${renderPayment(data)}
            ${renderContact(data)}
          </div>
        </section>

        ${renderTotals(cart)}

        <label class="ed-summary-confirmation">
          <input
            id="edSummaryConfirmed"
            type="checkbox"
          />

          <span>
            <b>
              Revisé los datos de mi pedido
            </b>

            <small>
              Confirmo que la información
              mostrada es correcta.
            </small>
          </span>
        </label>

        <p
          id="edSummaryMessage"
          class="ed-form-message"
          hidden
        ></p>

        <div class="ed-summary-security">
          <span>🛡️</span>

          <div>
            <strong>
              Compra protegida E&D
            </strong>

            <p>
              Este entorno continúa en modo
              de desarrollo y todavía no
              genera cargos ni pedidos reales.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function bindEditButtons(container) {
    container
      .querySelectorAll(
        "[data-ed-summary-edit]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            EDCore.checkoutShell?.goTo?.(
              button.dataset.edSummaryEdit
            );
          }
        );
      });
  }

  async function mount(container) {
    if (!container) return;

    const cart = await getCart();

    buildSummary(cart);

    container.innerHTML =
      renderSummary(cart);

    bindEditButtons(container);
  }

  function render() {
    return renderLoading();
  }

  function showMessage(container, message) {
    const element = container?.querySelector(
      "#edSummaryMessage"
    );

    if (!element) return;

    element.hidden = false;
    element.textContent = message;
  }

  function validate(container) {
    const confirmed =
      container?.querySelector(
        "#edSummaryConfirmed"
      )?.checked;

    if (!confirmed) {
      showMessage(
        container,
        "Confirma que revisaste los datos del pedido."
      );

      return {
        valid: false
      };
    }

    const summary =
      currentSummary ||
      loadSavedSummary();

    const reviewedSummary = {
      ...summary,
      confirmed: true,
      confirmedAt:
        new Date().toISOString()
    };

    saveSummary(reviewedSummary);

    return {
      valid: true,
      data: reviewedSummary
    };
  }

  EDCore.checkoutSummary = {
    version: "1.5.0",
    render,
    mount,
    validate,
    load: loadSavedSummary,
    save: saveSummary
  };

  console.log(
    "✓ E&D Checkout Summary v1.5.0 cargado"
  );
})();
