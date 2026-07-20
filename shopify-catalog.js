(function () {
  "use strict";

  const config = window.ED_SHOPIFY_CONFIG;
  const containerId = "shopifyCatalog";

  function money(amount, currencyCode) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currencyCode || "MXN"
    }).format(Number(amount || 0));
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function storefrontRequest(query, variables = {}) {
    if (!config?.domain || !config?.publicToken) {
      throw new Error("Falta el token público de Shopify.");
    }

    const response = await fetch(
      `https://${config.domain}/api/${config.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": config.publicToken
        },
        body: JSON.stringify({ query, variables })
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(`Shopify respondió con código ${response.status}.`);
    }

    if (json.errors?.length) {
      throw new Error(json.errors.map(error => error.message).join("; "));
    }

    return json.data;
  }

  async function loadProducts() {
    const query = `
      query EDMarketCatalog($first: Int!) {
        products(first: $first) {
          nodes {
            id
            handle
            title
            description
            productType
            vendor
            featuredImage {
              url
              altText
            }

            images(first: 12) {
              nodes {
                url
                altText
              }
            }

            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 10) {
              nodes {
                id
                title
                availableForSale

                image {
                  url
                  altText
                }

                selectedOptions {
                  name
                  value
                }

                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    const data = await storefrontRequest(query, { first: 50 });
    return data.products.nodes;
  }

  function productCard(product) {
    const image = product.featuredImage;
    const price = product.priceRange.minVariantPrice;
    const firstVariant = product.variants.nodes[0];

    return `
      <article
        class="shopify-product-card"
        data-product-handle="${escapeHtml(product.handle)}"
      >
        <div class="shopify-product-image-wrap">
          ${
            image
              ? `<img
                   src="${escapeHtml(image.url)}"
                   alt="${escapeHtml(image.altText || product.title)}"
                   class="shopify-product-image"
                   loading="lazy"
                 >`
              : `<div class="shopify-product-placeholder">E&D</div>`
          }
        </div>

        <div class="shopify-product-content">
          <span class="shopify-product-category">
            ${escapeHtml(
              window.EDCategoryForProduct?.(product) || "Productos"
            )}
          </span>

          <h3>${escapeHtml(product.title)}</h3>
          <div class="shop-stars">★★★★★</div>

          <p class="shopify-product-price">
            Desde ${money(price.amount, price.currencyCode)}
          </p>

          <button
            type="button"
            class="shopify-product-button shopify-open-product"
            data-variant-id="${escapeHtml(firstVariant?.id || "")}"
            data-product-handle="${escapeHtml(product.handle)}"
            ${firstVariant?.availableForSale ? "" : "disabled"}
          >
            ${firstVariant?.availableForSale ? "Ver producto" : "Agotado"}
          </button>
        </div>
      </article>
    `;
  }

  function renderProducts(products) {
    const container = document.getElementById(containerId);
    const status = document.getElementById("shopifyCatalogStatus");

    if (!container) return;

    if (!products.length) {
      container.innerHTML = `
        <div class="shopify-empty">
          Actualmente no hay productos disponibles.
        </div>
      `;

      if (status) status.textContent = "0 productos recibidos";
      return;
    }

    container.innerHTML = products.map(productCard).join("");

    if (status) {
      status.textContent =
        `${products.length} productos disponibles`;
    }

    window.EDShopifyProducts = products;
  }

  function renderError(error) {
    const container = document.getElementById(containerId);
    const status = document.getElementById("shopifyCatalogStatus");

    if (status) {
      status.textContent = "No fue posible cargar el catálogo";
    }

    if (container) {
      container.innerHTML = `
        <div class="shopify-error">
          <strong>No fue posible cargar los productos</strong>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const products = await loadProducts();
      renderProducts(products);
    } catch (error) {
      console.error("E&D Shopify:", error);
      renderError(error);
    }
  });

  window.EDShopifyCatalog = {
    storefrontRequest,
    loadProducts
  };
})();
