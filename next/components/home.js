(function () {
  "use strict";

  window.EDNext = window.EDNext || {};
  EDNext.components =
    EDNext.components || {};

  const categories = [
    {
      id: "Tecnología",
      icon: "📱",
      name: "Tecnología"
    },
    {
      id: "Hogar",
      icon: "🏠",
      name: "Hogar"
    },
    {
      id: "Moda",
      icon: "👕",
      name: "Moda"
    },
    {
      id: "Belleza",
      icon: "✨",
      name: "Belleza"
    },
    {
      id: "Mascotas",
      icon: "🐾",
      name: "Mascotas"
    },
    {
      id: "Deportes",
      icon: "⚽",
      name: "Deportes"
    },
    {
      id: "Oficina",
      icon: "💻",
      name: "Oficina"
    },
    {
      id: "Juguetes",
      icon: "🧸",
      name: "Juguetes"
    }
  ];

  function renderCategories() {
    return categories
      .map(category => `
        <button
          class="ed-next-category"
          type="button"
          data-ed-next-category="${category.id}"
        >
          <span>${category.icon}</span>
          <strong>${category.name}</strong>
        </button>
      `)
      .join("");
  }

  function render() {
    return `
      <section
        id="edNextHome"
        class="ed-next-home"
        aria-label="Inicio E&D Market Next"
      >
        <header class="ed-next-header">
          <button
            id="edNextMenuButton"
            class="ed-next-icon-button"
            type="button"
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <button
            class="ed-next-brand"
            type="button"
            data-ed-next-home
          >
            <strong>E&amp;D</strong>
            <small>MARKET</small>
          </button>

          <div class="ed-next-header-actions">
            <button
              class="ed-next-icon-button"
              type="button"
              data-ed-next-notifications
              aria-label="Notificaciones"
            >
              🔔
            </button>

            <button
              class="ed-next-icon-button"
              type="button"
              data-ed-next-cart
              aria-label="Carrito"
            >
              🛒
              <i id="edNextCartCount">0</i>
            </button>
          </div>
        </header>

        <form
          id="edNextSearchForm"
          class="ed-next-search"
          role="search"
        >
          <span>⌕</span>

          <input
            id="edNextSearchInput"
            type="search"
            placeholder="Buscar productos, marcas y categorías"
            autocomplete="off"
          >

          <button
            id="edNextSearchClear"
            type="button"
            aria-label="Limpiar búsqueda"
            hidden
          >
            ×
          </button>
        </form>

        <button
          class="ed-next-location"
          type="button"
          data-ed-next-catalog
        >
          <span>📍</span>

          <span>
            <small>Enviar a</small>
            <strong>México</strong>
          </span>

          <b>›</b>
        </button>

        <section class="ed-next-campaign">
          <div
            id="edNextCampaignTrack"
            class="ed-next-campaign-track"
          >
            <article class="ed-next-slide is-tech">
              <div>
                <small>TECNOLOGÍA E&D</small>

                <h1>
                  Descubre lo nuevo,
                  <b>compra a tu manera.</b>
                </h1>

                <p>
                  Celulares, audio y accesorios
                  seleccionados para ti.
                </p>

                <button
                  type="button"
                  data-ed-next-category="Tecnología"
                >
                  Explorar tecnología
                </button>
              </div>

              <figure aria-hidden="true">
                <span>📱</span>
                <span>🎧</span>
                <span>⌚</span>
              </figure>
            </article>

            <article class="ed-next-slide is-home">
              <div>
                <small>HOGAR E&D</small>

                <h2>
                  Todo para crear
                  <b>un espacio mejor.</b>
                </h2>

                <p>
                  Productos útiles y modernos
                  para todos los días.
                </p>

                <button
                  type="button"
                  data-ed-next-category="Hogar"
                >
                  Explorar hogar
                </button>
              </div>

              <figure aria-hidden="true">
                <span>🏠</span>
                <span>🛋️</span>
                <span>💡</span>
              </figure>
            </article>

            <article class="ed-next-slide is-benefit">
              <div>
                <small>EXPERIENCIA E&D</small>

                <h2>
                  Compra segura,
                  <b>fácil y acompañada.</b>
                </h2>

                <p>
                  Atención personalizada,
                  beneficios y envíos.
                </p>

                <button
                  type="button"
                  data-ed-next-catalog
                >
                  Ver productos
                </button>
              </div>

              <figure aria-hidden="true">
                <span>📦</span>
                <span>🛡️</span>
                <span>🎁</span>
              </figure>
            </article>
          </div>

          <div
            id="edNextCampaignDots"
            class="ed-next-campaign-dots"
          ></div>
        </section>

        <section
          class="ed-next-shortcuts"
          aria-label="Accesos rápidos"
        >
          <button
            type="button"
            data-ed-next-scroll="ofertas"
          >
            <span>🔥</span>
            <strong>Ofertas</strong>
          </button>

          <button
            type="button"
            data-ed-next-coupons
          >
            <span>🎟️</span>
            <strong>Cupones</strong>
          </button>

          <button
            type="button"
            data-ed-next-shipping
          >
            <span>🚚</span>
            <strong>Envíos</strong>
          </button>

          <button
            type="button"
            data-ed-next-favorites
          >
            <span>♡</span>
            <strong>Favoritos</strong>
          </button>

          <button
            type="button"
            data-ed-next-orders
          >
            <span>📦</span>
            <strong>Pedidos</strong>
          </button>

          <button
            type="button"
            data-ed-next-account
          >
            <span>👤</span>
            <strong>Cuenta</strong>
          </button>
        </section>

        <section class="ed-next-section">
          <div class="ed-next-section-heading">
            <div>
              <small>EXPLORA E&D</small>
              <h2>Categorías destacadas</h2>
            </div>

            <button
              type="button"
              data-ed-next-catalog
            >
              Ver todas
            </button>
          </div>

          <div class="ed-next-category-rail">
            ${renderCategories()}
          </div>
        </section>

        <section class="ed-next-section">
          <div class="ed-next-section-heading">
            <div>
              <small>SELECCIÓN PERSONALIZADA</small>
              <h2>Ofertas para ti</h2>
            </div>

            <button
              type="button"
              data-ed-next-catalog
            >
              Ver todas
            </button>
          </div>

          <div
            id="edNextOffers"
            class="ed-next-product-rail"
          >
            <article class="ed-next-product-skeleton"></article>
            <article class="ed-next-product-skeleton"></article>
            <article class="ed-next-product-skeleton"></article>
          </div>
        </section>

        <section class="ed-next-section">
          <div class="ed-next-section-heading">
            <div>
              <small>DESCUBRE MÁS</small>
              <h2>Más vendidos</h2>
            </div>

            <button
              type="button"
              data-ed-next-catalog
            >
              Ver todos
            </button>
          </div>

          <div
            id="edNextBestSellers"
            class="ed-next-product-rail"
          >
            <article class="ed-next-product-placeholder">
              <span>📱</span>
              <strong>Productos reales próximamente</strong>
              <small>Conectaremos el catálogo en la siguiente microfase.</small>
            </article>
          </div>
        </section>
      </section>
    `;
  }

  EDNext.components.home = {
    version: "2.0.0-phase-1",
    render,
    categories
  };
})();
