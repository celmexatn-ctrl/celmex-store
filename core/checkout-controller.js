(() => {
  "use strict";

  window.EDCore = window.EDCore || {};

  const Controller = {

    version: "1.1.0",

    state: {
      subtotal: 0,
      discount: 0,
      cashback: 0,
      total: 0,
      coupon: null,
      rewards: [],
      benefits: []
    },

    setSubtotal(amount = 0) {
      this.state.subtotal = Number(amount) || 0;
      return this.calculateTotals();
    },

    applyCoupon(code = "") {
      const coupons = window.EDCore?.coupons;

      if (!coupons?.validate) {
        this.state.coupon = null;
        this.state.discount = 0;

        return {
          ...this.calculateTotals(),
          valid: false,
          message: "El motor de cupones no está disponible."
        };
      }

      const result = coupons.validate(
        code,
        this.state.subtotal
      );

      this.state.coupon = result.coupon;
      this.state.discount = result.discount;

      return {
        ...this.calculateTotals(),
        valid: result.valid,
        code: result.code,
        message: result.message
      };
    },

    setCashback(amount = 0) {
      this.state.cashback = Number(amount) || 0;
      return this.calculateTotals();
    },

    calculateTotals() {

      const subtotal = Number(this.state.subtotal) || 0;

      const discount =
        Number(this.state.coupon?.discount ?? this.state.discount) || 0;

      const cashback = Number(this.state.cashback) || 0;

      const total = Math.max(0, subtotal - discount);

      this.state.discount = discount;
      this.state.total = total;

      return { ...this.state };
    }

  };

  EDCore.checkoutController = Controller;

  console.log("✓ EDCore Checkout Controller v1.1 cargado");

})();
