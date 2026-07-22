(function () {
  "use strict";

  window.EDCore = window.EDCore || {};
  EDCore.logistics = EDCore.logistics || {};

  const storage =
    EDCore.logistics.storage;

  const providers =
    EDCore.logistics.providers;

  const warehouses =
    EDCore.logistics.warehouses;

  const STORAGE_NAME =
    "product-assignments";

  function normalizeText(value = "") {
    return String(value || "").trim();
  }

  function normalizeId(value = "") {
    return normalizeText(value);
  }

  function createId() {
    return [
      "assignment",
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2, 9)
    ].join("-");
  }

  function loadAll() {
    const assignments =
      storage?.read?.(
        STORAGE_NAME,
        []
      );

    return Array.isArray(assignments)
      ? assignments
      : [];
  }

  function saveAll(assignments = []) {
    if (!Array.isArray(assignments)) {
      throw new TypeError(
        "assignments debe ser un arreglo."
      );
    }

    return storage.write(
      STORAGE_NAME,
      assignments
    );
  }

  function validate(input = {}) {
    const errors = [];

    const productId =
      normalizeId(input.productId);

    const variantId =
      normalizeId(input.variantId);

    const providerId =
      normalizeId(input.providerId);

    const warehouseId =
      normalizeId(input.warehouseId);

    if (!productId && !variantId) {
      errors.push(
        "Debes indicar productId o variantId."
      );
    }

    if (!providerId) {
      errors.push(
        "El proveedor es obligatorio."
      );
    } else if (
      providers?.getById &&
      !providers.getById(providerId)
    ) {
      errors.push(
        "El proveedor asignado no existe."
      );
    }

    if (!warehouseId) {
      errors.push(
        "El centro logístico es obligatorio."
      );
    } else if (
      warehouses?.getById
    ) {
      const warehouse =
        warehouses.getById(warehouseId);

      if (!warehouse) {
        errors.push(
          "El centro logístico asignado no existe."
        );
      } else if (
        providerId &&
        warehouse.providerId !== providerId
      ) {
        errors.push(
          "El centro logístico no pertenece al proveedor indicado."
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function normalizeAssignment(
    input = {},
    existing = null
  ) {
    const now =
      new Date().toISOString();

    return {
      id:
        existing?.id ||
        normalizeId(input.id) ||
        createId(),

      productId:
        normalizeId(input.productId),

      variantId:
        normalizeId(input.variantId),

      sku:
        normalizeText(input.sku),

      providerId:
        normalizeId(input.providerId),

      warehouseId:
        normalizeId(input.warehouseId),

      fulfillmentMode:
        normalizeText(
          input.fulfillmentMode ||
          "provider_dispatch"
        ),

      priority:
        Math.max(
          0,
          Number(input.priority || 0)
        ),

      stock:
        Math.max(
          0,
          Number(input.stock || 0)
        ),

      active:
        input.active !== false,

      notes:
        normalizeText(input.notes),

      createdAt:
        existing?.createdAt ||
        input.createdAt ||
        now,

      updatedAt: now
    };
  }

  function findExistingIndex(
    assignments,
    input = {}
  ) {
    const productId =
      normalizeId(input.productId);

    const variantId =
      normalizeId(input.variantId);

    const providerId =
      normalizeId(input.providerId);

    const warehouseId =
      normalizeId(input.warehouseId);

    return assignments.findIndex(
      assignment => {
        const sameCatalogItem =
          variantId
            ? assignment.variantId ===
              variantId
            : (
                !assignment.variantId &&
                assignment.productId ===
                  productId
              );

        return (
          sameCatalogItem &&
          assignment.providerId ===
            providerId &&
          assignment.warehouseId ===
            warehouseId
        );
      }
    );
  }

  function create(input = {}) {
    const validation =
      validate(input);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        assignment: null
      };
    }

    const assignments = loadAll();

    const existingIndex =
      findExistingIndex(
        assignments,
        input
      );

    if (existingIndex >= 0) {
      return {
        success: false,
        errors: [
          "Esta asignación logística ya existe."
        ],
        assignment:
          assignments[existingIndex]
      };
    }

    const assignment =
      normalizeAssignment(input);

    assignments.push(assignment);
    saveAll(assignments);

    return {
      success: true,
      errors: [],
      assignment
    };
  }

  function upsert(input = {}) {
    const validation =
      validate(input);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        assignment: null
      };
    }

    const assignments = loadAll();

    const existingIndex =
      findExistingIndex(
        assignments,
        input
      );

    if (existingIndex < 0) {
      return create(input);
    }

    const assignment =
      normalizeAssignment(
        {
          ...assignments[existingIndex],
          ...input
        },
        assignments[existingIndex]
      );

    assignments[existingIndex] =
      assignment;

    saveAll(assignments);

    return {
      success: true,
      errors: [],
      assignment
    };
  }

  function update(id, changes = {}) {
    const assignmentId =
      normalizeId(id);

    const assignments = loadAll();

    const index =
      assignments.findIndex(
        assignment =>
          assignment.id ===
          assignmentId
      );

    if (index < 0) {
      return {
        success: false,
        errors: [
          "Asignación logística no encontrada."
        ],
        assignment: null
      };
    }

    const candidate = {
      ...assignments[index],
      ...changes,
      id: assignmentId
    };

    const validation =
      validate(candidate);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        assignment: null
      };
    }

    const assignment =
      normalizeAssignment(
        candidate,
        assignments[index]
      );

    assignments[index] =
      assignment;

    saveAll(assignments);

    return {
      success: true,
      errors: [],
      assignment
    };
  }

  function getById(id) {
    const assignmentId =
      normalizeId(id);

    return (
      loadAll().find(
        assignment =>
          assignment.id ===
          assignmentId
      ) ||
      null
    );
  }

  function list(options = {}) {
    const productId =
      normalizeId(options.productId);

    const variantId =
      normalizeId(options.variantId);

    const providerId =
      normalizeId(options.providerId);

    const warehouseId =
      normalizeId(options.warehouseId);

    const includeInactive =
      Boolean(options.includeInactive);

    return loadAll()
      .filter(assignment => {
        if (
          !includeInactive &&
          !assignment.active
        ) {
          return false;
        }

        if (
          productId &&
          assignment.productId !==
            productId
        ) {
          return false;
        }

        if (
          variantId &&
          assignment.variantId !==
            variantId
        ) {
          return false;
        }

        if (
          providerId &&
          assignment.providerId !==
            providerId
        ) {
          return false;
        }

        if (
          warehouseId &&
          assignment.warehouseId !==
            warehouseId
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          Number(b.priority || 0) -
          Number(a.priority || 0)
      );
  }

  function resolveCatalogItem({
    productId = "",
    variantId = "",
    sku = "",
    quantity = 1
  } = {}) {
    const normalizedProductId =
      normalizeId(productId);

    const normalizedVariantId =
      normalizeId(variantId);

    const normalizedSku =
      normalizeText(sku);

    const requestedQuantity =
      Math.max(
        1,
        Number(quantity || 1)
      );

    const candidates =
      loadAll()
        .filter(assignment => {
          if (!assignment.active) {
            return false;
          }

          if (
            normalizedVariantId &&
            assignment.variantId ===
              normalizedVariantId
          ) {
            return true;
          }

          if (
            normalizedProductId &&
            assignment.productId ===
              normalizedProductId
          ) {
            return true;
          }

          if (
            normalizedSku &&
            assignment.sku ===
              normalizedSku
          ) {
            return true;
          }

          return false;
        })
        .filter(assignment => {
          const provider =
            providers?.getById?.(
              assignment.providerId
            );

          const warehouse =
            warehouses?.getById?.(
              assignment.warehouseId
            );

          if (
            !provider ||
            provider.status !== "active"
          ) {
            return false;
          }

          if (
            !warehouse ||
            warehouse.status !== "active" ||
            warehouse.shippingEnabled ===
              false
          ) {
            return false;
          }

          if (
            Number(assignment.stock || 0) >
              0 &&
            Number(assignment.stock) <
              requestedQuantity
          ) {
            return false;
          }

          return true;
        })
        .sort(
          (a, b) =>
            Number(b.priority || 0) -
            Number(a.priority || 0)
        );

    const assignment =
      candidates[0] || null;

    if (!assignment) {
      return {
        success: false,
        reason:
          "NO_LOGISTICS_ASSIGNMENT",
        assignment: null,
        provider: null,
        warehouse: null
      };
    }

    return {
      success: true,
      reason: "RESOLVED",
      assignment,
      provider:
        providers.getById(
          assignment.providerId
        ),
      warehouse:
        warehouses.getById(
          assignment.warehouseId
        )
    };
  }

  function resolveCartLine(line = {}) {
    const merchandise =
      line?.merchandise || {};

    const product =
      merchandise?.product || {};

    return {
      lineId:
        normalizeId(line?.id),

      quantity:
        Math.max(
          1,
          Number(line?.quantity || 1)
        ),

      productId:
        normalizeId(product?.id),

      variantId:
        normalizeId(
          merchandise?.id
        ),

      sku:
        normalizeText(
          merchandise?.sku
        ),

      title:
        normalizeText(
          product?.title ||
          merchandise?.title ||
          "Producto E&D"
        ),

      resolution:
        resolveCatalogItem({
          productId: product?.id,
          variantId: merchandise?.id,
          sku: merchandise?.sku,
          quantity: line?.quantity
        })
    };
  }

  function resolveCartLines(
    lines = []
  ) {
    const source =
      Array.isArray(lines)
        ? lines
        : [];

    const resolved =
      source.map(resolveCartLine);

    const unresolved =
      resolved.filter(
        item =>
          !item.resolution.success
      );

    return {
      success:
        resolved.length > 0 &&
        unresolved.length === 0,

      totalLines:
        resolved.length,

      resolvedLines:
        resolved.length -
        unresolved.length,

      unresolvedLines:
        unresolved.length,

      lines: resolved
    };
  }

  function deactivate(id) {
    return update(id, {
      active: false
    });
  }

  function activate(id) {
    return update(id, {
      active: true
    });
  }

  function remove(id) {
    const assignmentId =
      normalizeId(id);

    const assignments = loadAll();

    const next =
      assignments.filter(
        assignment =>
          assignment.id !==
          assignmentId
      );

    if (
      next.length ===
      assignments.length
    ) {
      return false;
    }

    saveAll(next);
    return true;
  }

  EDCore.logistics.assignments = {
    version: "1.0.0",
    storageName: STORAGE_NAME,
    createId,
    validate,
    normalizeAssignment,
    loadAll,
    saveAll,
    create,
    upsert,
    update,
    getById,
    list,
    resolveCatalogItem,
    resolveCartLine,
    resolveCartLines,
    activate,
    deactivate,
    remove
  };

  console.log(
    "✓ E&D Provider Assignment Engine v1.0.0 cargado"
  );
})();
