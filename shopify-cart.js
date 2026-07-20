(function () {
  "use strict";

  const config = window.ED_SHOPIFY_CONFIG;
  const STORAGE_KEY = "edmarket-shopify-cart-v1";

  let currentCart = null;
  let busy = false;

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

    const json = await response.json();

    if (!response.ok) {
      throw new Error(`Shopify respondió con código ${response.status}.`);
    }

    if (json.errors?.length) {
      throw new Error(
        json.errors.map(error => error.message).join("; ")
      );
    }

    return json.data;
  }

  const cartFields = `
    id
    checkoutUrl
    totalQuantity

    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }

    lines(first: 100) {
      nodes {
        id
        quantity

        merchandise {
          ... on ProductVariant {
            id
            title

            product {
              title
            }
          }
        }
      }
    }
  `;

  function savedCartId() {
    return localStorage.getItem(STORAGE_KEY) || "";
  }

  function saveCartId(cartId) {
    if (cartId) {
      localStorage.setItem(STORAGE_KEY, cartId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function createCart(variantId, quantity = 1) {
    const mutation = `
      mutation CreateEDMarketCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            ${cartFields}
          }

          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await request(mutation, {
      input: {
        buyerIdentity: {
          countryCode: "MX"
        },
        lines: [
          {
            merchandiseId: variantId,
            quantity
          }
        ]
      }
    });

    const result = data.cartCreate;

    if (result.userErrors?.length) {
      throw new Error(
        result.userErrors.map(error => error.message).join("; ")
      );
    }

    if (!result.cart) {
      throw new Error("Shopify no pudo crear el carrito.");
    }

    currentCart = result.cart;
    saveCartId(currentCart.id);

    return currentCart;
  }

  async function addCartLine(cartId, variantId, quantity = 1) {
    const mutation = `
      mutation AddEDMarketCartLine(
        $cartId: ID!
        $lines: [CartLineInput!]!
      ) {
        cartLinesAdd(
          cartId: $cartId
          lines: $lines
        ) {
          cart {
            ${cartFields}
          }

          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await request(mutation, {
      cartId,
      lines: [
        {
          merchandiseId: variantId,
          quantity
        }
      ]
    });

    const result = data.cartLinesAdd;

    if (result.userErrors?.length) {
      throw new Error(
        result.userErrors.map(error => error.message).join("; ")
      );
    }

    if (!result.cart) {
      throw new Error("Shopify no pudo actualizar el carrito.");
    }

    currentCart = result.cart;
    saveCartId(currentCart.id);

    return currentCart;
  }

  async function getCart(cartId) {
    if (!cartId) return null;

    const query = `
      query GetEDMarketCart($id: ID!) {
        cart(id: $id) {
          ${cartFields}
        }
      }
    `;

    const data = await request(query, { id: cartId });
    return data.cart || null;
  }

  async function addToCart(variantId, quantity = 1) {
    if (!variantId) {
      throw new Error("Este producto no tiene una variante disponible.");
    }

    const cartId = savedCartId();

    if (!cartId) {
      return createCart(variantId, quantity);
    }

    try {
      return await addCartLine(cartId, variantId, quantity);
    } catch (error) {
      console.warn(
        "Se reemplazará el carrito anterior:",
        error
      );

      saveCartId("");
      return createCart(variantId, quantity);
    }
  }

  function showToast(message, type = "success") {
    let toast = document.getElementById("shopifyCartToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "shopifyCartToast";
      toast.className = "shopify-cart-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("visible");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2800);
  }

  function updateCartCount(quantity) {
    const value = Number(quantity || 0);

    document
      .querySelectorAll(
        "#cartCount, .cart-count, [data-cart-count]"
      )
      .forEach(element => {
        element.textContent = String(value);
      });

    document
      .querySelectorAll('[onclick="openQuote()"]')
      .forEach(element => {
        element.setAttribute(
          "aria-label",
          `Abrir carrito: ${value} productos`
        );
      });
  }

  async function handleProductButton(button) {
    if (busy || button.disabled) return;

    const variantId = button.dataset.variantId;

    if (!variantId) {
      showToast(
        "Este producto no tiene una variante disponible.",
        "error"
      );
      return;
    }

    busy = true;

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Agregando…";

    try {
      const quantityInput = document.getElementById(
        "edProductQuantity"
      );

      const quantity = Math.max(
        1,
        Math.min(20, Number(quantityInput?.value || 1))
      );

      const cart = await addToCart(variantId, quantity);

      updateCartCount(cart.totalQuantity);

      button.textContent = "✓ Agregado";
      showToast("Producto agregado al carrito.");

      setTimeout(() => {
        button.textContent = "Agregar al carrito";
        button.disabled = false;
      }, 1300);
    } catch (error) {
      console.error("Error del carrito:", error);

      button.textContent = previousText;
      button.disabled = false;

      showToast(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el producto.",
        "error"
      );
    } finally {
      busy = false;
    }
  }

  async function openCart() {
    try {
      let cart = currentCart;
      const cartId = savedCartId();

      if (!cart && cartId) {
        cart = await getCart(cartId);
      }

      if (!cart?.checkoutUrl || !cart.totalQuantity) {
        showToast(
          "Tu carrito todavía está vacío.",
          "error"
        );
        return;
      }

      currentCart = cart;
      window.location.href = cart.checkoutUrl;
    } catch (error) {
      console.error("No se pudo abrir el carrito:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "No se pudo abrir el carrito.",
        "error"
      );
    }
  }

  function bindButtons() {
    document.addEventListener("click", event => {
      const button = event.target.closest(
        ".shopify-modal-add-cart"
      );

      if (!button) return;

      event.preventDefault();
      handleProductButton(button);
    });

    window.openQuote = openCart;
    window.openShopifyCart = openCart;

    document
      .querySelectorAll('[onclick="openQuote()"]')
      .forEach(element => {
        element.onclick = openCart;
      });
  }

  async function restoreCart() {
    const cartId = savedCartId();

    if (!cartId) {
      updateCartCount(0);
      return;
    }

    try {
      currentCart = await getCart(cartId);

      if (!currentCart) {
        saveCartId("");
        updateCartCount(0);
        return;
      }

      updateCartCount(currentCart.totalQuantity);
    } catch (error) {
      console.warn(
        "No se pudo restaurar el carrito anterior:",
        error
      );
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindButtons();
    restoreCart();

    /*
     * app.js también configura la cotización antigua.
     * Repetimos el reemplazo al terminar toda la carga.
     */
    setTimeout(() => {
      window.openQuote = openCart;

      document
        .querySelectorAll('[onclick="openQuote()"]')
        .forEach(element => {
          element.onclick = openCart;
        });
    }, 1000);
  });

  window.EDShopifyCart = {
    addToCart,
    getCart,
    openCart
  };
})();
