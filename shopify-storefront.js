(function () {
  "use strict";

  const config = window.ED_SHOPIFY_CONFIG;

  function setStatus(message, state) {
    const element = document.getElementById("shopifyConnectionStatus");
    if (!element) return;

    element.textContent = message;
    element.dataset.state = state || "loading";
  }

  async function request(query, variables = {}) {
    if (!config?.domain || !config?.publicToken) {
      throw new Error("Falta la configuración pública de Shopify.");
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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Shopify respondió con código ${response.status}.`);
    }

    if (result.errors?.length) {
      throw new Error(
        result.errors.map((error) => error.message).join("; ")
      );
    }

    return result.data;
  }

  async function getProducts(first = 20) {
    const query = `
      query EDMarketProducts($first: Int!) {
        shop {
          name
        }

        products(first: $first) {
          nodes {
            id
            handle
            title
            description
            productType
            vendor
            tags

            featuredImage {
              url
              altText
            }

            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }

            variants(first: 30) {
              nodes {
                id
                title
                availableForSale
                quantityAvailable

                price {
                  amount
                  currencyCode
                }

                image {
                  url
                  altText
                }

                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    `;

    const data = await request(query, { first });
    return {
      shopName: data.shop.name,
      products: data.products.nodes
    };
  }

  window.EDShopify = {
    request,
    getProducts
  };

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      setStatus("Conectando E&D Market con Shopify…", "loading");

      const result = await getProducts(20);

      window.EDShopifyProducts = result.products;

      setStatus(
        `Shopify conectado · ${result.products.length} productos recibidos`,
        "online"
      );

      console.log("E&D Market conectado con Shopify:", result);
    } catch (error) {
      console.error("Error de Shopify:", error);

      setStatus(
        `No se pudo conectar con Shopify: ${error.message}`,
        "error"
      );
    }
  });
})();
