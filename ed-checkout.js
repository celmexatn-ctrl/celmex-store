(function () {
  "use strict";

  const CART_KEY = "edmarket-shopify-cart-v1";
  const CUSTOMER_KEY = "edmarket-checkout-customer-v1";

  let checkoutCart = null;

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(amount, currency = "MXN") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency
    }).format(Number(amount || 0));
  }

  function loadCustomer() {
    try {
      return JSON.parse(
        localStorage.getItem(CUSTOMER_KEY) || "{}"
      );
    } catch {
      return {};
    }
  }

  function saveCustomer(customer) {
    localStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify(customer)
    );
  }

  async function storefrontRequest(query, variables = {}) {
    const config = window.ED_SHOPIFY_CONFIG;

    if (!config?.domain || !config?.publicToken) {
      throw new Error(
        "No se encontró la configuración de la tienda."
      );
    }

    const response = await fetch(
      `https://${config.domain}/api/${config.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token":
            config.publicToken
        },
        body: JSON.stringify({
          query,
          variables
        })
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        `La tienda respondió con código ${response.status}.`
      );
    }

    if (json.errors?.length) {
      throw new Error(
        json.errors
          .map(error => error.message)
          .join("; ")
      );
    }

    return json.data;
  }

  function splitName(fullName = "") {
    const parts = String(fullName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return {
        firstName: "",
        lastName: ""
      };
    }

    if (parts.length === 1) {
      return {
        firstName: parts[0],
        lastName: "."
      };
    }

    return {
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts.at(-1)
    };
  }

  function normalizeMexicoPhone(phone = "") {
    const digits = String(phone).replace(/\D/g, "");

    if (digits.length === 10) {
      return `+52${digits}`;
    }

    if (
      digits.length === 12 &&
      digits.startsWith("52")
    ) {
      return `+${digits}`;
    }

    if (String(phone).trim().startsWith("+")) {
      return String(phone).trim();
    }

    return String(phone).trim();
  }

  function mexicoProvinceCode(state = "") {
    const normalized = String(state)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    const codes = {
      "aguascalientes": "AGS",
      "baja california": "BC",
      "baja california sur": "BCS",
      "campeche": "CAMP",
      "chiapas": "CHIS",
      "chihuahua": "CHIH",
      "ciudad de mexico": "CMX",
      "cdmx": "CMX",
      "coahuila": "COAH",
      "colima": "COL",
      "durango": "DGO",
      "estado de mexico": "MEX",
      "edomex": "MEX",
      "guanajuato": "GTO",
      "guerrero": "GRO",
      "hidalgo": "HGO",
      "jalisco": "JAL",
      "michoacan": "MICH",
      "morelos": "MOR",
      "nayarit": "NAY",
      "nuevo leon": "NL",
      "oaxaca": "OAX",
      "puebla": "PUE",
      "queretaro": "QRO",
      "quintana roo": "QROO",
      "san luis potosi": "SLP",
      "sinaloa": "SIN",
      "sonora": "SON",
      "tabasco": "TAB",
      "tamaulipas": "TAMPS",
      "tlaxcala": "TLAX",
      "veracruz": "VER",
      "yucatan": "YUC",
      "zacatecas": "ZAC"
    };

    return codes[normalized] || "";
  }

  async function updateBuyerIdentity(
    cartId,
    customer
  ) {
    const mutation = `
      mutation UpdateEDBuyer(
        $cartId: ID!
        $buyerIdentity: CartBuyerIdentityInput!
      ) {
        cartBuyerIdentityUpdate(
          cartId: $cartId
          buyerIdentity: $buyerIdentity
        ) {
          cart {
            id
            checkoutUrl
            buyerIdentity {
              email
              phone
              countryCode
            }
          }

          userErrors {
            field
            message
          }

          warnings {
            message
          }
        }
      }
    `;

    const data = await storefrontRequest(
      mutation,
      {
        cartId,
        buyerIdentity: {
          email: customer.email,
          phone: normalizeMexicoPhone(
            customer.phone
          ),
          countryCode: "MX"
        }
      }
    );

    const result = data.cartBuyerIdentityUpdate;

    if (result.userErrors?.length) {
      throw new Error(
        result.userErrors
          .map(error => error.message)
          .join("; ")
      );
    }

    if (!result.cart) {
      throw new Error(
        "No se pudieron guardar los datos de contacto."
      );
    }

    return result.cart;
  }

  async function replaceDeliveryAddress(
    cartId,
    customer
  ) {
    const { firstName, lastName } =
      splitName(customer.name);

    const provinceCode =
      mexicoProvinceCode(customer.state);

    const address2Parts = [
      customer.neighborhood
        ? `Col. ${customer.neighborhood}`
        : "",
      customer.references || ""
    ].filter(Boolean);

    const deliveryAddress = {
      firstName,
      lastName,
      address1: customer.address,
      address2: address2Parts.join(" · "),
      city: customer.city,
      zip: customer.postalCode,
      countryCode: "MX",
      phone: normalizeMexicoPhone(
        customer.phone
      )
    };

    if (provinceCode) {
      deliveryAddress.provinceCode =
        provinceCode;
    }

    const mutation = `
      mutation ReplaceEDDeliveryAddress(
        $cartId: ID!
        $addresses: [CartSelectableAddressInput!]!
      ) {
        cartDeliveryAddressesReplace(
          cartId: $cartId
          addresses: $addresses
        ) {
          cart {
            id
            checkoutUrl
          }

          userErrors {
            field
            message
          }

          warnings {
            message
          }
        }
      }
    `;

    const data = await storefrontRequest(
      mutation,
      {
        cartId,
        addresses: [
          {
            selected: true,
            oneTimeUse: true,
            validationStrategy:
              "COUNTRY_CODE_ONLY",
            address: {
              deliveryAddress
            }
          }
        ]
      }
    );

    const result =
      data.cartDeliveryAddressesReplace;

    if (result.userErrors?.length) {
      throw new Error(
        result.userErrors
          .map(error => error.message)
          .join("; ")
      );
    }

    if (!result.cart) {
      throw new Error(
        "No se pudo guardar la dirección de entrega."
      );
    }

    return result.cart;
  }

  function ensureCheckout() {
    if (document.getElementById("edCheckoutModal")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <dialog id="edCheckoutModal" class="ed-checkout-modal">
        <button
          type="button"
          class="ed-checkout-close"
          data-ed-checkout-close
          aria-label="Cerrar"
        >
          ×
        </button>

        <div class="ed-checkout-shell">
          <header class="ed-checkout-header">
            <img
              src="assets/logo.png"
              alt="E&D Market"
              width="60"
              height="60"
            >

            <div>
              <span>CHECKOUT E&D MARKET</span>
              <h2>Finalizar compra</h2>
              <p>Compra segura, clara y protegida.</p>
            </div>
          </header>

          <div class="ed-checkout-progress">
            <span class="active"><b>1</b> Datos</span>
            <i></i>
            <span><b>2</b> Revisión</span>
            <i></i>
            <span><b>3</b> Pago</span>
          </div>

          <div id="edCheckoutLoading" class="ed-checkout-loading">
            Preparando tu compra…
          </div>

          <form id="edCheckoutForm" class="ed-checkout-layout" hidden>
            <div class="ed-checkout-form-column">
              <section class="ed-checkout-card">
                <div class="ed-checkout-section-title">
                  <span>01</span>
                  <div>
                    <h3>Datos de contacto</h3>
                    <p>Usaremos estos datos para informarte sobre tu pedido.</p>
                  </div>
                </div>

                <div class="ed-checkout-fields">
                  <label class="ed-field-full">
                    <span>Nombre completo</span>
                    <input
                      name="name"
                      type="text"
                      autocomplete="name"
                      required
                    >
                  </label>

                  <label>
                    <span>Correo electrónico</span>
                    <input
                      name="email"
                      type="email"
                      autocomplete="email"
                      required
                    >
                  </label>

                  <label>
                    <span>Teléfono</span>
                    <input
                      name="phone"
                      type="tel"
                      autocomplete="tel"
                      inputmode="tel"
                      required
                    >
                  </label>
                </div>
              </section>

              <section class="ed-checkout-card">
                <div class="ed-checkout-section-title">
                  <span>02</span>
                  <div>
                    <h3>Dirección de entrega</h3>
                    <p>Verifica cuidadosamente los datos.</p>
                  </div>
                </div>

                <div class="ed-checkout-fields">
                  <label class="ed-field-full">
                    <span>Calle y número</span>
                    <input
                      name="address"
                      type="text"
                      autocomplete="street-address"
                      required
                    >
                  </label>

                  <label>
                    <span>Colonia</span>
                    <input
                      name="neighborhood"
                      type="text"
                      required
                    >
                  </label>

                  <label>
                    <span>Código postal</span>
                    <input
                      name="postalCode"
                      type="text"
                      inputmode="numeric"
                      autocomplete="postal-code"
                      maxlength="5"
                      pattern="[0-9]{5}"
                      required
                    >
                  </label>

                  <label>
                    <span>Ciudad</span>
                    <input
                      name="city"
                      type="text"
                      autocomplete="address-level2"
                      required
                    >
                  </label>

                  <label>
                    <span>Estado</span>
                    <input
                      name="state"
                      type="text"
                      autocomplete="address-level1"
                      required
                    >
                  </label>

                  <label class="ed-field-full">
                    <span>Referencias de entrega (opcional)</span>
                    <textarea
                      name="references"
                      rows="3"
                      placeholder="Color de fachada, entre calles, indicaciones…"
                    ></textarea>
                  </label>
                </div>
              </section>

              <section class="ed-checkout-card">
                <div class="ed-checkout-section-title">
                  <span>03</span>
                  <div>
                    <h3>Método de envío</h3>
                    <p>El costo final se confirmará durante el pago.</p>
                  </div>
                </div>

                <label class="ed-shipping-option active">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked
                  >

                  <span class="ed-shipping-icon">🚚</span>

                  <span>
                    <strong>Envío estándar</strong>
                    <small>Entrega según disponibilidad y código postal.</small>
                  </span>

                  <b>Calculado al pagar</b>
                </label>
              </section>
            </div>

            <aside class="ed-checkout-summary-column">
              <section class="ed-checkout-card ed-order-summary">
                <div class="ed-checkout-section-title">
                  <span>🛒</span>
                  <div>
                    <h3>Resumen del pedido</h3>
                    <p id="edCheckoutItemCount"></p>
                  </div>
                </div>

                <div id="edCheckoutProducts"></div>

                <section class="ed-coupon-box">
                  <h4>🎟 Cupón de descuento</h4>

                  <div class="ed-coupon-row">
                    <input
                      id="edCouponInput"
                      type="text"
                      placeholder="Ej. BIENVENIDO10"
                    >

                    <button
                      type="button"
                      id="edApplyCoupon"
                    >
                      Aplicar
                    </button>
                  </div>

                  <small id="edCouponMessage">
                    Ingresa un cupón E&D Market.
                  </small>
                </section>

                <div class="ed-checkout-totals">
                  <div>
                    <span>Subtotal</span>
                    <strong id="edCheckoutSubtotal">—</strong>
                  </div>

                  <div>
                    <span>Envío</span>
                    <strong>Se calcula al pagar</strong>
                  </div>

                  <div class="ed-checkout-total">
                    <span>Total estimado</span>
                    <strong id="edCheckoutTotal">—</strong>
                  </div>
                </div>

                <label class="ed-checkout-consent">
                  <input type="checkbox" required>
                  <span>
                    Confirmo que mis datos son correctos y acepto continuar
                    al pago seguro.
                  </span>
                </label>

                <button
                  id="edContinuePayment"
                  type="submit"
                  class="ed-checkout-pay"
                >
                  Continuar al pago seguro
                </button>

                <div class="ed-checkout-trust">
                  <span>🔒 Pago cifrado</span>
                  <span>🛡️ Compra protegida</span>
                  <span>📦 Seguimiento del pedido</span>
                </div>
              </section>
            </aside>
          </form>
        </div>
      </dialog>
      `
    );
  }

  function fillCustomer() {
    const form = document.getElementById("edCheckoutForm");
    const customer = loadCustomer();

    if (!form) return;

    Object.entries(customer).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);

      if (field && typeof value === "string") {
        field.value = value;
      }
    });
  }

  function renderCart(cart) {
    const products = document.getElementById("edCheckoutProducts");
    const itemCount = document.getElementById("edCheckoutItemCount");
    const subtotal = document.getElementById("edCheckoutSubtotal");
    const total = document.getElementById("edCheckoutTotal");

    const lines = cart?.lines?.nodes || [];

    itemCount.textContent =
      `${cart.totalQuantity || 0} producto(s) en tu carrito`;

    products.innerHTML = lines
      .map(line => {
        const variant = line.merchandise;
        const productTitle = variant?.product?.title || "Producto";
        const variantTitle =
          variant?.title?.toLowerCase() === "default title"
            ? ""
            : variant?.title || "";

        return `
          <article class="ed-checkout-product">
            <div class="ed-checkout-product-placeholder">E&D</div>

            <div>
              <h4>${escapeHtml(productTitle)}</h4>
              ${
                variantTitle
                  ? `<p>${escapeHtml(variantTitle)}</p>`
                  : ""
              }
              <span>Cantidad: ${line.quantity}</span>
            </div>
          </article>
        `;
      })
      .join("");

    const amount = cart.cost?.subtotalAmount;

    const subtotalValue = Number(amount?.amount || 0);

    const checkout =
      window.EDCore?.checkoutController;

    const totals = checkout
      ? (
          checkout.setSubtotal(subtotalValue),
          checkout.calculateTotals()
        )
      : {
          subtotal: subtotalValue,
          total: subtotalValue
        };

    subtotal.textContent = money(
      totals.subtotal,
      amount?.currencyCode
    );

    total.textContent = money(
      totals.total,
      amount?.currencyCode
    );
  }


  function applyEDCoupon() {
    const input = document.getElementById("edCouponInput");
    const message = document.getElementById("edCouponMessage");
    const total = document.getElementById("edCheckoutTotal");

    const checkout =
      window.EDCore?.checkoutController;

    const coupons =
      window.EDCore?.coupons;

    if (!input || !message || !total) return;

    if (!checkout?.applyCoupon) {
      message.textContent =
        "El sistema de cupones no está disponible.";
      return;
    }

    const result = checkout.applyCoupon(input.value);

    const currency =
      checkoutCart?.cost?.subtotalAmount?.currencyCode ||
      "MXN";

    total.textContent = money(
      result.total,
      currency
    );

    message.textContent = result.message || "";

    if (result.valid) {
      coupons?.save?.(result.code);
      input.value = result.code;
    }
  }

  async function openEDCheckout() {
    ensureCheckout();

    const modal = document.getElementById("edCheckoutModal");
    const loading = document.getElementById("edCheckoutLoading");
    const form = document.getElementById("edCheckoutForm");

    modal.showModal();
    document.body.classList.add("ed-checkout-open");

    loading.hidden = false;
    form.hidden = true;

    try {
      const cartId = localStorage.getItem(CART_KEY);

      if (!cartId) {
        throw new Error("Tu carrito está vacío.");
      }

      checkoutCart = await window.EDShopifyCart.getCart(cartId);

      if (
        !checkoutCart ||
        !checkoutCart.totalQuantity ||
        !checkoutCart.checkoutUrl
      ) {
        throw new Error("Tu carrito está vacío o ya no está disponible.");
      }

      renderCart(checkoutCart);
      fillCustomer();

      loading.hidden = true;
      form.hidden = false;
    } catch (error) {
      loading.innerHTML = `
        <strong>No pudimos preparar el checkout.</strong>
        <p>${escapeHtml(error.message)}</p>
        <button type="button" data-ed-checkout-close>
          Volver a la tienda
        </button>
      `;
    }
  }

  function closeEDCheckout() {
    const modal = document.getElementById("edCheckoutModal");

    if (modal?.open) modal.close();

    document.body.classList.remove("ed-checkout-open");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!checkoutCart?.id) return;

    const form = event.currentTarget;

    if (!form.reportValidity()) return;

    const customer = Object.fromEntries(
      new FormData(form).entries()
    );

    saveCustomer(customer);

    const button = document.getElementById(
      "edContinuePayment"
    );

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent =
      "Guardando datos de entrega…";

    try {
      const buyerCart =
        await updateBuyerIdentity(
          checkoutCart.id,
          customer
        );

      button.textContent =
        "Preparando dirección…";

      const updatedCart =
        await replaceDeliveryAddress(
          buyerCart.id,
          customer
        );

      checkoutCart = {
        ...checkoutCart,
        ...updatedCart
      };

      button.textContent =
        "Abriendo pago seguro…";

      window.location.href =
        updatedCart.checkoutUrl ||
        checkoutCart.checkoutUrl;
    } catch (error) {
      console.error(
        "Checkout E&D:",
        error
      );

      button.disabled = false;
      button.textContent = originalText;

      alert(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los datos."
      );
    }
  }


  /*
   * Fase 4.5.4-D
   * Puente oficial entre la tienda y el Checkout Shell modular.
   *
   * Valores admitidos:
   * - "modular": utiliza el nuevo flujo por pasos.
   * - "legacy": utiliza temporalmente el checkout anterior.
   */
  const OFFICIAL_CHECKOUT_MODE_KEY =
    "edmarket-checkout-mode-v454";

  function getOfficialCheckoutMode() {
    return (
      localStorage.getItem(
        OFFICIAL_CHECKOUT_MODE_KEY
      ) || "modular"
    );
  }

  function openOfficialCheckout() {
    const mode = getOfficialCheckoutMode();

    if (
      mode !== "legacy" &&
      window.EDCore?.checkoutShell?.open
    ) {
      try {
        return window.EDCore.checkoutShell.open();
      } catch (error) {
        console.error(
          "Checkout modular E&D:",
          error
        );

        console.warn(
          "Se abrirá temporalmente el checkout anterior."
        );
      }
    }

    return openEDCheckout();
  }

  function closeOfficialCheckout() {
    window.EDCore?.checkoutShell?.close?.();
    closeEDCheckout();
  }

  function useModularCheckout() {
    localStorage.setItem(
      OFFICIAL_CHECKOUT_MODE_KEY,
      "modular"
    );

    console.log(
      "✓ Checkout modular establecido como oficial."
    );

    return "modular";
  }

  function useLegacyCheckout() {
    localStorage.setItem(
      OFFICIAL_CHECKOUT_MODE_KEY,
      "legacy"
    );

    console.log(
      "✓ Checkout anterior activado temporalmente."
    );

    return "legacy";
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureCheckout();

    document
      .getElementById("edCheckoutForm")
      ?.addEventListener("submit", handleSubmit);

    document
      .getElementById("edApplyCoupon")
      ?.addEventListener("click", applyEDCoupon);

    /*
     * Checkout oficial E&D Market.
     * El flujo modular es la opción predeterminada.
     */
    window.openQuote = openOfficialCheckout;
    window.openEDCheckout = openOfficialCheckout;
    window.openEDCheckoutLegacy = openEDCheckout;
    window.openEDFlowCheckoutOfficial =
      openOfficialCheckout;

    document
      .querySelectorAll('[onclick="openQuote()"]')
      .forEach(element => {
        element.onclick = openOfficialCheckout;
      });

    setTimeout(() => {
      window.openQuote = openOfficialCheckout;
      window.openEDCheckout =
        openOfficialCheckout;

      document
        .querySelectorAll('[onclick="openQuote()"]')
        .forEach(element => {
          element.onclick =
            openOfficialCheckout;
        });
    }, 1200);

  });

  document.addEventListener("click", event => {
    if (event.target.closest("[data-ed-checkout-close]")) {
      closeEDCheckout();
    }
  });

  window.EDCheckout = {
    version: "4.5.4-D",
    open: openOfficialCheckout,
    close: closeOfficialCheckout,
    openLegacy: openEDCheckout,
    closeLegacy: closeEDCheckout,
    useModular: useModularCheckout,
    useLegacy: useLegacyCheckout,
    getMode: getOfficialCheckoutMode
  };

})();
