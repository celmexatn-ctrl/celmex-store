#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function money(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

function percentOf(value, percent) {
  return Number(value) *
    (Number(percent || 0) / 100);
}

function convertToMxn(product, config) {
  const currency =
    String(
      product.supplierCurrency || "MXN"
    ).toUpperCase();

  const supplierTotal =
    (
      Number(product.productCost || 0) +
      Number(product.shippingCost || 0)
    ) *
    Number(product.quantity || 1);

  if (currency === "MXN") {
    return supplierTotal;
  }

  if (currency !== "USD") {
    throw new Error(
      `Moneda no compatible todavía: ${currency}`
    );
  }

  const rate =
    Number(
      config.exchangeRate?.USD_MXN || 0
    );

  if (rate <= 0) {
    throw new Error(
      "El tipo de cambio USD/MXN no es válido."
    );
  }

  const converted = supplierTotal * rate;

  return converted +
    percentOf(
      converted,
      config.exchangeRate
        ?.bufferPercent || 0
    );
}

function selectProfitRule(
  totalCost,
  config
) {
  const rules =
    config.profitRules || [];

  return rules.find(rule =>
    rule.maxTotalCost === null ||
    totalCost <=
      Number(rule.maxTotalCost)
  );
}

function calculateProfit(
  totalCost,
  config
) {
  const rule =
    selectProfitRule(
      totalCost,
      config
    );

  if (!rule) {
    throw new Error(
      "No existe una regla de utilidad aplicable."
    );
  }

  const fixed =
    Number(rule.fixedProfit || 0);

  const percentage =
    percentOf(
      totalCost,
      rule.minimumMarginPercent || 0
    );

  const globalMinimum =
    Number(
      config.safety
        ?.minimumProfit || 0
    );

  return Math.max(
    fixed,
    percentage,
    globalMinimum
  );
}

function nextCommercialPrice(
  value,
  config
) {
  const strategy =
    config.rounding
      ?.strategy || "none";

  if (strategy === "none") {
    return money(value);
  }

  if (strategy === "next-nine") {
    const increment =
      Number(
        config.rounding
          ?.minimumIncrement || 10
      );

    const rounded =
      Math.ceil(value / increment) *
      increment;

    return money(
      Math.max(9, rounded - 1)
    );
  }

  return money(value);
}

function calculateForMethod({
  baseCost,
  profit,
  method,
  methodName,
  config
}) {
  const paymentPercent =
    Number(method.percentFee || 0);

  const serviceTax =
    Number(
      method.serviceTaxPercent || 0
    );

  const paymentPercentWithTax =
    paymentPercent *
    (1 + serviceTax / 100);

  const shopifyPercent =
    Number(
      config.shopify
        ?.externalTransactionPercent || 0
    );

  const reservePercent =
    Number(
      config.costRules
        ?.returnsReservePercent || 0
    );

  const totalPercent =
    paymentPercentWithTax +
    shopifyPercent +
    reservePercent;

  if (totalPercent >= 100) {
    throw new Error(
      `Porcentajes inválidos para ${methodName}.`
    );
  }

  const fixedFees =
    Number(method.fixedFee || 0) +
    Number(
      config.costRules
        ?.shippingBuffer || 0
    );

  const preFeeAmount =
    baseCost +
    profit +
    fixedFees;

  const rawPrice =
    preFeeAmount /
    (1 - totalPercent / 100);

  const finalPrice =
    nextCommercialPrice(
      rawPrice,
      config
    );

  const estimatedFees =
    finalPrice *
      (
        paymentPercentWithTax +
        shopifyPercent
      ) /
      100 +
    Number(method.fixedFee || 0);

  const reserve =
    percentOf(
      finalPrice,
      reservePercent
    );

  const netProfit =
    finalPrice -
    baseCost -
    estimatedFees -
    reserve;

  return {
    method: methodName,
    finalPrice: money(finalPrice),
    supplierAndShippingCost:
      money(baseCost),
    estimatedProcessingFees:
      money(estimatedFees),
    riskReserve: money(reserve),
    projectedNetProfit:
      money(netProfit),
    configuredProfitTarget:
      money(profit),
    totalPercentageApplied:
      money(totalPercent)
  };
}

function calculate(product, config) {
  const convertedCost =
    convertToMxn(
      product,
      config
    );

  const importBuffer =
    percentOf(
      convertedCost,
      config.costRules
        ?.importBufferPercent || 0
    );

  const baseCost =
    convertedCost +
    importBuffer;

  const profit =
    calculateProfit(
      baseCost,
      config
    );

  const methods =
    Object.entries(
      config.paymentMethods || {}
    );

  const enabled =
    methods.filter(
      ([, method]) =>
        method.enabled === true
    );

  if (!enabled.length) {
    return {
      warning:
        "No hay pasarelas activadas. Configura sus tarifas reales antes de publicar.",
      product: {
        sku: product.sku,
        name: product.name
      },
      baseCostMXN: money(baseCost),
      suggestedProfit: money(profit),
      minimumNoFeePrice:
        nextCommercialPrice(
          baseCost + profit,
          config
        ),
      automaticPublishing:
        false,
      results: []
    };
  }

  const results =
    enabled.map(
      ([name, method]) =>
        calculateForMethod({
          baseCost,
          profit,
          method,
          methodName: name,
          config
        })
    );

  const conservativePrice =
    Math.max(
      ...results.map(
        result =>
          result.finalPrice
      )
    );

  return {
    product: {
      sku: product.sku,
      name: product.name
    },
    baseCostMXN: money(baseCost),
    suggestedProfit: money(profit),
    conservativePrice:
      money(conservativePrice),
    automaticPublishing:
      Boolean(
        config.safety
          ?.automaticPublishing
      ),
    results
  };
}

function main() {
  const root = __dirname;

  const configPath =
    process.argv[2] ||
    path.join(root, "config.json");

  const productPath =
    process.argv[3] ||
    path.join(
      root,
      "sample-product.json"
    );

  const config =
    readJson(configPath);

  const product =
    readJson(productPath);

  if (config.mode !== "simulation") {
    throw new Error(
      "Esta versión solo permite modo simulation."
    );
  }

  const result =
    calculate(
      product,
      config
    );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );
}

try {
  main();
} catch (error) {
  console.error(
    "ERROR PRICING ENGINE:",
    error.message
  );

  process.exit(1);
}
