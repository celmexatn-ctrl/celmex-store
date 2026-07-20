(function () {
  "use strict";

  window.EDCore = window.EDCore || {};

  const STORAGE_KEY = "edmarket-active-coupon-v1";

  const catalog = {
    BIENVENIDO10: {
      code: "BIENVENIDO10",
      type: "percent",
      value: 10,
      label: "10% de descuento",
      message: "Cupón de bienvenida aplicado."
    },

    SOCIO5: {
      code: "SOCIO5",
      type: "percent",
      value: 5,
      label: "5% de descuento",
      message: "Beneficio de socio aplicado."
    },

    EDMARKET: {
      code: "EDMARKET",
      type: "message",
      value: 0,
      label: "Beneficio E&D Market",
      message: "¡Gracias por comprar en E&D Market!"
    }
  };

  function normalizeCode(code = "") {
    return String(code)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function find(code) {
    const normalizedCode = normalizeCode(code);
    return catalog[normalizedCode] || null;
  }

  function calculateDiscount(subtotal, couponOrCode) {
    const amount = Math.max(0, Number(subtotal || 0));

    const coupon =
      typeof couponOrCode === "string"
        ? find(couponOrCode)
        : couponOrCode;

    if (!coupon || coupon.type !== "percent") {
      return 0;
    }

    const percentage = Math.max(
      0,
      Math.min(100, Number(coupon.value || 0))
    );

    return Number(
      ((amount * percentage) / 100).toFixed(2)
    );
  }

  function calculateTotal(subtotal, couponOrCode) {
    const amount = Math.max(0, Number(subtotal || 0));
    const discount = calculateDiscount(
      amount,
      couponOrCode
    );

    return Number(
      Math.max(0, amount - discount).toFixed(2)
    );
  }

  function validate(code, subtotal = 0) {
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) {
      return {
        valid: false,
        code: "",
        coupon: null,
        discount: 0,
        total: Math.max(0, Number(subtotal || 0)),
        message: "Escribe un código de cupón."
      };
    }

    const coupon = find(normalizedCode);

    if (!coupon) {
      return {
        valid: false,
        code: normalizedCode,
        coupon: null,
        discount: 0,
        total: Math.max(0, Number(subtotal || 0)),
        message:
          "El cupón no existe o no está disponible."
      };
    }

    const discount = calculateDiscount(
      subtotal,
      coupon
    );

    return {
      valid: true,
      code: normalizedCode,
      coupon,
      discount,
      total: calculateTotal(subtotal, coupon),
      message: coupon.message
    };
  }

  function save(code) {
    const coupon = find(code);

    if (!coupon) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    localStorage.setItem(
      STORAGE_KEY,
      coupon.code
    );

    return coupon;
  }

  function load() {
    const savedCode =
      localStorage.getItem(STORAGE_KEY) || "";

    return find(savedCode);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  EDCore.coupons = {
    catalog,
    normalizeCode,
    find,
    validate,
    calculateDiscount,
    calculateTotal,
    save,
    load,
    clear
  };

  console.log("✓ Motor de cupones E&D cargado");
})();
