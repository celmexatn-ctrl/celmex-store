window.EDCore = window.EDCore || {};

EDCore.storage = {

  get(key, fallback = null) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

};

console.log("✓ EDCore Storage cargado");
