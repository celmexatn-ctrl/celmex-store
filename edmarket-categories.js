(function () {
  "use strict";

  function normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function includesAny(text, words) {
    return words.some(word => text.includes(word));
  }

  function categoryForProduct(product = {}) {
    /*
     * El título tiene prioridad porque es el dato más confiable.
     * Evitamos usar vendor y descripción para no mezclar categorías.
     */
    const title = normalize(product.title);
    const productType = normalize(product.productType);
    const tags = normalize((product.tags || []).join(" "));
    const text = `${title} ${productType} ${tags}`;

    /* Tecnología */
    if (
      includesAny(title, [
        "camera",
        "dash cam",
        "video recorder",
        "g-sensor",
        "electronic",
        "smartphone",
        "phone",
        "tablet",
        "headphone",
        "earphone",
        "charger",
        "computer",
        "keyboard",
        "mouse",
        "usb",
        "led"
      ])
    ) {
      return "Tecnología";
    }

    /* Deportes y movilidad */
    if (
      includesAny(title, [
        "electric bike",
        "ebike",
        "e-bike",
        "bicycle",
        "mountain bike",
        "cycling",
        "fitness",
        "gym",
        "running",
        "camping",
        "bicicleta"
      ])
    ) {
      return "Deportes";
    }

    /* Mascotas */
    if (
      includesAny(title, [
        "pet dog",
        "pet cat",
        "dog bed",
        "cat bed",
        "pet bed",
        "pet cooling",
        "dog cooling",
        "cat cooling",
        "pet mat",
        "dog mat",
        "cat mat",
        "pet toy",
        "dog toy",
        "cat toy",
        "mascota",
        "perro",
        "gato"
      ])
    ) {
      return "Mascotas";
    }

    /* Belleza */
    if (
      includesAny(text, [
        "beauty",
        "makeup",
        "cosmetic",
        "skin care",
        "skincare",
        "hair",
        "nail",
        "perfume",
        "belleza",
        "maquillaje"
      ])
    ) {
      return "Belleza";
    }

    /* Moda */
    if (
      includesAny(text, [
        "shirt",
        "dress",
        "shoe",
        "clothing",
        "fashion",
        "jacket",
        "pants",
        "handbag",
        "backpack",
        "watch",
        "moda",
        "ropa"
      ])
    ) {
      return "Moda";
    }

    /* Oficina */
    if (
      includesAny(text, [
        "office",
        "desk",
        "stationery",
        "organizer",
        "papeleria",
        "oficina"
      ])
    ) {
      return "Oficina";
    }

    /* Juguetes */
    if (
      includesAny(text, [
        "toy",
        "kids",
        "children",
        "puzzle",
        "doll",
        "building blocks",
        "juguete"
      ])
    ) {
      return "Juguetes";
    }

    /* Hogar */
    if (
      includesAny(text, [
        "home",
        "kitchen",
        "household",
        "bathroom",
        "storage",
        "decoration",
        "cleaning",
        "garden",
        "pillow",
        "blanket",
        "hogar",
        "cocina"
      ])
    ) {
      return "Hogar";
    }

    /*
     * Usa el tipo de producto de Shopify solamente cuando coincide
     * exactamente con una categoría oficial de E&D Market.
     */
    const officialCategories = {
      tecnologia: "Tecnología",
      deportes: "Deportes",
      mascotas: "Mascotas",
      hogar: "Hogar",
      moda: "Moda",
      belleza: "Belleza",
      oficina: "Oficina",
      juguetes: "Juguetes"
    };

    if (officialCategories[productType]) {
      return officialCategories[productType];
    }

    return "Productos";
  }

  window.EDCategoryForProduct = categoryForProduct;
})();
