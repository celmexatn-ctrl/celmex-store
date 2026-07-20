(function () {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  let touchStartX = 0;
  let touchStartY = 0;
  let currentBanner = 0;
  let autoTimer = null;

  function getBanners() {
    return $$(".ed-market-banner");
  }

  function getDots() {
    return $$("#edMarketBannerDots button");
  }

  function showBanner(index) {
    const track = $("#edMarketBannerTrack");
    const banners = getBanners();

    if (!track || !banners.length) return;

    currentBanner =
      (index + banners.length) %
      banners.length;

    track.style.transform =
      `translate3d(-${currentBanner * 100}%, 0, 0)`;

    getDots().forEach((dot, dotIndex) => {
      dot.classList.toggle(
        "is-active",
        dotIndex === currentBanner
      );
    });
  }

  function restartAutoBanner() {
    window.clearInterval(autoTimer);

    autoTimer = window.setInterval(() => {
      showBanner(currentBanner + 1);
    }, 6000);
  }

  function mountSwipe() {
    const section =
      $(".ed-market-banner-section");

    if (!section) return;

    section.addEventListener(
      "touchstart",
      event => {
        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        window.clearInterval(autoTimer);
      },
      {
        passive: true
      }
    );

    section.addEventListener(
      "touchend",
      event => {
        const touch = event.changedTouches[0];

        const distanceX =
          touch.clientX - touchStartX;

        const distanceY =
          touch.clientY - touchStartY;

        if (
          Math.abs(distanceX) > 45 &&
          Math.abs(distanceX) >
            Math.abs(distanceY)
        ) {
          showBanner(
            distanceX < 0
              ? currentBanner + 1
              : currentBanner - 1
          );
        }

        restartAutoBanner();
      },
      {
        passive: true
      }
    );

    getDots().forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showBanner(index);
        restartAutoBanner();
      });
    });

    restartAutoBanner();
  }

  function improveBannerContent() {
    const banners = getBanners();

    const content = [
      {
        kicker: "OFERTA DESTACADA",
        title:
          'Tecnología que quieres, <b>al precio que buscas.</b>',
        text:
          "Descubre celulares, audio y accesorios seleccionados por E&D.",
        button:
          "Explorar tecnología"
      },
      {
        kicker: "RENUEVA TU ESPACIO",
        title:
          'Todo para tu hogar, <b>en un solo lugar.</b>',
        text:
          "Productos prácticos para hacer más cómodo tu día a día.",
        button:
          "Ver productos"
      },
      {
        kicker: "COMPRA CON CONFIANZA",
        title:
          'Atención, beneficios y <b>acompañamiento E&D.</b>',
        text:
          "Compra fácilmente y recibe atención durante todo el proceso.",
        button:
          "Conocer E&D"
      }
    ];

    banners.forEach((banner, index) => {
      const item = content[index];

      if (!item) return;

      const kicker =
        banner.querySelector(
          ".ed-market-banner-copy > small"
        );

      const heading =
        banner.querySelector(
          ".ed-market-banner-copy h1, .ed-market-banner-copy h2"
        );

      const description =
        banner.querySelector(
          ".ed-market-banner-copy p"
        );

      const button =
        banner.querySelector(
          ".ed-market-banner-copy button"
        );

      if (kicker) {
        kicker.textContent = item.kicker;
      }

      if (heading) {
        heading.innerHTML = item.title;
      }

      if (description) {
        description.textContent =
          item.text;
      }

      if (button) {
        button.textContent =
          item.button;
      }
    });
  }

  function cleanSearch() {
    const input =
      $("#edMarketplaceSearchInput");

    const clear =
      $("#edMarketplaceClearSearch");

    if (!input) return;

    const suspiciousValues = [
      "cámara",
      "camara",
      "camera"
    ];

    if (
      suspiciousValues.includes(
        input.value
          .trim()
          .toLowerCase()
      )
    ) {
      input.value = "";

      input.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }

    input.placeholder =
      "Buscar en E&D Market";

    if (clear) {
      clear.hidden =
        !input.value.trim();
    }

    input.addEventListener("search", () => {
      if (!input.value.trim() && clear) {
        clear.hidden = true;
      }
    });
  }

  function enhanceQuickAccess() {
    const shortcuts =
      $(".ed-market-shortcuts");

    if (!shortcuts) return;

    shortcuts.setAttribute(
      "aria-label",
      "Servicios y beneficios E&D"
    );

    shortcuts.addEventListener(
      "wheel",
      event => {
        if (
          Math.abs(event.deltaY) >
          Math.abs(event.deltaX)
        ) {
          shortcuts.scrollLeft +=
            event.deltaY;
        }
      },
      {
        passive: true
      }
    );
  }

  function mountScrollHeader() {
    const header =
      $(".ed-market-header");

    if (!header) return;

    const update = () => {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 18
      );
    };

    update();

    window.addEventListener(
      "scroll",
      update,
      {
        passive: true
      }
    );
  }

  function mount() {
    document.documentElement.classList.add(
      "ed-market-v302"
    );

    improveBannerContent();
    cleanSearch();
    enhanceQuickAccess();
    mountScrollHeader();

    window.setTimeout(() => {
      currentBanner = getDots().findIndex(
        dot =>
          dot.classList.contains(
            "is-active"
          )
      );

      if (currentBanner < 0) {
        currentBanner = 0;
      }

      mountSwipe();
    }, 250);

    console.log(
      "✓ E&D Market v3.0.2 cargado"
    );
  }

  if (document.readyState === "loading") {
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
