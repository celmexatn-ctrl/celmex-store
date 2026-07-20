(function () {
  "use strict";

  const STORAGE_KEY = "edmarket-shopify-favorites-v1";
  let favorites = loadFavorites();
  let showingOnlyFavorites = false;

  function loadFavorites() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function saveFavorites() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(favorites)
    );
  }

  function isFavorite(handle) {
    return favorites.includes(handle);
  }

  function toggleFavorite(handle) {
    if (!handle) return false;

    if (isFavorite(handle)) {
      favorites = favorites.filter(
        favoriteHandle => favoriteHandle !== handle
      );
    } else {
      favorites = [...favorites, handle];
    }

    saveFavorites();
    refreshFavoriteButtons();
    updateFavoriteCounter();

    if (showingOnlyFavorites) {
      applyFavoritesFilter();
    }

    showFavoriteToast(
      isFavorite(handle)
        ? "Producto agregado a favoritos."
        : "Producto eliminado de favoritos."
    );

    return isFavorite(handle);
  }

  function createFavoriteButton(handle, extraClass = "") {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      `ed-favorite-button ${extraClass}`.trim();

    button.dataset.favoriteHandle = handle;
    button.setAttribute(
      "aria-label",
      isFavorite(handle)
        ? "Eliminar de favoritos"
        : "Agregar a favoritos"
    );

    button.innerHTML = isFavorite(handle) ? "♥" : "♡";

    return button;
  }

  function decorateProductCards() {
    document
      .querySelectorAll(
        ".shopify-product-card[data-product-handle]"
      )
      .forEach(card => {
        const handle = card.dataset.productHandle;

        if (!handle) return;

        const imageWrap = card.querySelector(
          ".shopify-product-image-wrap"
        );

        if (
          imageWrap &&
          !imageWrap.querySelector(
            "[data-favorite-handle]"
          )
        ) {
          imageWrap.style.position = "relative";

          imageWrap.appendChild(
            createFavoriteButton(
              handle,
              "ed-favorite-card-button"
            )
          );
        }
      });
  }

  function decorateProductModal() {
    const modal = document.getElementById(
      "shopifyProductDetailModal"
    );

    const content = document.getElementById(
      "shopifyProductDetailContent"
    );

    if (!modal?.open || !content) return;

    const productTitle = content.querySelector(
      ".ed-product-info-column h2"
    );

    const currentProduct =
      window.EDShopifyProducts?.find(product => {
        return product.title === productTitle?.textContent;
      });

    if (!currentProduct) return;

    const info = content.querySelector(
      ".ed-product-info-column"
    );

    if (
      info &&
      !info.querySelector(".ed-favorite-modal-button")
    ) {
      info.style.position = "relative";

      info.prepend(
        createFavoriteButton(
          currentProduct.handle,
          "ed-favorite-modal-button"
        )
      );
    }
  }

  function refreshFavoriteButtons() {
    document
      .querySelectorAll("[data-favorite-handle]")
      .forEach(button => {
        const active = isFavorite(
          button.dataset.favoriteHandle
        );

        button.innerHTML = active ? "♥" : "♡";
        button.classList.toggle("active", active);

        button.setAttribute(
          "aria-label",
          active
            ? "Eliminar de favoritos"
            : "Agregar a favoritos"
        );
      });
  }

  function ensureFavoritesControl() {
    const controls = document.getElementById(
      "shopifyDiscoveryControls"
    );

    if (!controls) return;

    if (
      document.getElementById(
        "shopifyFavoritesFilterButton"
      )
    ) {
      return;
    }

    const summary = controls.querySelector(
      ".shopify-discovery-summary"
    );

    if (!summary) return;

    const button = document.createElement("button");

    button.id = "shopifyFavoritesFilterButton";
    button.type = "button";
    button.className = "ed-favorites-filter";
    button.innerHTML = `
      <span aria-hidden="true">♡</span>
      Favoritos
      <b id="shopifyFavoritesCount">0</b>
    `;

    summary.appendChild(button);
    updateFavoriteCounter();
  }

  function updateFavoriteCounter() {
    const counter = document.getElementById(
      "shopifyFavoritesCount"
    );

    if (counter) {
      counter.textContent = String(favorites.length);
    }

    const filterButton = document.getElementById(
      "shopifyFavoritesFilterButton"
    );

    filterButton?.classList.toggle(
      "active",
      showingOnlyFavorites
    );
  }

  function applyFavoritesFilter() {
    document
      .querySelectorAll(
        ".shopify-product-card[data-product-handle]"
      )
      .forEach(card => {
        const favorite = isFavorite(
          card.dataset.productHandle
        );

        card.classList.toggle(
          "hidden-by-favorites",
          showingOnlyFavorites && !favorite
        );
      });

    const empty = document.getElementById(
      "edFavoritesEmpty"
    );

    const grid = document.getElementById(
      "shopifyCatalog"
    );

    const visibleFavorites = favorites.filter(handle =>
      document.querySelector(
        `.shopify-product-card[data-product-handle="${CSS.escape(
          handle
        )}"]`
      )
    );

    if (
      showingOnlyFavorites &&
      visibleFavorites.length === 0 &&
      grid
    ) {
      if (!empty) {
        const message = document.createElement("div");

        message.id = "edFavoritesEmpty";
        message.className = "ed-favorites-empty";
        message.innerHTML = `
          <div>♡</div>
          <h3>Aún no tienes favoritos</h3>
          <p>
            Toca el corazón de un producto para guardarlo.
          </p>
        `;

        grid.appendChild(message);
      }
    } else {
      empty?.remove();
    }
  }

  function toggleFavoritesView() {
    showingOnlyFavorites = !showingOnlyFavorites;
    applyFavoritesFilter();
    updateFavoriteCounter();

    document
      .getElementById("catalogo-shopify")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  function showFavoriteToast(message) {
    let toast = document.getElementById(
      "edFavoriteToast"
    );

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "edFavoriteToast";
      toast.className = "ed-favorite-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(showFavoriteToast.timer);

    showFavoriteToast.timer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2200);
  }

  document.addEventListener("click", event => {
    const favoriteButton = event.target.closest(
      "[data-favorite-handle]"
    );

    if (favoriteButton) {
      event.preventDefault();
      event.stopPropagation();

      toggleFavorite(
        favoriteButton.dataset.favoriteHandle
      );

      return;
    }

    if (
      event.target.closest(
        "#shopifyFavoritesFilterButton"
      )
    ) {
      toggleFavoritesView();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById(
      "shopifyCatalog"
    );

    if (grid) {
      const observer = new MutationObserver(() => {
        decorateProductCards();
        ensureFavoritesControl();
        refreshFavoriteButtons();
      });

      observer.observe(grid, {
        childList: true,
        subtree: true
      });
    }

    const modalObserver = new MutationObserver(() => {
      decorateProductModal();
      refreshFavoriteButtons();
    });

    modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"]
    });

    decorateProductCards();
    ensureFavoritesControl();
    refreshFavoriteButtons();
    updateFavoriteCounter();
  });

  window.EDShopifyFavorites = {
    toggleFavorite,
    isFavorite,
    getFavorites() {
      return [...favorites];
    }
  };
})();
