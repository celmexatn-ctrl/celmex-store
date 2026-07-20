(function () {
  "use strict";

  let scrollTimer = null;

  function mount() {
    document.documentElement.classList.add(
      "ed-market-v303"
    );

    const whatsapp =
      document.querySelector(".floating-wa");

    if (whatsapp) {
      window.addEventListener(
        "scroll",
        () => {
          whatsapp.classList.add(
            "ed-v303-scrolling"
          );

          window.clearTimeout(scrollTimer);

          scrollTimer =
            window.setTimeout(() => {
              whatsapp.classList.remove(
                "ed-v303-scrolling"
              );
            }, 550);
        },
        {
          passive: true
        }
      );
    }

    console.log(
      "✓ E&D Market v3.0.3 layout cargado"
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
