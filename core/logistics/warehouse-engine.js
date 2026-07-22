(function () {
  "use strict";

  window.EDCore = window.EDCore || {};
  EDCore.logistics = EDCore.logistics || {};

  const storage =
    EDCore.logistics.storage;

  const providers =
    EDCore.logistics.providers;

  const STORAGE_NAME = "warehouses";

  function createId() {
    return [
      "warehouse",
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2, 9)
    ].join("-");
  }

  function normalizeText(value = "") {
    return String(value)
      .trim();
  }

  function normalizePostalCode(value = "") {
    return normalizeText(value)
      .replace(/\D/g, "")
      .slice(0, 5);
  }

  function loadAll() {
    const warehouses =
      storage?.read?.(
        STORAGE_NAME,
        []
      );

    return Array.isArray(warehouses)
      ? warehouses
      : [];
  }

  function saveAll(warehouses = []) {
    if (!Array.isArray(warehouses)) {
      throw new TypeError(
        "warehouses debe ser un arreglo."
      );
    }

    return storage.write(
      STORAGE_NAME,
      warehouses
    );
  }

  function validate(input = {}) {
    const errors = [];

    const providerId =
      normalizeText(
        input.providerId
      );

    const name =
      normalizeText(input.name);

    const postalCode =
      normalizePostalCode(
        input.postalCode
      );

    const country =
      normalizeText(
        input.country || "MX"
      ).toUpperCase();

    if (!providerId) {
      errors.push(
        "El proveedor es obligatorio."
      );
    } else if (
      providers?.getById &&
      !providers.getById(providerId)
    ) {
      errors.push(
        "El proveedor relacionado no existe."
      );
    }

    if (!name) {
      errors.push(
        "El nombre del centro logístico es obligatorio."
      );
    }

    if (
      country === "MX" &&
      postalCode.length !== 5
    ) {
      errors.push(
        "El código postal mexicano debe tener 5 dígitos."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function normalizeWarehouse(
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

      providerId:
        normalizeText(
          input.providerId
        ),

      name:
        normalizeText(input.name),

      contactName:
        normalizeText(
          input.contactName
        ),

      phone:
        normalizeText(input.phone),

      email:
        normalizeText(input.email)
          .toLowerCase(),

      street:
        normalizeText(input.street),

      exterior:
        normalizeText(
          input.exterior
        ),

      interior:
        normalizeText(
          input.interior
        ),

      neighborhood:
        normalizeText(
          input.neighborhood
        ),

      city:
        normalizeText(input.city),

      state:
        normalizeText(input.state),

      postalCode:
        normalizePostalCode(
          input.postalCode
        ),

      country:
        normalizeText(
          input.country || "MX"
        ).toUpperCase(),

      preparationDays:
        Math.max(
          0,
          Number(
            input.preparationDays || 0
          )
        ),

      pickupEnabled:
        Boolean(
          input.pickupEnabled
        ),

      shippingEnabled:
        input.shippingEnabled !== false,

      status:
        input.status === "inactive"
          ? "inactive"
          : "active",

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
        warehouse: null
      };
    }

    const warehouses = loadAll();

    const warehouse =
      normalizeWarehouse(input);

    if (
      warehouses.some(
        item => item.id === warehouse.id
      )
    ) {
      return {
        success: false,
        errors: [
          "Ya existe un centro logístico con ese ID."
        ],
        warehouse: null
      };
    }

    warehouses.push(warehouse);
    saveAll(warehouses);

    return {
      success: true,
      errors: [],
      warehouse
    };
  }

  function update(id, changes = {}) {
    const warehouseId =
      normalizeText(id);

    const warehouses = loadAll();

    const index =
      warehouses.findIndex(
        item => item.id === warehouseId
      );

    if (index < 0) {
      return {
        success: false,
        errors: [
          "Centro logístico no encontrado."
        ],
        warehouse: null
      };
    }

    const candidate = {
      ...warehouses[index],
      ...changes,
      id: warehouseId
    };

    const validation =
      validate(candidate);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warehouse: null
      };
    }

    const warehouse =
      normalizeWarehouse(
        candidate,
        warehouses[index]
      );

    warehouses[index] = warehouse;
    saveAll(warehouses);

    return {
      success: true,
      errors: [],
      warehouse
    };
  }

  function getById(id) {
    const warehouseId =
      normalizeText(id);

    return (
      loadAll().find(
        warehouse =>
          warehouse.id === warehouseId
      ) ||
      null
    );
  }

  function list(options = {}) {
    const providerId =
      normalizeText(
        options.providerId
      );

    const includeInactive =
      Boolean(options.includeInactive);

    return loadAll().filter(
      warehouse => {
        if (
          !includeInactive &&
          warehouse.status !== "active"
        ) {
          return false;
        }

        if (
          providerId &&
          warehouse.providerId !==
            providerId
        ) {
          return false;
        }

        return true;
      }
    );
  }

  function remove(id) {
    const warehouseId =
      normalizeText(id);

    const warehouses = loadAll();

    const next =
      warehouses.filter(
        warehouse =>
          warehouse.id !== warehouseId
      );

    if (
      next.length ===
      warehouses.length
    ) {
      return false;
    }

    saveAll(next);
    return true;
  }

  EDCore.logistics.warehouses = {
    version: "1.0.0",
    storageName: STORAGE_NAME,
    createId,
    validate,
    normalizeWarehouse,
    loadAll,
    saveAll,
    create,
    update,
    getById,
    list,
    remove
  };

  console.log(
    "✓ E&D Warehouse Engine v1.0.0 cargado"
  );
})();
