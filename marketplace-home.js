(function () {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  let bannerIndex = 0;
  let bannerTimer = null;

  function showToast(title, message) {
    let toast = $("#edMarketToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "edMarketToast";
      toast.className = "ed-market-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <strong>${title}</strong>
      <span>${message}</span>
    `;

    toast.classList.add("is-visible");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3000);
  }

  function goToCatalog() {
    if (typeof window.goCatalog === "function") {
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
    const chips = $$(".chip[data-filter]");

    const normalized =
      String(category || "").toLowerCase();

    const target = chips.find(chip =>
      String(
        chip.dataset.filter || ""
      ).toLowerCase() === normalized
    );

    if (target) {
      target.click();
    } else if (normalized === "all") {
      chips.find(
        chip =>
          String(chip.dataset.filter)
            .toLowerCase() === "all"
      )?.click();
    }

    $$(".ed-market-tabs [data-ed-market-category]")
      .forEach(button => {
        button.classList.toggle(
          "is-active",
          String(
            button.dataset.edMarketCategory
          ).toLowerCase() === normalized
        );
      });

    goToCatalog();
  }

  function performSearch(value) {
    const original = $("#searchInput");

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

  function setBanner(index) {
    const track = $("#edMarketBannerTrack");
    const banners = $$(".ed-market-banner", track);
    const dots = $$("#edMarketBannerDots button");

    if (!track || !banners.length) return;

    bannerIndex =
      (index + banners.length) %
      banners.length;

    track.style.transform =
      `translateX(-${bannerIndex * 100}%)`;

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle(
        "is-active",
        dotIndex === bannerIndex
      );
    });
  }

  function mountBanners() {
    const banners = $$(".ed-market-banner");
    const dotsContainer =
      $("#edMarketBannerDots");

    if (!banners.length || !dotsContainer) {
      return;
    }

    dotsContainer.innerHTML =
      banners
        .map(
          (_, index) => `
            <button
              type="button"
              aria-label="Promoción ${index + 1}"
              class="${index === 0 ? "is-active" : ""}"
              data-ed-banner-index="${index}"
            ></button>
          `
        )
        .join("");

    $$("[data-ed-banner-index]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            setBanner(
              Number(
                button.dataset.edBannerIndex
              )
            );

            restartBannerTimer();
          }
        );
      });

    restartBannerTimer();
  }

  function restartBannerTimer() {
    clearInterval(bannerTimer);

    bannerTimer = setInterval(() => {
      setBanner(bannerIndex + 1);
    }, 5500);
  }

  function mountSearch() {
    const form =
      $("#edMarketplaceSearchForm");

    const input =
      $("#edMarketplaceSearchInput");

    const clear =
      $("#edMarketplaceClearSearch");

    if (!form || !input || !clear) return;

    input.addEventListener("input", () => {
      clear.hidden = !input.value.trim();
    });

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        performSearch(input.value.trim());
      }
    );

    clear.addEventListener("click", () => {
      input.value = "";
      clear.hidden = true;

      const original = $("#searchInput");

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

    $(".ed-market-camera")
      ?.addEventListener("click", () => {
        showToast(
          "Búsqueda visual",
          "Próximamente podrás buscar productos utilizando una fotografía."
        );
      });
  }

  function mountActions() {
    $$("[data-ed-market-catalog]")
      .forEach(button => {
        button.addEventListener(
          "click",
          goToCatalog
        );
      });

    $$("[data-ed-market-category]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectCategory(
              button.dataset
                .edMarketCategory
            );
          }
        );
      });

    $$("[data-ed-market-scroll]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const target =
              document.getElementById(
                button.dataset.edMarketScroll
              );

            target?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        );
      });

    $("[data-ed-market-coupon]")
      ?.addEventListener("click", () => {
        showToast(
          "Cupones E&D",
          "El centro de cupones estará disponible próximamente."
        );
      });

    $("[data-ed-market-shipping]")
      ?.addEventListener("click", () => {
        showToast(
          "Envíos E&D",
          "Realizamos envíos a todo México. El costo se calcula durante el checkout."
        );
      });

    $("#edMarketplaceNotifications")
      ?.addEventListener("click", () => {
        showToast(
          "Notificaciones",
          "Aquí aparecerán promociones, pedidos y novedades de E&D Market."
        );
      });

    $("#edMarketplaceMenu")
      ?.addEventListener("click", () => {
        showToast(
          "Menú E&D",
          "En la siguiente actualización conectaremos categorías, pedidos, socios y cuenta."
        );
      });
  }

  function syncCartCount() {
    const original = $("#cartCount");
    const marketplace =
      $("#edMarketplaceCartCount");

    if (!marketplace) return;

    const update = () => {
      marketplace.textContent =
        original?.textContent?.trim() || "0";
    };

    update();

    if (original) {
      new MutationObserver(update).observe(
        original,
        {
          childList: true,
          characterData: true,
          subtree: true
        }
      );
    }
  }

  function mountCountdown() {
    const element =
      $("#edMarketCountdown");

    if (!element) return;

    let seconds =
      10 * 3600 +
      49 * 60 +
      10;

    setInterval(() => {
      seconds =
        seconds > 0
          ? seconds - 1
          : 12 * 3600;

      const hours =
        Math.floor(seconds / 3600);

      const minutes =
        Math.floor(
          (seconds % 3600) / 60
        );

      const remainingSeconds =
        seconds % 60;

      element.textContent = [
        hours,
        minutes,
        remainingSeconds
      ]
        .map(value =>
          String(value).padStart(2, "0")
        )
        .join(" : ");
    }, 1000);
  }

  function hidePreviousHome() {
    document.documentElement.classList.add(
      "ed-marketplace-option-one"
    );
  }

  function mount() {
    hidePreviousHome();
    mountSearch();
    mountActions();
    mountBanners();
    mountCountdown();
    syncCartCount();

    console.log(
      "✓ E&D Marketplace Home Opción 1 cargado"
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
