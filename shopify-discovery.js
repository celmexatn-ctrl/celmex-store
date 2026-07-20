(function () {
  "use strict";

  let activeCategory = "Todos";
  let searchTerm = "";

  function normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getProducts() {
    return window.EDShopifyProducts || [];
  }

  function productCategory(product) {
    return (
      window.EDCategoryForProduct?.(product) ||
      "Productos"
    );
  }

  function searchableText(product) {
    return normalize(
      [
        product.title,
        product.description,
        product.productType,
        product.vendor,
        ...(product.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  function getCategories(products) {
    const categories = products
      .map(productCategory)
      .filter(Boolean);

    return [
      "Todos",
      ...Array.from(new Set(categories)).sort(
        (a, b) => a.localeCompare(b, "es")
      )
    ];
  }

  function ensureControls() {
    const section = document.getElementById(
      "catalogo-shopify"
    );

    const grid = document.getElementById(
      "shopifyCatalog"
    );

    if (!section || !grid) return null;

    let controls = document.getElementById(
      "shopifyDiscoveryControls"
    );

    if (!controls) {
      controls = document.createElement("div");
      controls.id = "shopifyDiscoveryControls";
      controls.className = "shopify-discovery-controls";

      controls.innerHTML = `
        <label class="shopify-search-box">
          <span aria-hidden="true">⌕</span>

          <input
            id="shopifySearchInput"
            type="search"
            placeholder="Buscar productos, categorías o marcas…"
            autocomplete="off"
            aria-label="Buscar productos"
          >

          <button
            id="shopifyClearSearch"
            type="button"
            aria-label="Limpiar búsqueda"
            hidden
          >
            ×
          </button>
        </label>

        <div
          id="shopifyCategoryChips"
          class="shopify-category-chips"
          aria-label="Categorías"
        ></div>

        <div class="shopify-discovery-summary">
          <span id="shopifyVisibleCount"></span>

          <button
            id="shopifyResetFilters"
            type="button"
            hidden
          >
            Mostrar todos
          </button>
        </div>
      `;

      section.insertBefore(controls, grid);
      installControlEvents();
    }

    return controls;
  }

  function renderCategories() {
    ensureControls();

    const container = document.getElementById(
      "shopifyCategoryChips"
    );

    if (!container) return;

    const categories = getCategories(getProducts());

    if (
      activeCategory !== "Todos" &&
      !categories.includes(activeCategory)
    ) {
      activeCategory = "Todos";
    }

    container.innerHTML = categories
      .map(category => {
        const active = category === activeCategory;

        return `
          <button
            type="button"
            class="shopify-category-chip ${
              active ? "active" : ""
            }"
            data-shopify-category="${escapeHtml(category)}"
            aria-pressed="${active}"
          >
            ${escapeHtml(category)}
          </button>
        `;
      })
      .join("");
  }

  function filterProducts() {
    const products = getProducts();
    const normalizedSearch = normalize(searchTerm);

    let visible = 0;

    products.forEach(product => {
      const card = document.querySelector(
        `.shopify-product-card[data-product-handle="${CSS.escape(
          product.handle
        )}"]`
      );

      if (!card) return;

      const category = productCategory(product);

      const categoryMatches =
        activeCategory === "Todos" ||
        category === activeCategory;

      const searchMatches =
        !normalizedSearch ||
        searchableText(product).includes(
          normalizedSearch
        );

      const show = categoryMatches && searchMatches;

      card.hidden = !show;

      if (show) visible += 1;
    });

    renderSummary(visible, products.length);
    renderEmptyState(visible);
  }

  function renderSummary(visible, total) {
    const count = document.getElementById(
      "shopifyVisibleCount"
    );

    const reset = document.getElementById(
      "shopifyResetFilters"
    );

    const clear = document.getElementById(
      "shopifyClearSearch"
    );

    if (count) {
      count.textContent =
        visible === total
          ? `${total} productos`
          : `${visible} de ${total} productos`;
    }

    const hasFilters =
      activeCategory !== "Todos" ||
      Boolean(searchTerm.trim());

    if (reset) reset.hidden = !hasFilters;
    if (clear) clear.hidden = !searchTerm.trim();
  }

  function renderEmptyState(visible) {
    const grid = document.getElementById(
      "shopifyCatalog"
    );

    if (!grid) return;

    let empty = document.getElementById(
      "shopifyDiscoveryEmpty"
    );

    if (visible === 0) {
      if (!empty) {
        empty = document.createElement("div");
        empty.id = "shopifyDiscoveryEmpty";
        empty.className = "shopify-discovery-empty";

        empty.innerHTML = `
          <div>🔎</div>
          <h3>No encontramos productos</h3>
          <p>
            Prueba con otra palabra o elimina los filtros.
          </p>

          <button
            type="button"
            data-reset-shopify-filters
          >
            Mostrar todos
          </button>
        `;

        grid.appendChild(empty);
      }

      empty.hidden = false;
    } else if (empty) {
      empty.hidden = true;
    }
  }

  function setCategory(category) {
    activeCategory = category || "Todos";

    renderCategories();
    filterProducts();
  }

  function resetFilters() {
    activeCategory = "Todos";
    searchTerm = "";

    const input = document.getElementById(
      "shopifySearchInput"
    );

    if (input) input.value = "";

    renderCategories();
    filterProducts();
  }

  function installControlEvents() {
    const input = document.getElementById(
      "shopifySearchInput"
    );

    input?.addEventListener("input", event => {
      searchTerm = event.target.value;
      filterProducts();
    });

    document
      .getElementById("shopifyClearSearch")
      ?.addEventListener("click", () => {
        searchTerm = "";

        if (input) {
          input.value = "";
          input.focus();
        }

        filterProducts();
      });

    document
      .getElementById("shopifyResetFilters")
      ?.addEventListener("click", resetFilters);
  }

  document.addEventListener("click", event => {
    const categoryButton = event.target.closest(
      "[data-shopify-category]"
    );

    if (categoryButton) {
      setCategory(
        categoryButton.dataset.shopifyCategory
      );

      return;
    }

    if (
      event.target.closest(
        "[data-reset-shopify-filters]"
      )
    ) {
      resetFilters();
    }
  });

  function initialize() {
    const products = getProducts();

    if (!products.length) return false;

    ensureControls();
    renderCategories();
    filterProducts();

    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    /*
     * Los productos llegan de Shopify de forma asíncrona.
     * Observamos la cuadrícula hasta que termine de cargarlos.
     */
    const grid = document.getElementById(
      "shopifyCatalog"
    );

    if (!grid) return;

    if (initialize()) return;

    const observer = new MutationObserver(() => {
      if (initialize()) {
        observer.disconnect();
      }
    });

    observer.observe(grid, {
      childList: true,
      subtree: true
    });
  });

  window.EDShopifyDiscovery = {
    initialize,
    resetFilters,
    setCategory
  };
})();
