(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const steps = [
    {
      id: "account",
      label: "Cuenta",
      icon: "👤",
      title: "Identifica tu compra",
      description:
        "Inicia sesión o continúa como invitado."
    },
    {
      id: "address",
      label: "Dirección",
      icon: "📍",
      title: "¿Dónde entregamos?",
      description:
        "Confirma la dirección de entrega."
    },
    {
      id: "shipping",
      label: "Envío",
      icon: "🚚",
      title: "Selecciona el envío",
      description:
        "Revisa las opciones disponibles."
    },
    {
      id: "payment",
      label: "Pago",
      icon: "💳",
      title: "Pago seguro E&D",
      description:
        "Selecciona tu método de pago."
    },
    {
      id: "summary",
      label: "Resumen",
      icon: "📋",
      title: "Revisa tu pedido",
      description:
        "Confirma productos, entrega y total."
    },
    {
      id: "orders",
      label: "Pedido",
      icon: "📦",
      title: "Pedido confirmado",
      description:
        "Consulta el estado de tu compra."
    }
  ];

  const state = {
    currentStep: 0,
    context: {}
  };

  function ensureShell() {
    let dialog = document.getElementById(
      "edFlowCheckout"
    );

    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "edFlowCheckout";
    dialog.className = "ed-flow-dialog";

    dialog.innerHTML = `
      <div class="ed-flow-shell">
        <header class="ed-flow-header">
          <div class="ed-flow-topline">
            <div class="ed-flow-brand">
              <small>E&D MARKET</small>
              <strong>Checkout seguro</strong>
            </div>

            <button
              type="button"
              class="ed-flow-close"
              data-ed-flow-close
              aria-label="Cerrar checkout"
            >
              ×
            </button>
          </div>

          <div
            class="ed-flow-progress"
            aria-hidden="true"
          >
            <span id="edFlowProgress"></span>
          </div>

          <div
            id="edFlowSteps"
            class="ed-flow-steps"
            aria-label="Progreso de compra"
          ></div>
        </header>

        <main
          id="edFlowContent"
          class="ed-flow-content"
        ></main>

        <footer class="ed-flow-footer">
          <button
            type="button"
            id="edFlowBack"
            class="ed-flow-back"
          >
            Atrás
          </button>

          <button
            type="button"
            id="edFlowNext"
            class="ed-flow-next"
          >
            Continuar
          </button>
        </footer>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog
      .querySelector("[data-ed-flow-close]")
      ?.addEventListener("click", close);

    dialog
      .querySelector("#edFlowBack")
      ?.addEventListener("click", previous);

    dialog
      .querySelector("#edFlowNext")
      ?.addEventListener("click", next);

    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      close();
    });

    return dialog;
  }

  function render() {
    const dialog = ensureShell();
    const step = steps[state.currentStep];

    const progress =
      ((state.currentStep + 1) / steps.length) * 100;

    const progressBar = dialog.querySelector(
      "#edFlowProgress"
    );

    const stepList = dialog.querySelector(
      "#edFlowSteps"
    );

    const content = dialog.querySelector(
      "#edFlowContent"
    );

    const backButton = dialog.querySelector(
      "#edFlowBack"
    );

    const nextButton = dialog.querySelector(
      "#edFlowNext"
    );

    progressBar.style.width = `${progress}%`;

    stepList.innerHTML = steps
      .map((item, index) => {
        const status =
          index === state.currentStep
            ? "is-active"
            : index < state.currentStep
              ? "is-complete"
              : "";

        return `
          <span class="ed-flow-step ${status}">
            ${item.icon} ${item.label}
          </span>
        `;
      })
      .join("");

    const moduleMap = {
      account: EDCore.checkoutAccount,
      address: EDCore.checkoutAddress,
      shipping: EDCore.checkoutShipping,
      payment: EDCore.checkoutPayment,
      summary: EDCore.checkoutSummary,
      orders: EDCore.checkoutOrders
    };

    const activeModule = moduleMap[step.id];

    content.innerHTML =
      activeModule?.render?.(state.context) ||
      `
        <section
          class="ed-flow-panel"
          data-ed-flow-panel="${step.id}"
        >
          <h2>${step.title}</h2>
          <p>${step.description}</p>

          <div class="ed-flow-placeholder">
            <strong>
              Paso ${state.currentStep + 1}
              de ${steps.length}
            </strong>

            <span>
              El módulo “${step.label}” está conectado
              y listo para recibir su funcionalidad.
            </span>
          </div>
        </section>
      `;

    activeModule?.mount?.(content, state.context);

    backButton.disabled = state.currentStep === 0;

    nextButton.textContent =
      state.currentStep === steps.length - 1
        ? "Finalizar"
        : "Continuar";

    stepList
      .querySelector(".is-active")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
  }

  function open(context = {}) {
    const dialog = ensureShell();

    state.context = {
      ...state.context,
      ...context
    };

    state.currentStep = 0;

    render();

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.classList.add(
      "ed-flow-checkout-open"
    );
  }

  function close() {
    const dialog = document.getElementById(
      "edFlowCheckout"
    );

    if (dialog?.open) {
      dialog.close();
    }

    document.body.classList.remove(
      "ed-flow-checkout-open"
    );
  }

  function goTo(stepId) {
    const index = steps.findIndex(
      step => step.id === stepId
    );

    if (index < 0) return false;

    state.currentStep = index;
    render();

    return true;
  }

  function next() {
    const step = steps[state.currentStep];

    const moduleMap = {
      account: EDCore.checkoutAccount,
      address: EDCore.checkoutAddress,
      shipping: EDCore.checkoutShipping,
      payment: EDCore.checkoutPayment,
      summary: EDCore.checkoutSummary,
      orders: EDCore.checkoutOrders
    };

    const activeModule = moduleMap[step.id];
    const content = document.getElementById(
      "edFlowContent"
    );

    const validation =
      activeModule?.validate?.(content, state.context);

    if (validation && !validation.valid) {
      return;
    }

    if (validation?.data) {
      state.context[step.id] = validation.data;
    }

    if (state.currentStep >= steps.length - 1) {
      close();
      return;
    }

    state.currentStep += 1;
    render();
  }

  function previous() {
    if (state.currentStep <= 0) return;

    state.currentStep -= 1;
    render();
  }

  EDCore.checkoutShell = {
    version: "3.0.1",
    steps: [...steps],
    state,
    ensureShell,
    render,
    open,
    close,
    goTo,
    next,
    previous
  };

  window.openEDFlowCheckout = open;

  console.log(
    "✓ E&D Checkout Shell v3.0.1 cargado"
  );
})();
