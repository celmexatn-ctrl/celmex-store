(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const STORAGE_KEY = "edmarket-checkout-address-v1";

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function load() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch {
      return {};
    }
  }

  function save(address) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(address)
    );

    return address;
  }

  function render() {
    const address = load();

    return `
      <section class="ed-address-screen">
        <div class="ed-step-heading">
          <span class="ed-step-heading-icon">📍</span>

          <div>
            <small>PASO 2 DE 6</small>
            <h2>Dirección de entrega</h2>
            <p>
              Indica dónde deseas recibir tu pedido.
              Podrás revisar los datos antes de confirmar.
            </p>
          </div>
        </div>

        <div class="ed-address-card">
          <div class="ed-card-heading">
            <div>
              <span>🏠</span>
              <strong>Datos del domicilio</strong>
            </div>

            <small>Campos obligatorios *</small>
          </div>

          <form
            id="edAddressForm"
            class="ed-address-form"
            novalidate
          >
            <label class="ed-field ed-field-wide">
              <span>Calle *</span>

              <input
                name="street"
                type="text"
                autocomplete="address-line1"
                placeholder="Ej. Avenida Obregón"
                value="${escapeHtml(address.street || "")}"
                required
              />
            </label>

            <div class="ed-address-grid ed-address-grid-numbers">
              <label class="ed-field">
                <span>Número exterior *</span>

                <input
                  name="exterior"
                  type="text"
                  autocomplete="address-line2"
                  placeholder="123"
                  value="${escapeHtml(address.exterior || "")}"
                  required
                />
              </label>

              <label class="ed-field">
                <span>Número interior</span>

                <input
                  name="interior"
                  type="text"
                  placeholder="Depto. 4"
                  value="${escapeHtml(address.interior || "")}"
                />
              </label>
            </div>

            <label class="ed-field ed-field-wide">
              <span>Colonia *</span>

              <input
                name="neighborhood"
                type="text"
                placeholder="Nombre de la colonia"
                value="${escapeHtml(address.neighborhood || "")}"
                required
              />
            </label>

            <div class="ed-address-grid">
              <label class="ed-field">
                <span>Código postal *</span>

                <input
                  name="postalCode"
                  type="text"
                  inputmode="numeric"
                  autocomplete="postal-code"
                  maxlength="5"
                  placeholder="84000"
                  value="${escapeHtml(address.postalCode || "")}"
                  required
                />
              </label>

              <label class="ed-field">
                <span>Ciudad o municipio *</span>

                <input
                  name="city"
                  type="text"
                  autocomplete="address-level2"
                  placeholder="Nogales"
                  value="${escapeHtml(address.city || "")}"
                  required
                />
              </label>
            </div>

            <label class="ed-field ed-field-wide">
              <span>Estado *</span>

              <select
                name="state"
                autocomplete="address-level1"
                required
              >
                ${renderStates(address.state || "")}
              </select>
            </label>

            <label class="ed-field ed-field-wide">
              <span>Referencias para la entrega</span>

              <textarea
                name="references"
                rows="3"
                maxlength="240"
                placeholder="Ej. Casa color blanco, frente a una farmacia."
              >${escapeHtml(address.references || "")}</textarea>

              <small>
                Ayuda al repartidor a localizar el domicilio.
              </small>
            </label>

            <label class="ed-address-default">
              <input
                name="isDefault"
                type="checkbox"
                ${address.isDefault !== false ? "checked" : ""}
              />

              <span>
                <b>Usar como dirección principal</b>
                <small>
                  Se seleccionará automáticamente en próximas compras.
                </small>
              </span>
            </label>

            <p
              id="edAddressMessage"
              class="ed-form-message"
              hidden
            ></p>
          </form>
        </div>

        <div class="ed-checkout-trust">
          <span>🔒</span>

          <div>
            <strong>Información protegida</strong>
            <p>
              Tu dirección se utiliza únicamente para gestionar
              la entrega de tus pedidos.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function renderStates(selectedState) {
    const states = [
      "",
      "Aguascalientes",
      "Baja California",
      "Baja California Sur",
      "Campeche",
      "Chiapas",
      "Chihuahua",
      "Ciudad de México",
      "Coahuila",
      "Colima",
      "Durango",
      "Estado de México",
      "Guanajuato",
      "Guerrero",
      "Hidalgo",
      "Jalisco",
      "Michoacán",
      "Morelos",
      "Nayarit",
      "Nuevo León",
      "Oaxaca",
      "Puebla",
      "Querétaro",
      "Quintana Roo",
      "San Luis Potosí",
      "Sinaloa",
      "Sonora",
      "Tabasco",
      "Tamaulipas",
      "Tlaxcala",
      "Veracruz",
      "Yucatán",
      "Zacatecas"
    ];

    return states
      .map(state => {
        const value = escapeHtml(state);
        const selected =
          state === selectedState ? "selected" : "";

        const label =
          state || "Selecciona tu estado";

        return `
          <option
            value="${value}"
            ${selected}
          >
            ${label}
          </option>
        `;
      })
      .join("");
  }

  function mount(container) {
    const postalInput = container?.querySelector(
      '[name="postalCode"]'
    );

    postalInput?.addEventListener("input", event => {
      event.target.value = event.target.value
        .replace(/\D/g, "")
        .slice(0, 5);
    });
  }

  function showMessage(container, message) {
    const element = container?.querySelector(
      "#edAddressMessage"
    );

    if (!element) return;

    element.hidden = false;
    element.textContent = message;
  }

  function validate(container) {
    const form = container?.querySelector(
      "#edAddressForm"
    );

    if (!form) {
      return {
        valid: false,
        message: "No se encontró el formulario de dirección."
      };
    }

    if (!form.reportValidity()) {
      showMessage(
        container,
        "Completa los campos obligatorios."
      );

      return {
        valid: false
      };
    }

    const values = Object.fromEntries(
      new FormData(form).entries()
    );

    const postalCode = String(
      values.postalCode || ""
    ).replace(/\D/g, "");

    if (postalCode.length !== 5) {
      const input = form.elements.namedItem(
        "postalCode"
      );

      input?.setCustomValidity(
        "Escribe un código postal de 5 dígitos."
      );

      input?.reportValidity();
      input?.setCustomValidity("");

      return {
        valid: false
      };
    }

    const address = save({
      street: String(values.street || "").trim(),
      exterior: String(values.exterior || "").trim(),
      interior: String(values.interior || "").trim(),
      neighborhood: String(
        values.neighborhood || ""
      ).trim(),
      postalCode,
      city: String(values.city || "").trim(),
      state: String(values.state || "").trim(),
      references: String(
        values.references || ""
      ).trim(),
      isDefault: form.elements.isDefault.checked
    });

    return {
      valid: true,
      data: address
    };
  }

  EDCore.checkoutAddress = {
    version: "1.2.0",
    load,
    save,
    render,
    mount,
    validate
  };

  console.log(
    "✓ E&D Checkout Address v1.2.0 cargado"
  );
})();
