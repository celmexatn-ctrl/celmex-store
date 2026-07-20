(function () {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  function getOriginalSearch() {
    return $("#searchInput");
  }

  function goToCatalog() {
    if (typeof window.goCatalog === "function") {
      window.goCatalog();
      return;
    }

    const catalog =
      $("#catalogo") ||
      $("#catalogo-shopify");

    catalog?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function submitSearch(value) {
    const original = getOriginalSearch();

    if (original) {
      original.value = value;

      original.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );

      original.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );
    }

    goToCatalog();
  }

  function selectCategory(category) {
    const chips = $$(".chip[data-filter]");

    const target = chips.find(
      chip =>
        String(chip.dataset.filter || "")
          .toLowerCase() ===
        String(category || "")
          .toLowerCase()
    );

    if (target) {
      target.click();
    } else if (category === "all") {
      const allChip = chips.find(
        chip => chip.dataset.filter === "all"
      );

      allChip?.click();
    }

    $$(".ed-discovery-tabs [data-ed-category]")
      .forEach(button => {
        button.classList.toggle(
          "is-active",
          button.dataset.edCategory === category
        );
      });

    goToCatalog();
  }

  function showTemporaryMessage(title, message) {
    let toast = $("#edDiscoveryToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "edDiscoveryToast";
      toast.className = "ed-discovery-toast";
      toast.setAttribute("role", "status");

      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <strong>${title}</strong>
      <span>${message}</span>
    `;

    toast.classList.add("is-visible");

    window.clearTimeout(
      showTemporaryMessage.timer
    );

    showTemporaryMessage.timer =
      window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 3200);
  }

  function mountSearch() {
    const form = $("#edDiscoverySearchForm");
    const input = $("#edDiscoverySearch");
    const clear = $("#edDiscoverySearchClear");

    if (!form || !input || !clear) return;

    input.addEventListener("input", () => {
      clear.hidden = !input.value.trim();
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      submitSearch(input.value.trim());
    });

    clear.addEventListener("click", () => {
      input.value = "";
      clear.hidden = true;

      const original = getOriginalSearch();

      if (original) {
        original.value = "";
        original.dispatchEvent(
          new Event("input", {
            bubbles: true
          })
        );
      }

      input.focus();
    });

    const original = getOriginalSearch();

    original?.addEventListener("input", () => {
      if (
        document.activeElement !== input
      ) {
        input.value = original.value;
        clear.hidden = !input.value.trim();
      }
    });
  }

  function mountActions() {
    $$("[data-ed-go-catalog]")
      .forEach(button => {
        button.addEventListener(
          "click",
          goToCatalog
        );
      });

    $$("[data-ed-category]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectCategory(
              button.dataset.edCategory
            );
          }
        );
      });

    $$("[data-ed-scroll-target]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const target = document.getElementById(
              button.dataset.edScrollTarget
            );

            target?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        );
      });

    $("[data-ed-favorites]")
      ?.addEventListener("click", () => {
        if (
          typeof window.openFavorites ===
          "function"
        ) {
          window.openFavorites();
        }
      });

    $("[data-ed-cashback-info]")
      ?.addEventListener("click", () => {
        showTemporaryMessage(
          "Cashback E&D",
          "Muy pronto podrás consultar y utilizar tus beneficios desde aquí."
        );
      });

    $("[data-ed-shipping-info]")
      ?.addEventListener("click", () => {
        showTemporaryMessage(
          "Envíos a todo México",
          "La cobertura, costo y tiempo se calcularán según tu código postal y los productos elegidos."
        );
      });
  }

  function mount() {
    mountSearch();
    mountActions();

    document.documentElement.classList.add(
      "ed-discovery-ready"
    );

    console.log(
      "✓ E&D Discovery Home 2.1B cargado"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      mount,
      { once: true }
    );
  } else {
    mount();
  }
})();
