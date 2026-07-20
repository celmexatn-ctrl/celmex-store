(function () {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const ORDERS_KEY = "edmarket-orders-v1";

  const RECENT_KEY = "edmarket-v3-recent-searches";

  const CATEGORY_OPTIONS = [
    {
      id: "Tecnología",
      icon: "📱",
      title: "Tecnología",
      subtitle: "Celulares, audio y accesorios"
    },
    {
      id: "Hogar",
      icon: "🏠",
      title: "Hogar",
      subtitle: "Productos para tu espacio"
    },
    {
      id: "Moda",
      icon: "👕",
      title: "Moda",
      subtitle: "Ropa, calzado y accesorios"
    },
    {
      id: "Belleza",
      icon: "✨",
      title: "Belleza",
      subtitle: "Cuidado y bienestar"
    },
    {
      id: "Mascotas",
      icon: "🐾",
      title: "Mascotas",
      subtitle: "Todo para consentirlas"
    },
    {
      id: "Deportes",
      icon: "⚽",
      title: "Deportes",
      subtitle: "Equipo y vida activa"
    },
    {
      id: "Oficina",
      icon: "💻",
      title: "Oficina",
      subtitle: "Trabajo y productividad"
    },
    {
      id: "Juguetes",
      icon: "🧸",
      title: "Juguetes",
      subtitle: "Diversión para todos"
    }
  ];

  let searchTimer = null;

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
    try {
      return new Intl.NumberFormat(
        "es-MX",
        {
          style: "currency",
          currency,
          minimumFractionDigits: 2
        }
      ).format(Number(amount || 0));
    } catch {
      return `$${Number(amount || 0).toFixed(2)}`;
    }
  }

  function formatDate(value) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat(
        "es-MX",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      ).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  function loadJson(key, fallback) {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(key) || ""
      );

      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getOrders() {
    const orders = loadJson(ORDERS_KEY, []);

    return Array.isArray(orders)
      ? orders
      : [];
  }

  function getRecentSearches() {
    const searches = loadJson(RECENT_KEY, []);

    return Array.isArray(searches)
      ? searches
      : [];
  }

  function saveRecentSearch(value) {
    const normalized = String(value || "").trim();

    if (normalized.length < 2) return;

    const recent = getRecentSearches()
      .filter(
        item =>
          item.toLowerCase() !==
          normalized.toLowerCase()
      );

    recent.unshift(normalized);

    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recent.slice(0, 6))
    );
  }

  function getSheet() {
    return $("#edV3Sheet");
  }

  function getOverlay() {
    return $("#edV3Overlay");
  }

  function setActiveNav(name) {
    $$("[data-ed-v3-nav]").forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.edV3Nav === name
      );
    });
  }

  function openSheet({
    title,
    eyebrow = "E&D MARKET",
    content,
    nav
  }) {
    const sheet = getSheet();
    const overlay = getOverlay();

    if (!sheet || !overlay) return;

    $("#edV3SheetTitle").textContent = title;
    $("#edV3SheetEyebrow").textContent =
      eyebrow;

    $("#edV3SheetContent").innerHTML =
      content;

    overlay.hidden = false;

    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      sheet.classList.add("is-open");
      sheet.setAttribute(
        "aria-hidden",
        "false"
      );
    });

    document.body.classList.add(
      "ed-v3-sheet-open"
    );

    if (nav) {
      setActiveNav(nav);
    }
  }

  function closeSheet({
    restoreHome = true
  } = {}) {
    const sheet = getSheet();
    const overlay = getOverlay();

    if (!sheet || !overlay) return;

    sheet.classList.remove("is-open");
    overlay.classList.remove("is-visible");

    sheet.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "ed-v3-sheet-open"
    );

    window.setTimeout(() => {
      overlay.hidden = true;
    }, 250);

    if (restoreHome) {
      setActiveNav("home");
    }
  }

  function goHome() {
    closeSheet({
      restoreHome: false
    });

    setActiveNav("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function goCatalog() {
    closeSheet({
      restoreHome: false
    });

    if (
      typeof window.goCatalog === "function"
    ) {
      window.goCatalog();
      return;
    }

    (
      $("#catalogo") ||
      $("#catalogo-shopify")
    )?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function chooseCategory(category) {
    const target = $$(".chip[data-filter]")
      .find(
        chip =>
          String(
            chip.dataset.filter || ""
          ).toLowerCase() ===
          String(category).toLowerCase()
      );

    target?.click();

    goCatalog();
  }

  function renderCategories() {
    return `
      <section class="ed-v3-category-panel">
        <p class="ed-v3-panel-intro">
          Encuentra rápidamente lo que necesitas
          dentro de E&D Market.
        </p>

        <div class="ed-v3-category-grid">
          ${CATEGORY_OPTIONS
            .map(
              category => `
                <button
                  type="button"
                  data-ed-v3-category="${escapeHtml(
                    category.id
                  )}"
                >
                  <span>${category.icon}</span>

                  <div>
                    <strong>
                      ${escapeHtml(
                        category.title
                      )}
                    </strong>

                    <small>
                      ${escapeHtml(
                        category.subtitle
                      )}
                    </small>
                  </div>

                  <b>›</b>
                </button>
              `
            )
            .join("")}
        </div>

        <button
          class="ed-v3-panel-primary"
          type="button"
          data-ed-v3-all-products
        >
          Ver todos los productos
        </button>
      </section>
    `;
  }

  function openCategories() {
    openSheet({
      title: "Categorías",
      eyebrow: "EXPLORA E&D",
      content: renderCategories(),
      nav: "categories"
    });

    $$("[data-ed-v3-category]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            chooseCategory(
              button.dataset.edV3Category
            );
          }
        );
      });

    $("[data-ed-v3-all-products]")
      ?.addEventListener(
        "click",
        goCatalog
      );
  }

  function renderOrders() {
    const orders = getOrders();

    if (!orders.length) {
      return `
        <section class="ed-v3-empty-state">
          <span>📦</span>

          <h3>Aún no tienes pedidos</h3>

          <p>
            Cuando generes una compra,
            podrás consultar aquí su folio,
            estado y total.
          </p>

          <button
            type="button"
            data-ed-v3-start-shopping
          >
            Empezar a explorar
          </button>
        </section>
      `;
    }

    return `
      <section class="ed-v3-orders-list">
        <p class="ed-v3-panel-intro">
          Consulta los pedidos guardados
          actualmente en este dispositivo.
        </p>

        ${orders
          .slice(0, 20)
          .map(
            order => `
              <article class="ed-v3-order-card">
                <div class="ed-v3-order-icon">
                  📦
                </div>

                <div class="ed-v3-order-copy">
                  <small>
                    ${escapeHtml(
                      order.id ||
                      "PEDIDO E&D"
                    )}
                  </small>

                  <strong>
                    ${escapeHtml(
                      order.statusLabel ||
                      "Pendiente"
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

                <div class="ed-v3-order-total">
                  <b>
                    ${escapeHtml(
                      formatMoney(
                        order.totals?.total,
                        order.totals?.currency ||
                        "MXN"
                      )
                    )}
                  </b>

                  <small>
                    ${Number(
                      order.cart
                        ?.totalQuantity || 0
                    )} artículos
                  </small>
                </div>
              </article>
            `
          )
          .join("")}

        <div class="ed-v3-local-notice">
          <span>🧪</span>

          <p>
            Los pedidos actuales continúan en
            modo de prueba y están guardados
            solamente en este dispositivo.
          </p>
        </div>
      </section>
    `;
  }

  function openOrders() {
    openSheet({
      title: "Mis pedidos",
      eyebrow: "SEGUIMIENTO E&D",
      content: renderOrders(),
      nav: "orders"
    });

    $("[data-ed-v3-start-shopping]")
      ?.addEventListener(
        "click",
        goCatalog
      );
  }

  function getCustomerData() {
    const candidates = [
      "edmarket-checkout-account-v1",
      "edmarket-customer-v1",
      "customerData"
    ];

    for (const key of candidates) {
      const value = loadJson(key, null);

      if (
        value &&
        typeof value === "object"
      ) {
        return value;
      }
    }

    return {};
  }

  function renderAccount() {
    const customer = getCustomerData();

    const name =
      customer.name ||
      customer.fullName ||
      "Cliente E&D";

    const email =
      customer.email || "";

    return `
      <section class="ed-v3-account-panel">
        <div class="ed-v3-account-hero">
          <div class="ed-v3-account-avatar">
            ${escapeHtml(
              String(name)
                .trim()
                .charAt(0)
                .toUpperCase() || "E"
            )}
          </div>

          <div>
            <small>BIENVENIDO</small>

            <strong>
              ${escapeHtml(name)}
            </strong>

            ${
              email
                ? `
                  <p>
                    ${escapeHtml(email)}
                  </p>
                `
                : `
                  <p>
                    Completa tus datos durante
                    el checkout.
                  </p>
                `
            }
          </div>
        </div>

        <div class="ed-v3-account-actions">
          <button
            type="button"
            data-ed-v3-account-orders
          >
            <span>📦</span>
            <strong>Mis pedidos</strong>
            <small>Seguimiento e historial</small>
            <b>›</b>
          </button>

          <button
            type="button"
            data-ed-v3-account-favorites
          >
            <span>♡</span>
            <strong>Favoritos</strong>
            <small>Productos guardados</small>
            <b>›</b>
          </button>

          <button
            type="button"
            data-ed-v3-account-partner
          >
            <span>♛</span>
            <strong>Cuenta de socio</strong>
            <small>Ventas y comisiones</small>
            <b>›</b>
          </button>

          <a
            href="https://wa.me/526313181585?text=Hola%20E%26D%20Market%2C%20necesito%20ayuda."
          >
            <span>🎧</span>
            <strong>Ayuda y soporte</strong>
            <small>Atención por WhatsApp</small>
            <b>›</b>
          </a>
        </div>

        <div class="ed-v3-account-benefit">
          <span>💰</span>

          <div>
            <strong>Beneficios E&D</strong>

            <p>
              Cashback, cupones y recompensas
              estarán disponibles próximamente.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function openAccount() {
    openSheet({
      title: "Mi cuenta",
      eyebrow: "TU MUNDO E&D",
      content: renderAccount(),
      nav: "account"
    });

    $("[data-ed-v3-account-orders]")
      ?.addEventListener(
        "click",
        openOrders
      );

    $("[data-ed-v3-account-favorites]")
      ?.addEventListener(
        "click",
        () => {
          closeSheet({
            restoreHome: false
          });

          if (
            typeof window.openFavorites ===
            "function"
          ) {
            window.openFavorites();
          }
        }
      );

    $("[data-ed-v3-account-partner]")
      ?.addEventListener(
        "click",
        () => {
          closeSheet();

          if (
            typeof window.openSocioAccess ===
            "function"
          ) {
            window.openSocioAccess();
          }
        }
      );
  }

  function openCart() {
    closeSheet({
      restoreHome: false
    });

    setActiveNav("cart");

    if (
      typeof window.openQuote === "function"
    ) {
      window.openQuote();
    }

    window.setTimeout(() => {
      setActiveNav("home");
    }, 500);
  }

  function updateCartCount() {
    const source =
      $("#cartCount") ||
      $("#edMarketplaceCartCount");

    const target =
      $("#edV3CartCount");

    if (!target) return;

    const update = () => {
      target.textContent =
        source?.textContent?.trim() || "0";

      target.hidden =
        target.textContent === "0";
    };

    update();

    if (source) {
      new MutationObserver(update).observe(
        source,
        {
          childList: true,
          characterData: true,
          subtree: true
        }
      );
    }
  }

  function performLiveSearch(value) {
    const query = String(value || "").trim();

    const original = $("#searchInput");

    if (original) {
      original.value = query;

      original.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }

    if (query.length >= 2) {
      saveRecentSearch(query);
    }
  }

  function mountSmartSearch() {
    const input =
      $("#edMarketplaceSearchInput");

    const form =
      $("#edMarketplaceSearchForm");

    if (!input || !form) return;

    input.addEventListener("input", () => {
      window.clearTimeout(searchTimer);

      searchTimer = window.setTimeout(
        () => {
          performLiveSearch(input.value);
        },
        220
      );
    });

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        performLiveSearch(input.value);

        saveRecentSearch(input.value);

        goCatalog();
      }
    );

    const recent = getRecentSearches();

    if (
      recent.length &&
      !input.getAttribute(
        "data-ed-v3-placeholder"
      )
    ) {
      input.setAttribute(
        "data-ed-v3-placeholder",
        "true"
      );

      input.placeholder =
        `Buscar, por ejemplo: ${recent[0]}`;
    }
  }

  function mountNavigation() {
    $$("[data-ed-v3-nav]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const action =
              button.dataset.edV3Nav;

            if (navigator.vibrate) {
              navigator.vibrate(10);
            }

            if (action === "home") {
              goHome();
            }

            if (action === "categories") {
              openCategories();
            }

            if (action === "cart") {
              openCart();
            }

            if (action === "orders") {
              openOrders();
            }

            if (action === "account") {
              openAccount();
            }
          }
        );
      });

    $("#edV3SheetClose")
      ?.addEventListener(
        "click",
        () => closeSheet()
      );

    getOverlay()?.addEventListener(
      "click",
      () => closeSheet()
    );

    document.addEventListener(
      "keydown",
      event => {
        if (event.key === "Escape") {
          closeSheet();
        }
      }
    );
  }

  function mountTapFeedback() {
    document.addEventListener(
      "pointerdown",
      event => {
        const interactive =
          event.target.closest(
            "button, a, [role='button']"
          );

        if (!interactive) return;

        interactive.classList.add(
          "ed-v3-is-pressed"
        );
      }
    );

    const removePressed = () => {
      $$(".ed-v3-is-pressed")
        .forEach(element => {
          element.classList.remove(
            "ed-v3-is-pressed"
          );
        });
    };

    document.addEventListener(
      "pointerup",
      removePressed
    );

    document.addEventListener(
      "pointercancel",
      removePressed
    );
  }

  function mount() {
    document.documentElement.classList.add(
      "ed-market-v3"
    );

    mountNavigation();
    mountSmartSearch();
    mountTapFeedback();
    updateCartCount();

    console.log(
      "✓ E&D Market v3.0.1 cargado"
    );
  }

  if (document.readyState === "loading") {
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
