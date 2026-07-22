(function () {
  "use strict";

  window.EDCore = window.EDCore || {};
  EDCore.logistics = EDCore.logistics || {};

  const PREFIX = "edmarket-logistics";

  function buildKey(name) {
    return `${PREFIX}-${String(name || "").trim()}-v1`;
  }

  function read(name, fallback = null) {
    try {
      const raw = localStorage.getItem(
        buildKey(name)
      );

      if (!raw) {
        return fallback;
      }

      return JSON.parse(raw);
    } catch (error) {
      console.warn(
        "E&D Logistics Storage: no se pudo leer",
        name,
        error
      );

      return fallback;
    }
  }

  function write(name, value) {
    try {
      localStorage.setItem(
        buildKey(name),
        JSON.stringify(value)
      );

      return value;
    } catch (error) {
      console.error(
        "E&D Logistics Storage: no se pudo guardar",
        name,
        error
      );

      throw error;
    }
  }

  function remove(name) {
    localStorage.removeItem(
      buildKey(name)
    );

    return true;
  }

  function clearAll() {
    const keys = [];

    for (
      let index = 0;
      index < localStorage.length;
      index += 1
    ) {
      const key = localStorage.key(index);

      if (key?.startsWith(`${PREFIX}-`)) {
        keys.push(key);
      }
    }

    keys.forEach(key =>
      localStorage.removeItem(key)
    );

    return keys.length;
  }

  EDCore.logistics.storage = {
    version: "1.0.0",
    prefix: PREFIX,
    buildKey,
    read,
    write,
    remove,
    clearAll
  };

  console.log(
    "✓ E&D Logistics Storage v1.0.0 cargado"
  );
})();
