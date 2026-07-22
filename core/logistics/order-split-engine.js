(function () {
  "use strict";

  window.EDCore = window.EDCore || {};
  EDCore.logistics = EDCore.logistics || {};

  const assignments =
    EDCore.logistics.assignments;

  const providers =
    EDCore.logistics.providers;

  const warehouses =
    EDCore.logistics.warehouses;

  function normalizeText(value = "") {
    return String(value || "").trim();
  }

  function normalizeNumber(
    value,
    fallback = 0
  ) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function createGroupId(
    providerId,
    warehouseId
  ) {
    return [
      normalizeText(providerId),
      normalizeText(warehouseId)
    ]
      .filter(Boolean)
      .join("::");
  }

  function getMoneyAmount(
    money = {}
  ) {
    return Math.max(
      0,
      normalizeNumber(
        money?.amount,
        0
      )
    );
  }

  function extractLinePrice(line = {}) {
    const cost =
      line?.cost || {};

    const merchandise =
      line?.merchandise || {};

    const quantity = Math.max(
      1,
      normalizeNumber(
        line?.quantity,
        1
      )
    );

    const totalAmount =
      getMoneyAmount(
        cost?.totalAmount
      );

    const amountPerQuantity =
      getMoneyAmount(
        cost?.amountPerQuantity
      );

    const merchandisePrice =
      getMoneyAmount(
        merchandise?.price
      );

    if (totalAmount > 0) {
      return {
        unitAmount:
          totalAmount / quantity,
        lineAmount: totalAmount,
        currencyCode:
          cost?.totalAmount
            ?.currencyCode ||
          "MXN"
      };
    }

    if (amountPerQuantity > 0) {
      return {
        unitAmount:
          amountPerQuantity,
        lineAmount:
          amountPerQuantity *
          quantity,
        currencyCode:
          cost?.amountPerQuantity
            ?.currencyCode ||
          "MXN"
      };
    }

    return {
      unitAmount:
        merchandisePrice,
      lineAmount:
        merchandisePrice *
        quantity,
      currencyCode:
        merchandise?.price
          ?.currencyCode ||
        "MXN"
    };
  }

  function normalizeCartLine(
    line = {},
    index = 0
  ) {
    const merchandise =
      line?.merchandise || {};

    const product =
      merchandise?.product || {};

    const quantity = Math.max(
      1,
      normalizeNumber(
        line?.quantity,
        1
      )
    );

    const money =
      extractLinePrice(line);

    return {
      index,
      lineId:
        normalizeText(line?.id),

      quantity,

      productId:
        normalizeText(product?.id),

      variantId:
        normalizeText(
          merchandise?.id
        ),

      sku:
        normalizeText(
          merchandise?.sku
        ),

      productTitle:
        normalizeText(
          product?.title ||
          merchandise?.title ||
          "Producto E&D Market"
        ),

      variantTitle:
        normalizeText(
          merchandise?.title
        ),

      unitAmount:
        money.unitAmount,

      lineAmount:
        money.lineAmount,

      currencyCode:
        money.currencyCode,

      imageUrl:
        normalizeText(
          merchandise?.image?.url ||
          product?.featuredImage?.url
        ),

      rawLine: line
    };
  }

  function createEmptyGroup(
    resolution = {}
  ) {
    const assignment =
      resolution?.assignment || {};

    const provider =
      resolution?.provider ||
      providers?.getById?.(
        assignment.providerId
      ) ||
      null;

    const warehouse =
      resolution?.warehouse ||
      warehouses?.getById?.(
        assignment.warehouseId
      ) ||
      null;

    const providerId =
      normalizeText(
        provider?.id ||
        assignment.providerId
      );

    const warehouseId =
      normalizeText(
        warehouse?.id ||
        assignment.warehouseId
      );

    return {
      id: createGroupId(
        providerId,
        warehouseId
      ),

      providerId,
      warehouseId,

      provider: provider
        ? { ...provider }
        : null,

      warehouse: warehouse
        ? { ...warehouse }
        : null,

      fulfillmentMode:
        normalizeText(
          assignment
            ?.fulfillmentMode ||
          provider
            ?.fulfillmentMode ||
          "provider_dispatch"
        ),

      preparationDays: Math.max(
        0,
        normalizeNumber(
          warehouse
            ?.preparationDays ??
          provider
            ?.preparationDays,
          0
        )
      ),

      lines: [],
      totalQuantity: 0,
      subtotalAmount: 0,
      currencyCode: "MXN",
      assignmentIds: []
    };
  }

  function addLineToGroup(
    group,
    normalizedLine,
    resolution
  ) {
    group.lines.push({
      ...normalizedLine,
      assignment: {
        ...resolution.assignment
      }
    });

    group.totalQuantity +=
      normalizedLine.quantity;

    group.subtotalAmount +=
      normalizedLine.lineAmount;

    group.currencyCode =
      normalizedLine.currencyCode ||
      group.currencyCode ||
      "MXN";

    const assignmentId =
      normalizeText(
        resolution
          ?.assignment
          ?.id
      );

    if (
      assignmentId &&
      !group.assignmentIds.includes(
        assignmentId
      )
    ) {
      group.assignmentIds.push(
        assignmentId
      );
    }

    return group;
  }

  function resolveLine(
    line = {},
    index = 0
  ) {
    const normalizedLine =
      normalizeCartLine(
        line,
        index
      );

    if (
      !assignments
        ?.resolveCatalogItem
    ) {
      return {
        success: false,
        reason:
          "ASSIGNMENT_ENGINE_UNAVAILABLE",
        line: normalizedLine,
        resolution: null
      };
    }

    const resolution =
      assignments
        .resolveCatalogItem({
          productId:
            normalizedLine.productId,
          variantId:
            normalizedLine.variantId,
          sku:
            normalizedLine.sku,
          quantity:
            normalizedLine.quantity
        });

    return {
      success:
        Boolean(
          resolution?.success
        ),

      reason:
        resolution?.reason ||
        (
          resolution?.success
            ? "RESOLVED"
            : "UNRESOLVED"
        ),

      line: normalizedLine,
      resolution
    };
  }

  function splitLines(
    lines = []
  ) {
    const source =
      Array.isArray(lines)
        ? lines
        : [];

    const groupsMap =
      new Map();

    const resolvedLines = [];
    const unresolvedLines = [];

    source.forEach(
      (line, index) => {
        const result =
          resolveLine(
            line,
            index
          );

        if (
          !result.success ||
          !result.resolution
            ?.assignment ||
          !result.resolution
            ?.provider ||
          !result.resolution
            ?.warehouse
        ) {
          unresolvedLines.push({
            ...result.line,
            reason:
              result.reason ||
              "NO_LOGISTICS_ASSIGNMENT"
          });

          return;
        }

        const groupId =
          createGroupId(
            result
              .resolution
              .provider
              .id,

            result
              .resolution
              .warehouse
              .id
          );

        if (!groupsMap.has(groupId)) {
          groupsMap.set(
            groupId,
            createEmptyGroup(
              result.resolution
            )
          );
        }

        const group =
          groupsMap.get(groupId);

        addLineToGroup(
          group,
          result.line,
          result.resolution
        );

        resolvedLines.push({
          ...result.line,
          groupId,
          providerId:
            result
              .resolution
              .provider
              .id,
          warehouseId:
            result
              .resolution
              .warehouse
              .id,
          assignmentId:
            result
              .resolution
              .assignment
              .id
        });
      }
    );

    const groups =
      Array.from(
        groupsMap.values()
      ).sort((a, b) => {
        const providerA =
          normalizeText(
            a.provider
              ?.businessName
          );

        const providerB =
          normalizeText(
            b.provider
              ?.businessName
          );

        return providerA.localeCompare(
          providerB,
          "es"
        );
      });

    const subtotalAmount =
      groups.reduce(
        (total, group) =>
          total +
          normalizeNumber(
            group.subtotalAmount,
            0
          ),
        0
      );

    const totalQuantity =
      groups.reduce(
        (total, group) =>
          total +
          normalizeNumber(
            group.totalQuantity,
            0
          ),
        0
      );

    const currencies = [
      ...new Set(
        groups
          .map(
            group =>
              group.currencyCode
          )
          .filter(Boolean)
      )
    ];

    return {
      success:
        source.length > 0 &&
        unresolvedLines.length === 0,

      partialSuccess:
        groups.length > 0 &&
        unresolvedLines.length > 0,

      empty:
        source.length === 0,

      totalLines:
        source.length,

      resolvedLineCount:
        resolvedLines.length,

      unresolvedLineCount:
        unresolvedLines.length,

      groupCount:
        groups.length,

      totalQuantity,
      subtotalAmount,

      currencyCode:
        currencies.length === 1
          ? currencies[0]
          : "MXN",

      mixedCurrencies:
        currencies.length > 1,

      groups,
      resolvedLines,
      unresolvedLines,

      createdAt:
        new Date().toISOString()
    };
  }

  function getCartLines(
    cart = {}
  ) {
    if (
      Array.isArray(
        cart?.lines?.nodes
      )
    ) {
      return cart.lines.nodes;
    }

    if (
      Array.isArray(cart?.lines)
    ) {
      return cart.lines;
    }

    if (
      Array.isArray(
        cart?.items
      )
    ) {
      return cart.items;
    }

    return [];
  }

  function splitCart(
    cart = {}
  ) {
    const lines =
      getCartLines(cart);

    const result =
      splitLines(lines);

    return {
      ...result,

      cartId:
        normalizeText(cart?.id),

      checkoutUrl:
        normalizeText(
          cart?.checkoutUrl
        ),

      cartTotalQuantity:
        Math.max(
          0,
          normalizeNumber(
            cart?.totalQuantity,
            result.totalQuantity
          )
        ),

      cartSubtotalAmount:
        getMoneyAmount(
          cart?.cost
            ?.subtotalAmount
        ),

      cartCurrencyCode:
        cart?.cost
          ?.subtotalAmount
          ?.currencyCode ||
        result.currencyCode ||
        "MXN"
    };
  }

  function buildProviderOrders(
    splitResult = {}
  ) {
    const groups =
      Array.isArray(
        splitResult?.groups
      )
        ? splitResult.groups
        : [];

    return groups.map(
      (group, index) => ({
        internalOrderId: [
          "ED-SHIPMENT",
          Date.now(),
          index + 1
        ].join("-"),

        parentCartId:
          normalizeText(
            splitResult.cartId
          ),

        groupId:
          group.id,

        providerId:
          group.providerId,

        warehouseId:
          group.warehouseId,

        provider:
          group.provider
            ? { ...group.provider }
            : null,

        warehouse:
          group.warehouse
            ? { ...group.warehouse }
            : null,

        fulfillmentMode:
          group.fulfillmentMode,

        preparationDays:
          group.preparationDays,

        status:
          "pending_logistics",

        statusLabel:
          "Pendiente de logística",

        lines:
          group.lines.map(
            line => ({ ...line })
          ),

        totalQuantity:
          group.totalQuantity,

        subtotalAmount:
          group.subtotalAmount,

        currencyCode:
          group.currencyCode,

        shipping: {
          status:
            "not_quoted",
          quoteId: "",
          carrier: "",
          service: "",
          amount: 0,
          currencyCode:
            group.currencyCode,
          estimatedDays: null,
          labelUrl: "",
          trackingNumber: "",
          trackingUrl: ""
        },

        createdAt:
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString()
      })
    );
  }

  function validateSplit(
    splitResult = {}
  ) {
    const errors = [];
    const warnings = [];

    if (splitResult.empty) {
      errors.push(
        "El carrito no contiene productos."
      );
    }

    if (
      splitResult
        .unresolvedLineCount > 0
    ) {
      errors.push(
        `${splitResult.unresolvedLineCount} línea(s) no tienen proveedor y centro logístico asignados.`
      );
    }

    if (
      splitResult.mixedCurrencies
    ) {
      errors.push(
        "El carrito contiene más de una moneda."
      );
    }

    const groups =
      Array.isArray(
        splitResult.groups
      )
        ? splitResult.groups
        : [];

    groups.forEach(group => {
      if (!group.providerId) {
        errors.push(
          `El grupo ${group.id} no tiene proveedor.`
        );
      }

      if (!group.warehouseId) {
        errors.push(
          `El grupo ${group.id} no tiene centro logístico.`
        );
      }

      if (
        !group.warehouse
          ?.postalCode
      ) {
        warnings.push(
          `El centro ${group.warehouse?.name || group.warehouseId} no tiene código postal de origen.`
        );
      }

      if (
        group.warehouse
          ?.shippingEnabled === false
      ) {
        errors.push(
          `El centro ${group.warehouse?.name || group.warehouseId} no permite envíos.`
        );
      }
    });

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  EDCore.logistics.orderSplit = {
    version: "1.0.0",
    createGroupId,
    normalizeCartLine,
    resolveLine,
    splitLines,
    splitCart,
    getCartLines,
    buildProviderOrders,
    validateSplit
  };

  console.log(
    "✓ E&D Order Split Engine v1.0.0 cargado"
  );
})();
