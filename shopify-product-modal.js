(function () {
  "use strict";

  let currentProduct = null;
  let selectedVariant = null;

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(amount, currencyCode = "MXN") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currencyCode
    }).format(Number(amount || 0));
  }

  function ensureModal() {
    if (document.getElementById("shopifyProductDetailModal")) {
      return;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <dialog
        id="shopifyProductDetailModal"
        class="ed-product-modal"
      >
        <button
          type="button"
          class="ed-product-close"
          data-close-product-modal
          aria-label="Cerrar"
        >
          ×
        </button>

        <div id="shopifyProductDetailContent"></div>
      </dialog>
      `
    );
  }

  function getProduct(handle) {
    return (window.EDShopifyProducts || []).find(
      product => product.handle === handle
    );
  }

  function getImages(product) {
    const images = product.images?.nodes || [];

    if (images.length) {
      return images;
    }

    if (product.featuredImage) {
      return [product.featuredImage];
    }

    return [];
  }

  function availableVariants(product) {
    return product.variants?.nodes || [];
  }

  function optionText(variant) {
    const options = variant.selectedOptions || [];

    if (options.length) {
      return options
        .map(option => `${option.name}: ${option.value}`)
        .join(" · ");
    }

    if (
      variant.title &&
      variant.title.toLowerCase() !== "default title"
    ) {
      return variant.title;
    }

    return "Opción única";
  }

  function selectInitialVariant(product) {
    const variants = availableVariants(product);

    return (
      variants.find(variant => variant.availableForSale) ||
      variants[0] ||
      null
    );
  }

  function renderGallery(images, title) {
    if (!images.length) {
      return `
        <div class="ed-product-main-image ed-product-placeholder">
          E&D
        </div>
      `;
    }

    return `
      <div class="ed-product-gallery">
        <div class="ed-product-main-image">
          <img
            id="edProductMainImage"
            src="${escapeHtml(images[0].url)}"
            alt="${escapeHtml(images[0].altText || title)}"
          >
        </div>

        ${
          images.length > 1
            ? `
              <div class="ed-product-thumbnails">
                ${images
                  .map(
                    (image, index) => `
                      <button
                        type="button"
                        class="ed-product-thumbnail ${
                          index === 0 ? "active" : ""
                        }"
                        data-gallery-image="${escapeHtml(image.url)}"
                        aria-label="Ver imagen ${index + 1}"
                      >
                        <img
                          src="${escapeHtml(image.url)}"
                          alt="${escapeHtml(image.altText || title)}"
                        >
                      </button>
                    `
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  function renderVariantOptions(product) {
    const variants = availableVariants(product);

    if (!variants.length) {
      return "";
    }

    return `
      <label class="ed-product-field">
        <span>Elige una opción</span>

        <select id="edProductVariantSelect">
          ${variants
            .map(
              variant => `
                <option
                  value="${escapeHtml(variant.id)}"
                  ${variant.id === selectedVariant?.id ? "selected" : ""}
                  ${variant.availableForSale ? "" : "disabled"}
                >
                  ${escapeHtml(optionText(variant))}
                  ${variant.availableForSale ? "" : " — Agotado"}
                </option>
              `
            )
            .join("")}
        </select>
      </label>
    `;
  }

  function renderProduct(product) {
    currentProduct = product;
    selectedVariant = selectInitialVariant(product);

    const images = getImages(product);
    const content = document.getElementById(
      "shopifyProductDetailContent"
    );

    const price =
      selectedVariant?.price ||
      product.priceRange.minVariantPrice;

    content.innerHTML = `
      <article class="ed-product-detail">
        <div class="ed-product-media-column">
          ${renderGallery(images, product.title)}
        </div>

        <div class="ed-product-info-column">
          <span class="ed-product-kicker">
            ${escapeHtml(
              window.EDCategoryForProduct?.(product) ||
              "Productos"
            )}
          </span>

          <h2>${escapeHtml(product.title)}</h2>

          <p id="edProductPrice" class="ed-product-detail-price">
            ${money(price.amount, price.currencyCode)}
          </p>

          <div
            id="edProductStock"
            class="ed-product-stock ${
              selectedVariant?.availableForSale
                ? "available"
                : "unavailable"
            }"
          >
            ${
              selectedVariant?.availableForSale
                ? "● Disponible"
                : "● Producto agotado"
            }
          </div>

          ${
            product.description
              ? `
                <p class="ed-product-description">
                  ${escapeHtml(product.description)}
                </p>
              `
              : ""
          }

          ${renderVariantOptions(product)}

          <label class="ed-product-field ed-product-quantity">
            <span>Cantidad</span>

            <div class="ed-quantity-control">
              <button
                type="button"
                data-quantity-action="minus"
                aria-label="Reducir cantidad"
              >
                −
              </button>

              <input
                id="edProductQuantity"
                type="number"
                min="1"
                max="20"
                value="1"
                inputmode="numeric"
              >

              <button
                type="button"
                data-quantity-action="plus"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </label>

          <div class="ed-product-actions">
            <button
              type="button"
              class="shopify-modal-add-cart ed-add-cart"
              data-variant-id="${escapeHtml(
                selectedVariant?.id || ""
              )}"
              ${
                selectedVariant?.availableForSale
                  ? ""
                  : "disabled"
              }
            >
              Agregar al carrito
            </button>

            <button
              type="button"
              id="edBuyNowButton"
              class="ed-buy-now"
              ${
                selectedVariant?.availableForSale
                  ? ""
                  : "disabled"
              }
            >
              Comprar ahora
            </button>
          </div>

          <div class="ed-product-trust">
            <span>🚚 Envíos a todo México</span>
            <span>🛡️ Compra protegida</span>
            <span>💳 Pago seguro y protegido</span>
          </div>
        </div>
      </article>
    `;
  }

  function openProduct(handle) {
    ensureModal();

    const product = getProduct(handle);

    if (!product) {
      window.EDShopifyCart?.showToast?.(
        "El producto todavía está cargando.",
        "error"
      );
      return;
    }

    renderProduct(product);

    const modal = document.getElementById(
      "shopifyProductDetailModal"
    );

    modal.showModal();
    document.body.classList.add("ed-product-modal-open");
  }

  function closeProduct() {
    const modal = document.getElementById(
      "shopifyProductDetailModal"
    );

    if (modal?.open) {
      modal.close();
    }

    document.body.classList.remove("ed-product-modal-open");
  }

  function updateSelectedVariant(variantId) {
    selectedVariant = availableVariants(currentProduct).find(
      variant => variant.id === variantId
    );

    if (!selectedVariant) return;

    const price = document.getElementById("edProductPrice");
    const stock = document.getElementById("edProductStock");
    const addButton = document.querySelector(
      ".shopify-modal-add-cart"
    );
    const buyButton = document.getElementById("edBuyNowButton");
    const mainImage = document.getElementById(
      "edProductMainImage"
    );

    if (price) {
      price.textContent = money(
        selectedVariant.price.amount,
        selectedVariant.price.currencyCode
      );
    }

    if (stock) {
      stock.textContent = selectedVariant.availableForSale
        ? "● Disponible"
        : "● Producto agotado";

      stock.className = `ed-product-stock ${
        selectedVariant.availableForSale
          ? "available"
          : "unavailable"
      }`;
    }

    if (addButton) {
      addButton.dataset.variantId = selectedVariant.id;
      addButton.disabled = !selectedVariant.availableForSale;
    }

    if (buyButton) {
      buyButton.disabled = !selectedVariant.availableForSale;
    }

    if (selectedVariant.image?.url && mainImage) {
      mainImage.src = selectedVariant.image.url;
    }
  }

  function getQuantity() {
    const input = document.getElementById("edProductQuantity");

    return Math.max(
      1,
      Math.min(20, Number(input?.value || 1))
    );
  }

  async function buyNow() {
    if (!selectedVariant?.id) return;

    const button = document.getElementById("edBuyNowButton");
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Preparando compra…";

    try {
      const cart = await window.EDShopifyCart.addToCart(
        selectedVariant.id,
        getQuantity()
      );

      window.location.href = cart.checkoutUrl;
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la compra."
      );

      button.disabled = false;
      button.textContent = originalText;
    }
  }

  document.addEventListener("DOMContentLoaded", ensureModal);

  document.addEventListener("click", event => {
    const openButton = event.target.closest(
      ".shopify-open-product"
    );

    if (openButton) {
      event.preventDefault();
      openProduct(openButton.dataset.productHandle);
      return;
    }

    if (event.target.closest("[data-close-product-modal]")) {
      closeProduct();
      return;
    }

    const galleryButton = event.target.closest(
      "[data-gallery-image]"
    );

    if (galleryButton) {
      const mainImage = document.getElementById(
        "edProductMainImage"
      );

      if (mainImage) {
        mainImage.src = galleryButton.dataset.galleryImage;
      }

      document
        .querySelectorAll(".ed-product-thumbnail")
        .forEach(button => button.classList.remove("active"));

      galleryButton.classList.add("active");
      return;
    }

    const quantityButton = event.target.closest(
      "[data-quantity-action]"
    );

    if (quantityButton) {
      const input = document.getElementById(
        "edProductQuantity"
      );

      if (!input) return;

      const current = Number(input.value || 1);

      input.value =
        quantityButton.dataset.quantityAction === "plus"
          ? String(Math.min(20, current + 1))
          : String(Math.max(1, current - 1));

      return;
    }

    if (event.target.id === "edBuyNowButton") {
      buyNow();
    }
  });

  document.addEventListener("change", event => {
    if (event.target.id === "edProductVariantSelect") {
      updateSelectedVariant(event.target.value);
    }
  });

  window.EDProductModal = {
    openProduct,
    closeProduct
  };
})();
