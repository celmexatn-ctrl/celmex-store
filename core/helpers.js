window.EDCore = window.EDCore || {};

EDCore.version = "1.0.0";

EDCore.money = function(amount, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency
  }).format(Number(amount || 0));
};

console.log("✓ EDCore Helpers cargado");
