(function () {
  "use strict";

  window.EDNext = window.EDNext || {};

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(
      parent.querySelectorAll(selector)
    );

  let currentSlide = 0;
  let slideTimer = null;
  let touchStartX = 0;

  function showToast(title, message) {
    let toast =
      $("#edNextToast");

    if (!toast) {
      toast =
        document.createElement("div");

      toast.id = "edNextToast";
      toast.className =
        "ed-next-toast";

      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <strong>${title}</strong>
      <span>${message}</span>
    `;

    toast.classList.add("is-visible");

    window.clearTimeout(
      showToast.timer
    );

    showToast.timer =
      window.setTimeout(() => {
        toast.classList.remove(
          "is-visible"
        );
      }, 2800);
  }

  function goCatalog() {
    if (
      typeof window.goCatalog ===
      "function"
    ) {
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
    const target =
      $$(".chip[data-filter]")
        .find(chip =>
          String(
            chip.dataset.filter || ""
          ).toLowerCase() ===
          String(category || "")
            .toLowerCase()
        );

    target?.click();
    goCatalog();
  }

  function search(value) {
    const query =
      String(value || "").trim();

    const original =
      $("#searchInput");

    if (original) {
      original.value = query;

      original.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }

    goCatalog();
  }

  function setSlide(index) {
    const track =
      $("#edNextCampaignTrack");

    const slides =
      $$(".ed-next-slide", track);

    const dots =
      $$("#edNextCampaignDots button");

    if (!track || !slides.length) {
      return;
    }

    currentSlide =
      (
        index +
        slides.length
      ) % slides.length;

    track.style.transform =
      `translate3d(-${currentSlide * 100}%,0,0)`;

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle(
        "is-active",
        dotIndex === currentSlide
      );
    });
  }

  function startSlider() {
    window.clearInterval(slideTimer);

    slideTimer =
      window.setInterval(() => {
        setSlide(currentSlide + 1);
      }, 6000);
  }

  function mountSlider() {
    const track =
      $("#edNextCampaignTrack");

    const slides =
      $$(".ed-next-slide", track);

    const dots =
      $("#edNextCampaignDots");

    if (
      !track ||
      !slides.length ||
      !dots
    ) {
      return;
    }

    dots.innerHTML =
      slides.map(
        (_, index) => `
          <button
            type="button"
            data-ed-next-slide="${index}"
            class="${index === 0
              ? "is-active"
              : ""}"
            aria-label="Campaña ${index + 1}"
          ></button>
        `
      ).join("");

    $$("[data-ed-next-slide]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            setSlide(
              Number(
                button.dataset.edNextSlide
              )
            );

            startSlider();
          }
        );
      });

    track.addEventListener(
      "touchstart",
      event => {
        touchStartX =
          event.touches[0].clientX;

        window.clearInterval(
          slideTimer
        );
      },
      {
        passive: true
      }
    );

    track.addEventListener(
      "touchend",
      event => {
        const distance =
          event.changedTouches[0]
            .clientX -
          touchStartX;

        if (Math.abs(distance) > 45) {
          setSlide(
            distance < 0
              ? currentSlide + 1
              : currentSlide - 1
          );
        }

        startSlider();
      },
      {
        passive: true
      }
    );

    startSlider();
  }

  function mountSearch() {
    const form =
      $("#edNextSearchForm");

    const input =
      $("#edNextSearchInput");

    const clear =
      $("#edNextSearchClear");

    if (!form || !input || !clear) {
      return;
    }

    input.addEventListener(
      "input",
      () => {
        clear.hidden =
          !input.value.trim();
      }
    );

    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        search(input.value);
      }
    );

    clear.addEventListener(
      "click",
      () => {
        input.value = "";
        clear.hidden = true;

        const original =
          $("#searchInput");

        if (original) {
          original.value = "";

          original.dispatchEvent(
            new Event("input", {
              bubbles: true
            })
          );
        }

        input.focus();
      }
    );
  }

  function mountActions() {
    $$("[data-ed-next-home]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }
        );
      });

    $$("[data-ed-next-catalog]")
      .forEach(button => {
        button.addEventListener(
          "click",
          goCatalog
        );
      });

    $$("[data-ed-next-category]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            selectCategory(
              button.dataset
                .edNextCategory
            );
          }
        );
      });

    $$("[data-ed-next-scroll]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            document.getElementById(
              button.dataset
                .edNextScroll
            )?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        );
      });

    $("[data-ed-next-cart]")
      ?.addEventListener(
        "click",
        () => window.openQuote?.()
      );

    $("[data-ed-next-favorites]")
      ?.addEventListener(
        "click",
        () => window.openFavorites?.()
      );

    $("[data-ed-next-orders]")
      ?.addEventListener(
        "click",
        () => {
          document.querySelector(
            '[data-ed-v3-nav="orders"]'
          )?.click();
        }
      );

    $("[data-ed-next-account]")
      ?.addEventListener(
        "click",
        () => {
          document.querySelector(
            '[data-ed-v3-nav="account"]'
          )?.click();
        }
      );

    $("[data-ed-next-notifications]")
      ?.addEventListener(
        "click",
        () => {
          showToast(
            "Notificaciones E&D",
            "Aquí recibirás ofertas, novedades y actualizaciones de pedidos."
          );
        }
      );

    $("[data-ed-next-coupons]")
      ?.addEventListener(
        "click",
        () => {
          showToast(
            "Cupones E&D",
            "El centro de cupones se encuentra en preparación."
          );
        }
      );

    $("[data-ed-next-shipping]")
      ?.addEventListener(
        "click",
        () => {
          showToast(
            "Envíos E&D",
            "Realizamos envíos a todo México."
          );
        }
      );

    $("#edNextMenuButton")
      ?.addEventListener(
        "click",
        openMenu
      );
  }

  function openMenu() {
    let menu =
      $("#edNextMenu");

    if (!menu) {
      menu =
        document.createElement("aside");

      menu.id = "edNextMenu";
      menu.className =
        "ed-next-menu";

      menu.innerHTML = `
        <header>
          <div>
            <small>E&D MARKET NEXT</small>
            <strong>Menú principal</strong>
          </div>

          <button
            type="button"
            data-ed-next-close-menu
          >
            ×
          </button>
        </header>

        <nav>
          <button
            type="button"
            data-ed-next-catalog
          >
            <span>▦</span>
            <div>
              <strong>Todos los productos</strong>
              <small>Explora el catálogo completo</small>
            </div>
            <b>›</b>
          </button>

          <button
            type="button"
            data-ed-next-pricing
          >
            <span>🧮</span>
            <div>
              <strong>Pricing Engine</strong>
              <small>Simulación de precios</small>
            </div>
            <b>›</b>
          </button>

          <button
            type="button"
            data-ed-next-socios
          >
            <span>♛</span>
            <div>
              <strong>Socios E&D</strong>
              <small>Ventas y comisiones</small>
            </div>
            <b>›</b>
          </button>

          <button
            type="button"
            data-ed-next-old-version
          >
            <span>↩</span>
            <div>
              <strong>Interfaz anterior</strong>
              <small>Desactivar Next temporalmente</small>
            </div>
            <b>›</b>
          </button>
        </nav>
      `;

      document.body.appendChild(
        menu
      );

      menu
        .querySelector(
          "[data-ed-next-close-menu]"
        )
        ?.addEventListener(
          "click",
          closeMenu
        );

      menu
        .querySelector(
          "[data-ed-next-catalog]"
        )
        ?.addEventListener(
          "click",
          () => {
            closeMenu();
            goCatalog();
          }
        );

      menu
        .querySelector(
          "[data-ed-next-pricing]"
        )
        ?.addEventListener(
          "click",
          () => {
            closeMenu();
            window.openEDPricingEngine?.();
          }
        );

      menu
        .querySelector(
          "[data-ed-next-socios]"
        )
        ?.addEventListener(
          "click",
          () => {
            closeMenu();
            window.openSocioAccess?.();
          }
        );

      menu
        .querySelector(
          "[data-ed-next-old-version]"
        )
        ?.addEventListener(
          "click",
          () => {
            EDNext.state.disable();
          }
        );
    }

    requestAnimationFrame(() => {
      menu.classList.add("is-open");
    });
  }

  function closeMenu() {
    $("#edNextMenu")
      ?.classList.remove("is-open");
  }

  function syncCart() {
    const target =
      $("#edNextCartCount");

    const source =
      $("#cartCount") ||
      $("#edMarketplaceCartCount");

    if (!target) return;

    const update = () => {
      const count =
        source?.textContent
          ?.trim() || "0";

      target.textContent = count;
      target.hidden = count === "0";
    };

    update();

    if (source) {
      new MutationObserver(
        update
      ).observe(source, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
  }

  function hideLegacyHome() {
    document.documentElement
      .classList.add(
        "ed-next-enabled"
      );
  }

  function mount() {
    if (
      !EDNext.state?.isEnabled?.()
    ) {
      document.documentElement
        .classList.add(
          "ed-next-disabled"
        );

      return;
    }

    const main =
      document.querySelector("main");

    if (!main) {
      console.error(
        "E&D Next: no se encontró <main>."
      );

      return;
    }

    if (
      !document.getElementById(
        "edNextHome"
      )
    ) {
      main.insertAdjacentHTML(
        "afterbegin",
        EDNext.components.home.render()
      );
    }

    hideLegacyHome();
    mountSearch();
    mountActions();
    mountSlider();
    syncCart();

    console.log(
      "✓ E&D Market Next v2.0 Fase 1 cargado"
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      mount,
      {
        once: true
      }
    );
  } else {
    mount();
  }
})();
