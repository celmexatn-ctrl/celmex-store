(function () {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const ICONS = {
    menu: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16"/>
      </svg>
    `,

    bell: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
        <path d="M10 21h4"/>
      </svg>
    `,

    cart: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2l2 11h10l2-8H6"/>
        <circle cx="9" cy="20" r="1.4"/>
        <circle cx="17" cy="20" r="1.4"/>
      </svg>
    `,

    search: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.7"/>
        <path d="m16 16 4 4"/>
      </svg>
    `,

    scan: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4"/>
        <rect x="8" y="8" width="8" height="8" rx="1.5"/>
      </svg>
    `,

    location: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/>
        <circle cx="12" cy="10" r="2.4"/>
      </svg>
    `,

    arrow: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 5 7 7-7 7"/>
      </svg>
    `,

    home: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 11 9-8 9 8"/>
        <path d="M5 10v10h14V10M9 20v-6h6v6"/>
      </svg>
    `,

    grid: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1"/>
        <rect x="14" y="4" width="6" height="6" rx="1"/>
        <rect x="4" y="14" width="6" height="6" rx="1"/>
        <rect x="14" y="14" width="6" height="6" rx="1"/>
      </svg>
    `,

    orders: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <path d="M8 8h8M8 12h8M8 16h5"/>
      </svg>
    `,

    account: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7"/>
      </svg>
    `
  };

  const categories = [
    {
      id: "Tecnología",
      image: "📱",
      title: "Tecnología"
    },
    {
      id: "Hogar",
      image: "🛋️",
      title: "Hogar"
    },
    {
      id: "Moda",
      image: "👕",
      title: "Moda"
    },
    {
      id: "Belleza",
      image: "🧴",
      title: "Belleza"
    },
    {
      id: "Deportes",
      image: "⚽",
      title: "Deportes"
    }
  ];

  const shortcuts = [
    {
      icon: "🔥",
      title: "Ofertas",
      action: "offers"
    },
    {
      icon: "🎟️",
      title: "Cupones",
      action: "coupons"
    },
    {
      icon: "🚚",
      title: "Envíos",
      action: "shipping"
    },
    {
      icon: "💙",
      title: "Favoritos",
      action: "favorites"
    },
    {
      icon: "🛡️",
      title: "Pedidos",
      action: "orders"
    }
  ];

  function categoryHtml(item) {
    return `
      <button
        class="edp-category"
        type="button"
        data-edp-category="${item.id}"
      >
        <span class="edp-category-media">
          <b>${item.image}</b>
        </span>

        <strong>${item.title}</strong>
      </button>
    `;
  }

  function shortcutHtml(item) {
    return `
      <button
        class="edp-shortcut"
        type="button"
        data-edp-shortcut="${item.action}"
      >
        <span>${item.icon}</span>
        <strong>${item.title}</strong>
      </button>
    `;
  }

  function productSkeletonHtml(discount) {
    return `
      <article class="edp-product-skeleton">
        <span>-${discount}%</span>

        <div class="edp-product-skeleton-media"></div>

        <div class="edp-product-skeleton-line is-wide"></div>
        <div class="edp-product-skeleton-line"></div>
      </article>
    `;
  }

  function render() {
    return `
      <section
        id="edPremiumHome"
        class="edp-home"
        aria-label="E&D Market"
      >
        <header class="edp-header">
          <button
            id="edpMenuButton"
            class="edp-header-action"
            type="button"
            aria-label="Abrir menú"
          >
            ${ICONS.menu}
          </button>

          <button
            class="edp-brand"
            type="button"
            data-edp-home
            aria-label="Ir al inicio"
          >
            <span class="edp-crown">♛</span>

            <strong>
              E<span>&amp;</span>D
            </strong>

            <small>MARKET</small>
          </button>

          <div class="edp-header-actions">
            <button
              class="edp-header-action"
              type="button"
              data-edp-notifications
              aria-label="Notificaciones"
            >
              ${ICONS.bell}
            </button>

            <button
              class="edp-header-action edp-cart-action"
              type="button"
              data-edp-cart
              aria-label="Carrito"
            >
              ${ICONS.cart}

              <i id="edpCartCount">0</i>
            </button>
          </div>
        </header>

        <form
          id="edpSearchForm"
          class="edp-search"
          role="search"
        >
          <span>${ICONS.search}</span>

          <input
            id="edpSearchInput"
            type="search"
            autocomplete="off"
            placeholder="Buscar productos, marcas y categorías"
          >

          <button
            type="button"
            data-edp-scan
            aria-label="Búsqueda visual"
          >
            ${ICONS.scan}
          </button>
        </form>

        <button
          class="edp-location"
          type="button"
          data-edp-catalog
        >
          <span>${ICONS.location}</span>

          <strong>Enviar a México</strong>

          <b>${ICONS.arrow}</b>
        </button>

        <section
          class="edp-banner"
          aria-label="Promoción principal"
        >
          <div class="edp-banner-copy">
            <small>TECNOLOGÍA SIN LÍMITES</small>

            <h1>
              Innovación que
              <b>conecta contigo</b>
            </h1>

            <button
              type="button"
              data-edp-category="Tecnología"
            >
              Explorar ahora
              <span>→</span>
            </button>
          </div>

          <div
            class="edp-banner-products"
            aria-hidden="true"
          >
            <span class="edp-device edp-headphones">🎧</span>
            <span class="edp-device edp-phone">📱</span>
            <span class="edp-device edp-watch">⌚</span>
          </div>

          <div class="edp-banner-dots">
            <i class="is-active"></i>
            <i></i>
            <i></i>
          </div>
        </section>

        <section
          class="edp-categories"
          aria-label="Categorías"
        >
          ${categories.map(categoryHtml).join("")}
        </section>

        <section
          class="edp-shortcuts"
          aria-label="Accesos rápidos"
        >
          ${shortcuts.map(shortcutHtml).join("")}
        </section>

        <section class="edp-offers">
          <header>
            <h2>Ofertas para ti</h2>

            <button
              type="button"
              data-edp-catalog
            >
              Ver todas
              ${ICONS.arrow}
            </button>
          </header>

          <div
            id="edpProductRail"
            class="edp-product-rail"
          >
            ${productSkeletonHtml(25)}
            ${productSkeletonHtml(30)}
            ${productSkeletonHtml(30)}
            ${productSkeletonHtml(15)}
          </div>
        </section>
      </section>

      <nav
        id="edPremiumBottomNav"
        class="edp-bottom-nav"
        aria-label="Navegación principal"
      >
        <button
          class="edp-nav-item is-active"
          type="button"
          data-edp-nav="home"
        >
          <span>${ICONS.home}</span>
          <small>Inicio</small>
        </button>

        <button
          class="edp-nav-item"
          type="button"
          data-edp-nav="categories"
        >
          <span>${ICONS.grid}</span>
          <small>Categorías</small>
        </button>

        <button
          class="edp-nav-item edp-nav-cart"
          type="button"
          data-edp-nav="cart"
        >
          <span>
            ${ICONS.cart}
            <i id="edpNavCartCount">0</i>
          </span>

          <small>Carrito</small>
        </button>

        <button
          class="edp-nav-item"
          type="button"
          data-edp-nav="orders"
        >
          <span>${ICONS.orders}</span>
          <small>Pedidos</small>
        </button>

        <button
          class="edp-nav-item"
          type="button"
          data-edp-nav="account"
        >
          <span>${ICONS.account}</span>
          <small>Cuenta</small>
        </button>
      </nav>
    `;
  }

  function goCatalog() {
    if (
      typeof window.goCatalog ===
      "function"
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

  function selectCategory(category) {
    const chip =
      $$(".chip[data-filter]")
        .find(item =>
          String(item.dataset.filter || "")
            .toLowerCase() ===
          String(category || "")
            .toLowerCase()
        );

    chip?.click();
    goCatalog();
  }

  function runSearch(value) {
    const query =
      String(value || "").trim();

    const original =
      $("#searchInput");

    if (original) {
      original.value = query;

      original.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }

    goCatalog();
  }

  function showToast(title, message) {
    let toast = $("#edpToast");

    if (!toast) {
      toast =
        document.createElement("div");

      toast.id = "edpToast";
      toast.className = "edp-toast";

      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <strong>${title}</strong>
      <span>${message}</span>
    `;

    toast.classList.add("is-visible");

    window.clearTimeout(showToast.timer);

    showToast.timer =
      window.setTimeout(() => {
        toast.classList.remove(
          "is-visible"
        );
      }, 2600);
  }

  function openOrders() {
    const current =
      $('[data-ed-v3-nav="orders"]');

    if (current) {
      current.click();
      return;
    }

    showToast(
      "Pedidos E&D",
      "Aquí podrás consultar el estado de tus compras."
    );
  }

  function openAccount() {
    const current =
      $('[data-ed-v3-nav="account"]');

    if (current) {
      current.click();
      return;
    }

    showToast(
      "Cuenta E&D",
      "El centro de cuenta se encuentra disponible desde el menú."
    );
  }

  function mountActions() {
    $("#edpSearchForm")
      ?.addEventListener(
        "submit",
        event => {
          event.preventDefault();

          runSearch(
            $("#edpSearchInput")?.value
          );
        }
      );

    $$("[data-edp-category]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectCategory(
              button.dataset.edpCategory
            );
          }
        );
      });

    $$("[data-edp-catalog]")
      .forEach(button => {
        button.addEventListener(
          "click",
          goCatalog
        );
      });

    $$("[data-edp-home]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }
        );
      });

    $("[data-edp-cart]")
      ?.addEventListener(
        "click",
        () => window.openQuote?.()
      );

    $("[data-edp-notifications]")
      ?.addEventListener(
        "click",
        () => {
          showToast(
            "Notificaciones E&D",
            "Ofertas, novedades y actualizaciones de tus pedidos."
          );
        }
      );

    $("[data-edp-scan]")
      ?.addEventListener(
        "click",
        () => {
          showToast(
            "Búsqueda visual",
            "La búsqueda mediante fotografía se integrará próximamente."
          );
        }
      );

    $$("[data-edp-shortcut]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const action =
              button.dataset.edpShortcut;

            if (action === "offers") {
              $("#edpProductRail")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "center"
                });

              return;
            }

            if (action === "favorites") {
              window.openFavorites?.();
              return;
            }

            if (action === "orders") {
              openOrders();
              return;
            }

            if (action === "coupons") {
              showToast(
                "Cupones E&D",
                "El centro de promociones se encuentra en preparación."
              );

              return;
            }

            if (action === "shipping") {
              showToast(
                "Envíos E&D",
                "Realizamos envíos a todo México."
              );
            }
          }
        );
      });

    $$("[data-edp-nav]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const target =
              button.dataset.edpNav;

            if (target === "home") {
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }

            if (target === "categories") {
              goCatalog();
            }

            if (target === "cart") {
              window.openQuote?.();
            }

            if (target === "orders") {
              openOrders();
            }

            if (target === "account") {
              openAccount();
            }

            $$("[data-edp-nav]")
              .forEach(item => {
                item.classList.toggle(
                  "is-active",
                  item === button
                );
              });
          }
        );
      });

    $("#edpMenuButton")
      ?.addEventListener(
        "click",
        () => {
          document
            .querySelector(
              "#edNextMenuButton"
            )
            ?.click();
        }
      );
  }

  function syncCart() {
    const sources = [
      $("#cartCount"),
      $("#edMarketplaceCartCount"),
      $("#edNextCartCount")
    ].filter(Boolean);

    const targets = [
      $("#edpCartCount"),
      $("#edpNavCartCount")
    ].filter(Boolean);

    const update = () => {
      const source =
        sources.find(item =>
          Number(
            item.textContent.trim()
          ) > 0
        ) || sources[0];

      const count =
        source?.textContent
          ?.trim() || "0";

      targets.forEach(target => {
        target.textContent = count;
        target.hidden = count === "0";
      });
    };

    update();

    sources.forEach(source => {
      new MutationObserver(update)
        .observe(source, {
          childList: true,
          characterData: true,
          subtree: true
        });
    });
  }

  function mount() {
    if (
      document.getElementById(
        "edPremiumHome"
      )
    ) {
      return;
    }

    const main =
      document.querySelector("main");

    if (!main) {
      console.error(
        "E&D Premium: no se encontró <main>."
      );

      return;
    }

    document.documentElement
      .classList.add(
        "ed-premium-ui"
      );

    main.insertAdjacentHTML(
      "afterbegin",
      render()
    );

    mountActions();
    syncCart();

    console.log(
      "✓ E&D Market Next Premium UI v2.2 cargada"
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
