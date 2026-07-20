(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const ORDERS_KEY =
    "edmarket-orders-v1";

  const ACTIVE_ORDER_KEY =
    "edmarket-active-order-v1";

  let currentOrder = null;

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadOrders() {
    try {
      const value = JSON.parse(
        localStorage.getItem(ORDERS_KEY) || "[]"
      );

      return Array.isArray(value)
        ? value
        : [];
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(orders)
    );

    return orders;
  }

  function loadActiveOrder() {
    try {
      return JSON.parse(
        localStorage.getItem(
          ACTIVE_ORDER_KEY
        ) || "null"
      );
    } catch {
      return null;
    }
  }

  function saveActiveOrder(order) {
    localStorage.setItem(
      ACTIVE_ORDER_KEY,
      JSON.stringify(order)
    );

    currentOrder = order;

    return order;
  }

  function randomCode(length = 6) {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    const values = new Uint8Array(length);

    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      for (
        let index = 0;
        index < values.length;
        index += 1
      ) {
        values[index] =
          Math.floor(Math.random() * 256);
      }
    }

    return Array.from(
      values,
      value =>
        alphabet[
          value % alphabet.length
        ]
    ).join("");
  }

  function formatDateCode(date) {
    const year = date
      .getFullYear()
      .toString();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}${month}${day}`;
  }

  function generateOrderId() {
    const dateCode =
      formatDateCode(new Date());

    const existingIds = new Set(
      loadOrders().map(order => order.id)
    );

    let id = "";

    do {
      id =
        `EDM-${dateCode}-${randomCode(6)}`;
    } while (existingIds.has(id));

    return id;
  }

  function createFingerprint(summary = {}) {
    return [
      summary.confirmedAt || "",
      summary.cart?.id || "",
      summary.account?.email || "",
      summary.cart?.totalQuantity || 0
    ].join("|");
  }

  function getPaymentStatus(payment = {}) {
    if (payment.methodId === "spei") {
      return "pending_transfer";
    }

    if (payment.methodId === "cash") {
      return "pending_reference";
    }

    if (payment.methodId === "card") {
      return "pending_processor";
    }

    return "pending_payment";
  }

  function getStatusLabel(status) {
    const labels = {
      pending_payment:
        "Pendiente de pago",
      pending_transfer:
        "Esperando transferencia",
      pending_reference:
        "Referencia pendiente",
      pending_processor:
        "Procesador pendiente",
      paid:
        "Pago confirmado",
      preparing:
        "Preparando pedido",
      shipped:
        "Enviado",
      delivered:
        "Entregado",
      cancelled:
        "Cancelado"
    };

    return labels[status] ||
      "Pendiente";
  }

  function createOrder(summary) {
    if (!summary?.confirmed) {
      throw new Error(
        "El resumen todavía no ha sido confirmado."
      );
    }

    const fingerprint =
      createFingerprint(summary);

    const activeOrder =
      loadActiveOrder();

    if (
      activeOrder &&
      activeOrder.fingerprint === fingerprint
    ) {
      currentOrder = activeOrder;
      return activeOrder;
    }

    const now = new Date();

    const order = {
      id: generateOrderId(),
      fingerprint,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status:
        getPaymentStatus(
          summary.payment
        ),
      statusLabel:
        getStatusLabel(
          getPaymentStatus(
            summary.payment
          )
        ),
      testMode: true,

      customer: {
        name:
          summary.account?.name || "",
        email:
          summary.account?.email || "",
        phone:
          summary.account?.phone || ""
      },

      address: {
        ...(summary.address || {})
      },

      shipping: {
        ...(summary.shipping || {})
      },

      payment: {
        methodId:
          summary.payment?.methodId || "",
        name:
          summary.payment?.name || "",
        coupon:
          summary.payment?.coupon || "",
        processingStatus:
          summary.payment
            ?.processingStatus ||
          "pending_configuration"
      },

      cart: {
        id:
          summary.cart?.id || "",
        totalQuantity:
          Number(
            summary.cart
              ?.totalQuantity || 0
          ),
        subtotalAmount:
          Number(
            summary.cart
              ?.subtotalAmount || 0
          ),
        currencyCode:
          summary.cart
            ?.currencyCode ||
          "MXN",
        lines:
          Array.isArray(
            summary.cart?.lines
          )
            ? summary.cart.lines
            : []
      },

      totals: {
        subtotal:
          Number(
            summary.cart
              ?.subtotalAmount || 0
          ),
        shipping: null,
        discount: 0,
        cashback: null,
        total:
          Number(
            summary.cart
              ?.subtotalAmount || 0
          ),
        currency:
          summary.cart
            ?.currencyCode ||
          "MXN"
      },

      timeline: [
        {
          status: "created",
          label:
            "Pedido de prueba generado",
          createdAt: now.toISOString()
        },
        {
          status:
            getPaymentStatus(
              summary.payment
            ),
          label:
            getStatusLabel(
              getPaymentStatus(
                summary.payment
              )
            ),
          createdAt: now.toISOString()
        }
      ]
    };

    const orders = loadOrders();

    orders.unshift(order);

    saveOrders(
      orders.slice(0, 50)
    );

    saveActiveOrder(order);

    return order;
  }

  function formatMoney(
    value,
    currency = "MXN"
  ) {
    try {
      return new Intl.NumberFormat(
        "es-MX",
        {
          style: "currency",
          currency,
          minimumFractionDigits: 2
        }
      ).format(Number(value || 0));
    } catch {
      return `$${Number(
        value || 0
      ).toFixed(2)}`;
    }
  }

  function formatDate(value) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat(
        "es-MX",
        {
          dateStyle: "long",
          timeStyle: "short"
        }
      ).format(new Date(value));
    } catch {
      return value;
    }
  }

  function formatAddress(address = {}) {
    return [
      [
        address.street,
        address.exterior
          ? `#${address.exterior}`
          : "",
        address.interior
          ? `Int. ${address.interior}`
          : ""
      ]
        .filter(Boolean)
        .join(" "),

      [
        address.neighborhood,
        address.city,
        address.state
      ]
        .filter(Boolean)
        .join(", "),

      address.postalCode
        ? `C.P. ${address.postalCode}`
        : ""
    ].filter(Boolean);
  }

  function renderLoading() {
    return `
      <section class="ed-order-screen">
        <div class="ed-order-loading">
          <span class="ed-summary-spinner">
          </span>

          <div>
            <strong>
              Generando tu pedido
            </strong>

            <p>
              Estamos preparando el folio
              y guardando la información.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function renderError(message) {
    return `
      <section class="ed-order-screen">
        <div class="ed-order-error">
          <span>⚠️</span>

          <div>
            <small>PASO 6 DE 6</small>

            <h2>
              No pudimos generar el pedido
            </h2>

            <p>
              ${escapeHtml(message)}
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function renderProducts(order) {
    const lines =
      order.cart?.lines || [];

    if (!lines.length) {
      return `
        <p class="ed-order-no-products">
          Pedido de prueba sin productos
          vinculados.
        </p>
      `;
    }

    return `
      <div class="ed-order-products">
        ${lines
          .map(line => {
            const title =
              line?.merchandise
                ?.product?.title ||
              "Producto E&D Market";

            const variant =
              line?.merchandise
                ?.title || "";

            return `
              <div class="ed-order-product">
                <span>📦</span>

                <div>
                  <strong>
                    ${escapeHtml(title)}
                  </strong>

                  ${
                    variant &&
                    variant !==
                      "Default Title"
                      ? `
                        <small>
                          ${escapeHtml(
                            variant
                          )}
                        </small>
                      `
                      : ""
                  }
                </div>

                <b>
                  ×${Number(
                    line.quantity || 1
                  )}
                </b>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderOrder(order) {
    const addressLines =
      formatAddress(order.address);

    return `
      <section class="ed-order-screen">
        <div class="ed-order-success">
          <span class="ed-order-success-icon">
            ✓
          </span>

          <small>PASO 6 DE 6</small>

          <h2>
            ¡Pedido generado!
          </h2>

          <p>
            Tu solicitud se guardó
            correctamente en modo de prueba.
          </p>
        </div>

        <section class="ed-order-folio-card">
          <small>FOLIO DEL PEDIDO</small>

          <div>
            <strong id="edOrderId">
              ${escapeHtml(order.id)}
            </strong>

            <button
              type="button"
              data-ed-copy-order
            >
              Copiar
            </button>
          </div>

          <p>
            Conserva este folio para soporte,
            seguimiento, garantías y
            devoluciones.
          </p>

          <span
            id="edOrderCopyMessage"
            hidden
          ></span>
        </section>

        <div class="ed-order-status-card">
          <span>🕒</span>

          <div>
            <small>ESTADO ACTUAL</small>

            <strong>
              ${escapeHtml(
                order.statusLabel
              )}
            </strong>

            <p>
              ${escapeHtml(
                formatDate(
                  order.createdAt
                )
              )}
            </p>
          </div>

          <b>PRUEBA</b>
        </div>

        <section class="ed-order-section">
          <div class="ed-order-section-title">
            <small>RESUMEN</small>
            <strong>Datos del pedido</strong>
          </div>

          <div class="ed-order-data-grid">
            <article>
              <span>👤</span>

              <div>
                <small>CLIENTE</small>

                <strong>
                  ${escapeHtml(
                    order.customer.name ||
                    "Cliente invitado"
                  )}
                </strong>

                <p>
                  ${escapeHtml(
                    order.customer.email
                  )}
                </p>
              </div>
            </article>

            <article>
              <span>🚚</span>

              <div>
                <small>ENVÍO</small>

                <strong>
                  ${escapeHtml(
                    order.shipping.name ||
                    "Por confirmar"
                  )}
                </strong>

                <p>
                  ${escapeHtml(
                    order.shipping.time ||
                    ""
                  )}
                </p>
              </div>
            </article>

            <article>
              <span>💳</span>

              <div>
                <small>PAGO</small>

                <strong>
                  ${escapeHtml(
                    order.payment.name ||
                    "Por confirmar"
                  )}
                </strong>

                <p>
                  Sin cargos reales
                </p>
              </div>
            </article>

            <article>
              <span>📍</span>

              <div>
                <small>ENTREGA EN</small>

                <strong>
                  ${escapeHtml(
                    addressLines[0] ||
                    "Dirección pendiente"
                  )}
                </strong>

                <p>
                  ${escapeHtml(
                    addressLines
                      .slice(1)
                      .join(" · ")
                  )}
                </p>
              </div>
            </article>
          </div>
        </section>

        <section class="ed-order-section">
          <div class="ed-order-section-title">
            <small>PRODUCTOS</small>

            <strong>
              ${Number(
                order.cart
                  ?.totalQuantity || 0
              )} artículos
            </strong>
          </div>

          ${renderProducts(order)}
        </section>

        <section class="ed-order-total">
          <div>
            <small>TOTAL ESTIMADO</small>

            <strong>
              ${formatMoney(
                order.totals.total,
                order.totals.currency
              )}
            </strong>
          </div>

          <span>
            ${escapeHtml(
              order.totals.currency
            )}
          </span>

          <p>
            El envío y las promociones
            todavía pueden modificar el
            total definitivo.
          </p>
        </section>

        <div class="ed-order-next-steps">
          <div class="ed-order-next-title">
            <span>📋</span>

            <div>
              <strong>
                ¿Qué sigue?
              </strong>

              <p>
                Flujo temporal para pruebas.
              </p>
            </div>
          </div>

          <ol>
            <li>
              Conserva el folio del pedido.
            </li>

            <li>
              E&D Market confirmará el pago.
            </li>

            <li>
              El pedido pasará a preparación.
            </li>

            <li>
              Recibirás información del envío.
            </li>
          </ol>
        </div>

        <div class="ed-order-development-note">
          <span>🧪</span>

          <div>
            <strong>
              Pedido de desarrollo
            </strong>

            <p>
              Este pedido está guardado
              únicamente en este dispositivo.
              Todavía no se envía al administrador
              ni se almacena en Firebase.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  async function copyOrderId(container) {
    const orderId =
      currentOrder?.id || "";

    if (!orderId) return;

    const message =
      container.querySelector(
        "#edOrderCopyMessage"
      );

    try {
      await navigator.clipboard.writeText(
        orderId
      );

      if (message) {
        message.hidden = false;
        message.textContent =
          "Folio copiado correctamente.";
      }
    } catch {
      if (message) {
        message.hidden = false;
        message.textContent =
          `Folio: ${orderId}`;
      }
    }
  }

  function mount(container) {
    if (!container) return;

    try {
      const summary =
        EDCore.checkoutSummary?.load?.() ||
        {};

      const order =
        createOrder(summary);

      container.innerHTML =
        renderOrder(order);

      container
        .querySelector(
          "[data-ed-copy-order]"
        )
        ?.addEventListener(
          "click",
          () => copyOrderId(container)
        );
    } catch (error) {
      console.error(
        "No se pudo crear el pedido:",
        error
      );

      container.innerHTML =
        renderError(
          error?.message ||
          "Ocurrió un error inesperado."
        );
    }
  }

  function render() {
    return renderLoading();
  }

  function validate() {
    if (!currentOrder?.id) {
      return {
        valid: false,
        message:
          "El pedido todavía no está listo."
      };
    }

    return {
      valid: true,
      data: currentOrder
    };
  }

  EDCore.checkoutOrders = {
    version: "1.6.0",
    render,
    mount,
    validate,
    createOrder,
    load: loadOrders,
    loadActive: loadActiveOrder
  };

  console.log(
    "✓ E&D Checkout Orders v1.6.0 cargado"
  );
})();
