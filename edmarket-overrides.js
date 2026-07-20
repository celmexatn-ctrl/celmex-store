(function () {
  "use strict";

  function openShopifyCatalog() {
    const catalog = document.getElementById("catalogo-shopify");

    if (catalog) {
      catalog.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    /*
     * app.js crea originalmente goCatalog().
     * La reemplazamos después de que todos los scripts cargaron.
     */
    window.goCatalog = openShopifyCatalog;

    document
      .querySelectorAll('[onclick="goCatalog()"]')
      .forEach((element) => {
        element.onclick = openShopifyCatalog;
      });

    /*
     * Botón Productos del menú inferior.
     */
    const productNavButton = Array.from(
      document.querySelectorAll(".bottom-nav button")
    ).find((button) =>
      button.textContent.toLowerCase().includes("productos")
    );

    if (productNavButton) {
      productNavButton.onclick = openShopifyCatalog;
    }
  });
})();
