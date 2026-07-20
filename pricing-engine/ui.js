(function () {
  "use strict";

  const STORAGE_KEY =
    "edmarket-pricing-engine-v02";

  const HISTORY_KEY =
    "edmarket-pricing-history-v02";

  const DEFAULT_CONFIG = {
    exchangeRate: 18,
    exchangeBufferPercent: 2,
    importBufferPercent: 0,
    returnsReservePercent: 2,
    shopifyExternalPercent: 0,
    minimumProfit: 25,
    fixedProfit: 50,
    minimumMarginPercent: 10,
    roundingIncrement: 10,

    paymentMethods: {
      mercadoPago: {
        label: "Mercado Pago",
        enabled: false,
        percentFee: 0,
        fixedFee: 0,
        serviceTaxPercent: 16
      },

      stripe: {
        label: "Stripe",
        enabled: false,
        percentFee: 0,
        fixedFee: 0,
        serviceTaxPercent: 16
      },

      shopifyPayments: {
        label: "Shopify Payments",
        enabled: false,
        percentFee: 0,
        fixedFee: 0,
        serviceTaxPercent: 16
      }
    }
  };

  let lastResult = null;

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  function money(value) {
    return new Intl.NumberFormat(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2
      }
    ).format(number(value));
  }

  function roundMoney(value) {
    return Math.round(
      (number(value) + Number.EPSILON) * 100
    ) / 100;
  }

  function percentOf(value, percent) {
    return number(value) *
      (number(percent) / 100);
  }

  function loadConfig() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ||
        "null"
      );

      if (!saved) {
        return clone(DEFAULT_CONFIG);
      }

      return {
        ...clone(DEFAULT_CONFIG),
        ...saved,

        paymentMethods: {
          ...clone(
            DEFAULT_CONFIG.paymentMethods
          ),
          ...(saved.paymentMethods || {})
        }
      };
    } catch {
      return clone(DEFAULT_CONFIG);
    }
  }

  function saveConfig(config) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(config)
    );
  }

  function loadHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(HISTORY_KEY) ||
        "[]"
      );

      return Array.isArray(value)
        ? value
        : [];
    } catch {
      return [];
    }
  }

  function saveHistoryItem(item) {
    const history = loadHistory();

    history.unshift(item);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        history.slice(0, 30)
      )
    );
  }

  function commercialRound(
    value,
    increment = 10
  ) {
    const safeIncrement =
      Math.max(1, number(increment, 10));

    const rounded =
      Math.ceil(value / safeIncrement) *
      safeIncrement;

    return Math.max(
      9,
      rounded - 1
    );
  }

  function calculateMethod({
    methodKey,
    method,
    baseCost,
    desiredProfit,
    config
  }) {
    const processorPercent =
      number(method.percentFee);

    const serviceTaxPercent =
      number(method.serviceTaxPercent);

    const processorWithTax =
      processorPercent *
      (
        1 +
        serviceTaxPercent / 100
      );

    const shopifyPercent =
      number(
        config.shopifyExternalPercent
      );

    const reservePercent =
      number(
        config.returnsReservePercent
      );

    const totalPercent =
      processorWithTax +
      shopifyPercent +
      reservePercent;

    if (totalPercent >= 100) {
      throw new Error(
        `${method.label}: los porcentajes alcanzan o superan 100%.`
      );
    }

    const fixedFee =
      number(method.fixedFee);

    const amountBeforePercentages =
      baseCost +
      desiredProfit +
      fixedFee;

    const rawPrice =
      amountBeforePercentages /
      (
        1 -
        totalPercent / 100
      );

    const finalPrice =
      commercialRound(
        rawPrice,
        config.roundingIncrement
      );

    const processorFee =
      percentOf(
        finalPrice,
        processorWithTax
      ) +
      fixedFee;

    const shopifyFee =
      percentOf(
        finalPrice,
        shopifyPercent
      );

    const riskReserve =
      percentOf(
        finalPrice,
        reservePercent
      );

    const projectedProfit =
      finalPrice -
      baseCost -
      processorFee -
      shopifyFee -
      riskReserve;

    return {
      methodKey,
      methodLabel: method.label,
      processorPercent:
        roundMoney(processorWithTax),
      totalPercent:
        roundMoney(totalPercent),
      finalPrice:
        roundMoney(finalPrice),
      processorFee:
        roundMoney(processorFee),
      shopifyFee:
        roundMoney(shopifyFee),
      riskReserve:
        roundMoney(riskReserve),
      projectedProfit:
        roundMoney(projectedProfit)
    };
  }

  function calculatePricing(input, config) {
    const productCost =
      number(input.productCost);

    const shippingCost =
      number(input.shippingCost);

    const quantity =
      Math.max(
        1,
        number(input.quantity, 1)
      );

    if (productCost <= 0) {
      throw new Error(
        "Introduce un costo de producto mayor a cero."
      );
    }

    const supplierCurrency =
      input.supplierCurrency;

    let supplierCost =
      (
        productCost +
        shippingCost
      ) *
      quantity;

    if (supplierCurrency === "USD") {
      const exchangeRate =
        number(config.exchangeRate);

      if (exchangeRate <= 0) {
        throw new Error(
          "El tipo de cambio debe ser mayor a cero."
        );
      }

      supplierCost *= exchangeRate;

      supplierCost +=
        percentOf(
          supplierCost,
          config.exchangeBufferPercent
        );
    }

    const importBuffer =
      percentOf(
        supplierCost,
        config.importBufferPercent
      );

    const baseCost =
      supplierCost +
      importBuffer;

    const marginProfit =
      percentOf(
        baseCost,
        config.minimumMarginPercent
      );

    const desiredProfit =
      Math.max(
        number(config.fixedProfit),
        marginProfit,
        number(config.minimumProfit)
      );

    const enabledMethods =
      Object.entries(
        config.paymentMethods
      ).filter(
        ([, method]) =>
          method.enabled === true
      );

    const methods =
      enabledMethods.map(
        ([methodKey, method]) =>
          calculateMethod({
            methodKey,
            method,
            baseCost,
            desiredProfit,
            config
          })
      );

    const minimumNoFeePrice =
      commercialRound(
        baseCost + desiredProfit,
        config.roundingIncrement
      );

    const conservativePrice =
      methods.length
        ? Math.max(
            ...methods.map(
              item => item.finalPrice
            )
          )
        : minimumNoFeePrice;

    return {
      id:
        `EDP-${Date.now()}`,

      createdAt:
        new Date().toISOString(),

      product: {
        sku:
          String(input.sku || "").trim(),
        name:
          String(input.name || "").trim() ||
          "Producto sin nombre",
        supplierCurrency,
        productCost,
        shippingCost,
        quantity
      },

      calculations: {
        supplierCostMXN:
          roundMoney(supplierCost),
        importBuffer:
          roundMoney(importBuffer),
        baseCost:
          roundMoney(baseCost),
        marginProfit:
          roundMoney(marginProfit),
        desiredProfit:
          roundMoney(desiredProfit),
        minimumNoFeePrice:
          roundMoney(minimumNoFeePrice),
        conservativePrice:
          roundMoney(conservativePrice)
      },

      methods,

      warnings: [
        ...(
          methods.length
            ? []
            : [
                "No hay pasarelas activadas. El precio solo cubre costo y utilidad."
              ]
        ),

        ...(
          desiredProfit <= 50
            ? [
                "La utilidad configurada es reducida. Revisa devoluciones y variaciones de envío."
              ]
            : []
        )
      ]
    };
  }

  function methodForm(
    key,
    method
  ) {
    return `
      <article
        class="ed-pricing-method"
        data-ed-pricing-method="${key}"
      >
        <label class="ed-pricing-method-switch">
          <input
            type="checkbox"
            name="${key}Enabled"
            ${
              method.enabled
                ? "checked"
                : ""
            }
          >

          <span></span>

          <strong>
            ${escapeHtml(method.label)}
          </strong>
        </label>

        <div class="ed-pricing-method-fields">
          <label>
            <span>Comisión porcentual</span>

            <div class="ed-pricing-input-suffix">
              <input
                type="number"
                name="${key}PercentFee"
                min="0"
                max="99"
                step="0.01"
                value="${number(
                  method.percentFee
                )}"
              >

              <b>%</b>
            </div>
          </label>

          <label>
            <span>Cargo fijo</span>

            <div class="ed-pricing-input-prefix">
              <b>$</b>

              <input
                type="number"
                name="${key}FixedFee"
                min="0"
                step="0.01"
                value="${number(
                  method.fixedFee
                )}"
              >
            </div>
          </label>

          <label>
            <span>IVA de la comisión</span>

            <div class="ed-pricing-input-suffix">
              <input
                type="number"
                name="${key}ServiceTax"
                min="0"
                max="99"
                step="0.01"
                value="${number(
                  method.serviceTaxPercent
                )}"
              >

              <b>%</b>
            </div>
          </label>
        </div>
      </article>
    `;
  }

  function createDialog() {
    const config = loadConfig();

    const dialog =
      document.createElement("dialog");

    dialog.id =
      "edPricingEngineDialog";

    dialog.className =
      "ed-pricing-dialog";

    dialog.innerHTML = `
      <div class="ed-pricing-shell">
        <header class="ed-pricing-header">
          <div>
            <small>E&D MARKET</small>
            <h2>Pricing Engine</h2>
            <p>Simulador de costos y precios v0.2</p>
          </div>

          <button
            type="button"
            data-ed-pricing-close
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div class="ed-pricing-layout">
          <form
            id="edPricingForm"
            class="ed-pricing-form"
          >
            <section class="ed-pricing-card">
              <div class="ed-pricing-card-title">
                <span>📦</span>

                <div>
                  <small>PRODUCTO</small>
                  <h3>Costos del proveedor</h3>
                </div>
              </div>

              <div class="ed-pricing-grid">
                <label class="ed-pricing-span-2">
                  <span>Nombre del producto</span>

                  <input
                    name="productName"
                    type="text"
                    placeholder="Ej. Audífonos inalámbricos"
                    required
                  >
                </label>

                <label>
                  <span>SKU</span>

                  <input
                    name="sku"
                    type="text"
                    placeholder="CJ-001"
                  >
                </label>

                <label>
                  <span>Moneda del proveedor</span>

                  <select name="supplierCurrency">
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                </label>

                <label>
                  <span>Costo del producto</span>

                  <input
                    name="productCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  >
                </label>

                <label>
                  <span>Costo de envío CJ</span>

                  <input
                    name="shippingCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                  >
                </label>

                <label>
                  <span>Cantidad</span>

                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value="1"
                  >
                </label>
              </div>
            </section>

            <section class="ed-pricing-card">
              <div class="ed-pricing-card-title">
                <span>⚙️</span>

                <div>
                  <small>REGLAS E&D</small>
                  <h3>Conversión y utilidad</h3>
                </div>
              </div>

              <div class="ed-pricing-grid">
                <label>
                  <span>Tipo de cambio USD/MXN</span>

                  <input
                    name="exchangeRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${number(
                      config.exchangeRate
                    )}"
                  >
                </label>

                <label>
                  <span>Colchón cambiario</span>

                  <div class="ed-pricing-input-suffix">
                    <input
                      name="exchangeBuffer"
                      type="number"
                      min="0"
                      step="0.01"
                      value="${number(
                        config.exchangeBufferPercent
                      )}"
                    >

                    <b>%</b>
                  </div>
                </label>

                <label>
                  <span>Reserva importación</span>

                  <div class="ed-pricing-input-suffix">
                    <input
                      name="importBuffer"
                      type="number"
                      min="0"
                      step="0.01"
                      value="${number(
                        config.importBufferPercent
                      )}"
                    >

                    <b>%</b>
                  </div>
                </label>

                <label>
                  <span>Reserva devoluciones</span>

                  <div class="ed-pricing-input-suffix">
                    <input
                      name="returnsReserve"
                      type="number"
                      min="0"
                      step="0.01"
                      value="${number(
                        config.returnsReservePercent
                      )}"
                    >

                    <b>%</b>
                  </div>
                </label>

                <label>
                  <span>Utilidad fija deseada</span>

                  <div class="ed-pricing-input-prefix">
                    <b>$</b>

                    <input
                      name="fixedProfit"
                      type="number"
                      min="0"
                      step="1"
                      value="${number(
                        config.fixedProfit
                      )}"
                    >
                  </div>
                </label>

                <label>
                  <span>Margen mínimo</span>

                  <div class="ed-pricing-input-suffix">
                    <input
                      name="minimumMargin"
                      type="number"
                      min="0"
                      step="0.01"
                      value="${number(
                        config.minimumMarginPercent
                      )}"
                    >

                    <b>%</b>
                  </div>
                </label>

                <label>
                  <span>Utilidad mínima absoluta</span>

                  <div class="ed-pricing-input-prefix">
                    <b>$</b>

                    <input
                      name="minimumProfit"
                      type="number"
                      min="0"
                      step="1"
                      value="${number(
                        config.minimumProfit
                      )}"
                    >
                  </div>
                </label>

                <label>
                  <span>Redondear cada</span>

                  <div class="ed-pricing-input-prefix">
                    <b>$</b>

                    <input
                      name="roundingIncrement"
                      type="number"
                      min="1"
                      step="1"
                      value="${number(
                        config.roundingIncrement
                      )}"
                    >
                  </div>
                </label>

                <label class="ed-pricing-span-2">
                  <span>
                    Comisión adicional de Shopify
                  </span>

                  <div class="ed-pricing-input-suffix">
                    <input
                      name="shopifyExternalPercent"
                      type="number"
                      min="0"
                      step="0.01"
                      value="${number(
                        config.shopifyExternalPercent
                      )}"
                    >

                    <b>%</b>
                  </div>
                </label>
              </div>
            </section>

            <section class="ed-pricing-card">
              <div class="ed-pricing-card-title">
                <span>💳</span>

                <div>
                  <small>PASARELAS</small>
                  <h3>Costos de procesamiento</h3>
                </div>
              </div>

              <p class="ed-pricing-helper">
                Activa solamente los métodos que realmente
                utilizarás. Introduce las tarifas aplicables
                a la cuenta de E&D Market.
              </p>

              <div class="ed-pricing-method-list">
                ${Object.entries(
                  config.paymentMethods
                )
                  .map(
                    ([key, method]) =>
                      methodForm(
                        key,
                        method
                      )
                  )
                  .join("")}
              </div>
            </section>

            <div class="ed-pricing-actions">
              <button
                class="ed-pricing-secondary"
                type="button"
                data-ed-pricing-reset
              >
                Restablecer
              </button>

              <button
                class="ed-pricing-primary"
                type="submit"
              >
                Calcular precio
              </button>
            </div>
          </form>

          <aside
            id="edPricingResults"
            class="ed-pricing-results"
          >
            <div class="ed-pricing-empty">
              <span>🧮</span>

              <h3>Simula un producto</h3>

              <p>
                Completa los costos y presiona
                “Calcular precio”.
              </p>
            </div>
          </aside>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    return dialog;
  }

  function readForm(form) {
    const data =
      new FormData(form);

    const config = {
      exchangeRate:
        number(data.get("exchangeRate")),

      exchangeBufferPercent:
        number(
          data.get("exchangeBuffer")
        ),

      importBufferPercent:
        number(data.get("importBuffer")),

      returnsReservePercent:
        number(
          data.get("returnsReserve")
        ),

      shopifyExternalPercent:
        number(
          data.get(
            "shopifyExternalPercent"
          )
        ),

      minimumProfit:
        number(data.get("minimumProfit")),

      fixedProfit:
        number(data.get("fixedProfit")),

      minimumMarginPercent:
        number(
          data.get("minimumMargin")
        ),

      roundingIncrement:
        number(
          data.get("roundingIncrement"),
          10
        ),

      paymentMethods: {}
    };

    for (
      const [
        key,
        defaultMethod
      ] of Object.entries(
        DEFAULT_CONFIG.paymentMethods
      )
    ) {
      config.paymentMethods[key] = {
        label: defaultMethod.label,

        enabled:
          data.get(`${key}Enabled`) ===
          "on",

        percentFee:
          number(
            data.get(
              `${key}PercentFee`
            )
          ),

        fixedFee:
          number(
            data.get(
              `${key}FixedFee`
            )
          ),

        serviceTaxPercent:
          number(
            data.get(
              `${key}ServiceTax`
            )
          )
      };
    }

    const product = {
      name:
        data.get("productName"),

      sku:
        data.get("sku"),

      supplierCurrency:
        data.get("supplierCurrency"),

      productCost:
        number(data.get("productCost")),

      shippingCost:
        number(data.get("shippingCost")),

      quantity:
        number(data.get("quantity"), 1)
    };

    return {
      config,
      product
    };
  }

  function renderMethodResult(item) {
    return `
      <article class="ed-pricing-result-method">
        <div class="ed-pricing-result-method-head">
          <div>
            <small>MÉTODO DE PAGO</small>

            <strong>
              ${escapeHtml(
                item.methodLabel
              )}
            </strong>
          </div>

          <b>
            ${money(item.finalPrice)}
          </b>
        </div>

        <dl>
          <div>
            <dt>Procesamiento estimado</dt>
            <dd>
              ${money(item.processorFee)}
            </dd>
          </div>

          <div>
            <dt>Comisión Shopify</dt>
            <dd>
              ${money(item.shopifyFee)}
            </dd>
          </div>

          <div>
            <dt>Reserva de riesgo</dt>
            <dd>
              ${money(item.riskReserve)}
            </dd>
          </div>

          <div>
            <dt>Utilidad proyectada</dt>
            <dd class="is-profit">
              ${money(
                item.projectedProfit
              )}
            </dd>
          </div>
        </dl>
      </article>
    `;
  }

  function renderResults(result) {
    const container =
      $("#edPricingResults");

    if (!container) return;

    const warningHtml =
      result.warnings.length
        ? `
          <div class="ed-pricing-warnings">
            ${result.warnings
              .map(
                warning => `
                  <p>
                    <span>⚠️</span>
                    ${escapeHtml(warning)}
                  </p>
                `
              )
              .join("")}
          </div>
        `
        : "";

    container.innerHTML = `
      <section class="ed-pricing-result-summary">
        <small>PRECIO RECOMENDADO</small>

        <strong>
          ${money(
            result.calculations
              .conservativePrice
          )}
        </strong>

        <p>
          Precio conservador para cubrir el método
          de pago activo con mayor costo.
        </p>

        <span>
          ${escapeHtml(
            result.product.name
          )}
        </span>
      </section>

      <section class="ed-pricing-breakdown">
        <h3>Resumen del cálculo</h3>

        <dl>
          <div>
            <dt>Costo proveedor + envío</dt>
            <dd>
              ${money(
                result.calculations
                  .supplierCostMXN
              )}
            </dd>
          </div>

          <div>
            <dt>Reserva importación</dt>
            <dd>
              ${money(
                result.calculations
                  .importBuffer
              )}
            </dd>
          </div>

          <div>
            <dt>Costo base E&D</dt>
            <dd>
              ${money(
                result.calculations
                  .baseCost
              )}
            </dd>
          </div>

          <div>
            <dt>Utilidad objetivo</dt>
            <dd>
              ${money(
                result.calculations
                  .desiredProfit
              )}
            </dd>
          </div>

          <div>
            <dt>Precio sin pasarela</dt>
            <dd>
              ${money(
                result.calculations
                  .minimumNoFeePrice
              )}
            </dd>
          </div>
        </dl>
      </section>

      ${
        result.methods.length
          ? `
            <section class="ed-pricing-comparison">
              <h3>
                Comparación por método
              </h3>

              ${result.methods
                .map(renderMethodResult)
                .join("")}
            </section>
          `
          : ""
      }

      ${warningHtml}

      <div class="ed-pricing-result-actions">
        <button
          type="button"
          data-ed-pricing-copy
        >
          Copiar resultado
        </button>

        <button
          type="button"
          data-ed-pricing-download
        >
          Descargar JSON
        </button>
      </div>

      <div class="ed-pricing-safety">
        <span>🔒</span>

        <p>
          Modo simulación. Ningún precio se publica
          automáticamente en Shopify.
        </p>
      </div>
    `;

    $("[data-ed-pricing-copy]")
      ?.addEventListener(
        "click",
        copyResult
      );

    $("[data-ed-pricing-download]")
      ?.addEventListener(
        "click",
        downloadResult
      );
  }

  async function copyResult() {
    if (!lastResult) return;

    const text = [
      "E&D Pricing Engine",
      `Producto: ${lastResult.product.name}`,
      `SKU: ${lastResult.product.sku || "Sin SKU"}`,
      `Costo base: ${money(
        lastResult.calculations.baseCost
      )}`,
      `Utilidad objetivo: ${money(
        lastResult.calculations.desiredProfit
      )}`,
      `Precio recomendado: ${money(
        lastResult.calculations.conservativePrice
      )}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        text
      );

      showToast(
        "Resultado copiado"
      );
    } catch {
      showToast(
        "No se pudo copiar automáticamente"
      );
    }
  }

  function downloadResult() {
    if (!lastResult) return;

    const blob = new Blob(
      [
        JSON.stringify(
          lastResult,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      `ed-pricing-${
        lastResult.product.sku ||
        Date.now()
      }.json`;

    anchor.click();

    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    let toast =
      $("#edPricingToast");

    if (!toast) {
      toast =
        document.createElement("div");

      toast.id =
        "edPricingToast";

      toast.className =
        "ed-pricing-toast";

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("is-visible");

    window.clearTimeout(
      showToast.timer
    );

    showToast.timer =
      window.setTimeout(() => {
        toast.classList.remove(
          "is-visible"
        );
      }, 2600);
  }

  function resetForm(dialog) {
    localStorage.removeItem(
      STORAGE_KEY
    );

    dialog.remove();

    const recreated =
      createDialog();

    mountDialog(recreated);

    recreated.showModal();
  }

  function mountDialog(dialog) {
    const form =
      $("#edPricingForm", dialog);

    $("[data-ed-pricing-close]", dialog)
      ?.addEventListener(
        "click",
        () => dialog.close()
      );

    $("[data-ed-pricing-reset]", dialog)
      ?.addEventListener(
        "click",
        () => resetForm(dialog)
      );

    form?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        try {
          const {
            config,
            product
          } = readForm(form);

          saveConfig(config);

          lastResult =
            calculatePricing(
              product,
              config
            );

          saveHistoryItem(
            lastResult
          );

          renderResults(
            lastResult
          );

          showToast(
            "Precio calculado correctamente"
          );
        } catch (error) {
          showToast(
            error.message ||
            "No se pudo calcular el precio"
          );
        }
      }
    );

    dialog.addEventListener(
      "click",
      event => {
        if (event.target === dialog) {
          dialog.close();
        }
      }
    );
  }

  function findAdminContainer() {
    return (
      $("#adminModal") ||
      $("#adminDialog") ||
      $(".admin-dialog") ||
      $("dialog[id*='admin' i]")
    );
  }

  function injectAdminButton() {
    if (
      $("[data-ed-open-pricing]")
    ) {
      return;
    }

    const admin =
      findAdminContainer();

    if (!admin) {
      window.setTimeout(
        injectAdminButton,
        1200
      );

      return;
    }

    const section =
      document.createElement("section");

    section.className =
      "admin-section ed-pricing-admin-entry";

    section.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h3>E&D Pricing Engine</h3>

          <p>
            Calcula costos, comisiones y utilidad
            antes de publicar un producto.
          </p>
        </div>

        <span class="tag-mini">
          v0.2
        </span>
      </div>

      <button
        class="primary"
        type="button"
        data-ed-open-pricing
      >
        Abrir simulador de precios
      </button>
    `;

    const target =
      admin.querySelector(
        ".admin-section"
      );

    if (target) {
      target.insertAdjacentElement(
        "beforebegin",
        section
      );
    } else {
      admin.appendChild(section);
    }

    section
      .querySelector(
        "[data-ed-open-pricing]"
      )
      ?.addEventListener(
        "click",
        openPricingEngine
      );
  }

  function openPricingEngine() {
    let dialog =
      $("#edPricingEngineDialog");

    if (!dialog) {
      dialog =
        createDialog();

      mountDialog(dialog);
    }

    if (
      typeof dialog.showModal ===
      "function"
    ) {
      dialog.showModal();
    } else {
      dialog.setAttribute(
        "open",
        ""
      );
    }
  }

  function mount() {
    window.openEDPricingEngine =
      openPricingEngine;

    injectAdminButton();

    console.log(
      "✓ E&D Pricing Engine UI v0.2 cargado"
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
