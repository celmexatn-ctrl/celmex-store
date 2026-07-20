const {setGlobalOptions} = require("firebase-functions/v2");
const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

initializeApp();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 2,
});

exports.cjWebhook = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
    return;
  }

  try {
    const payload = request.body || {};

    await getFirestore().collection("cjWebhookEvents").add({
      receivedAt: FieldValue.serverTimestamp(),
      payload,
    });

    logger.info("Webhook de CJ recibido", {
      structuredData: true,
    });

    response.status(200).json({
      success: true,
      message: "Webhook recibido por CelMex",
    });
  } catch (error) {
    logger.error("Error procesando webhook de CJ", error);

    response.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
});
