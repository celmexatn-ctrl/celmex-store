(function () {
  "use strict";

  window.EDCore = window.EDCore || {};
  EDCore.logistics = EDCore.logistics || {};

  const storage =
    EDCore.logistics.storage;

  const STORAGE_NAME = "providers";

  function createId(prefix = "provider") {
    const random =
      Math.random()
        .toString(36)
        .slice(2, 9);

    return [
      prefix,
      Date.now(),
      random
    ].join("-");
  }

  function normalizeText(value = "") {
    return String(value)
      .trim();
  }

  function normalizeEmail(value = "") {
    return normalizeText(value)
      .toLowerCase();
  }

  function normalizePhone(value = "") {
    return normalizeText(value)
      .replace(/[^\d+]/g, "");
  }

  function loadAll() {
    const providers =
      storage?.read?.(
        STORAGE_NAME,
        []
      );

    return Array.isArray(providers)
      ? providers
      : [];
  }

  function saveAll(providers = []) {
    if (!Array.isArray(providers)) {
      throw new TypeError(
        "providers debe ser un arreglo."
      );
    }

    return storage.write(
      STORAGE_NAME,
      providers
    );
  }

  function validate(input = {}) {
    const errors = [];

    const businessName =
      normalizeText(
        input.businessName ||
        input.name
      );

    const email =
      normalizeEmail(input.email);

    if (!businessName) {
      errors.push(
        "El nombre comercial es obligatorio."
      );
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      errors.push(
        "El correo del proveedor no es válido."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function normalizeProvider(
    input = {},
    existing = null
  ) {
    const now =
      new Date().toISOString();

    return {
      id:
        existing?.id ||
        normalizeText(input.id) ||
        createId(),

      businessName:
        normalizeText(
          input.businessName ||
          input.name
        ),

      legalName:
        normalizeText(
          input.legalName
        ),

      email:
        normalizeEmail(input.email),

      phone:
        normalizePhone(input.phone),

      contactName:
        normalizeText(
          input.contactName
        ),

      status:
        input.status === "inactive"
          ? "inactive"
          : "active",

      fulfillmentMode:
        normalizeText(
          input.fulfillmentMode ||
          "provider_dispatch"
        ),

      preparationDays:
        Math.max(
          0,
          Number(
            input.preparationDays || 0
          )
        ),

      notes:
        normalizeText(input.notes),

      createdAt:
        existing?.createdAt ||
        input.createdAt ||
        now,

      updatedAt: now
    };
  }

  function create(input = {}) {
    const validation =
      validate(input);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        provider: null
      };
    }

    const providers = loadAll();

    const provider =
      normalizeProvider(input);

    const duplicate =
      providers.some(item =>
        item.id === provider.id
      );

    if (duplicate) {
      return {
        success: false,
        errors: [
          "Ya existe un proveedor con ese ID."
        ],
        provider: null
      };
    }

    providers.push(provider);
    saveAll(providers);

    return {
      success: true,
      errors: [],
      provider
    };
  }

  function update(id, changes = {}) {
    const providerId =
      normalizeText(id);

    const providers = loadAll();

    const index =
      providers.findIndex(
        item => item.id === providerId
      );

    if (index < 0) {
      return {
        success: false,
        errors: [
          "Proveedor no encontrado."
        ],
        provider: null
      };
    }

    const candidate = {
      ...providers[index],
      ...changes,
      id: providerId
    };

    const validation =
      validate(candidate);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        provider: null
      };
    }

    const provider =
      normalizeProvider(
        candidate,
        providers[index]
      );

    providers[index] = provider;
    saveAll(providers);

    return {
      success: true,
      errors: [],
      provider
    };
  }

  function getById(id) {
    const providerId =
      normalizeText(id);

    return (
      loadAll().find(
        provider =>
          provider.id === providerId
      ) ||
      null
    );
  }

  function list(options = {}) {
    const includeInactive =
      Boolean(options.includeInactive);

    const providers = loadAll();

    return providers.filter(provider =>
      includeInactive ||
      provider.status === "active"
    );
  }

  function deactivate(id) {
    return update(id, {
      status: "inactive"
    });
  }

  function activate(id) {
    return update(id, {
      status: "active"
    });
  }

  function remove(id) {
    const providerId =
      normalizeText(id);

    const providers = loadAll();

    const next =
      providers.filter(
        provider =>
          provider.id !== providerId
      );

    if (
      next.length ===
      providers.length
    ) {
      return false;
    }

    saveAll(next);
    return true;
  }

  EDCore.logistics.providers = {
    version: "1.0.0",
    storageName: STORAGE_NAME,
    createId,
    validate,
    normalizeProvider,
    loadAll,
    saveAll,
    create,
    update,
    getById,
    list,
    activate,
    deactivate,
    remove
  };

  console.log(
    "✓ E&D Provider Engine v1.0.0 cargado"
  );
})();
