const json = (data, status = 200, origin = "*") =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store"
    }
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        success: true,
        service: "E&D Shipping Engine",
        version: "0.1.0",
        environment: env.ENVIA_API_BASE_URL || "not-configured",
        tokenConfigured: Boolean(env.ENVIA_API_TOKEN),
        status: "online"
      }, 200, origin);
    }

    if (url.pathname === "/quote" && request.method === "POST") {
      if (!env.ENVIA_API_TOKEN) {
        return json({
          success: false,
          error: "ENVIA_API_TOKEN no está configurado"
        }, 500, origin);
      }

      let payload;

      try {
        payload = await request.json();
      } catch {
        return json({
          success: false,
          error: "El cuerpo debe ser JSON válido"
        }, 400, origin);
      }

      const required = ["origin", "destination", "packages", "shipment"];
      const missing = required.filter((field) => !payload?.[field]);

      if (missing.length > 0) {
        return json({
          success: false,
          error: "Faltan campos obligatorios",
          missing
        }, 400, origin);
      }

      const baseUrl =
        (env.ENVIA_API_BASE_URL || "https://api-test.envia.com")
          .replace(/\/+$/, "");

      try {
        const enviaResponse = await fetch(`${baseUrl}/ship/rate/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.ENVIA_API_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const rawText = await enviaResponse.text();

        let enviaData;
        try {
          enviaData = JSON.parse(rawText);
        } catch {
          enviaData = { raw: rawText };
        }

        return json({
          success: enviaResponse.ok,
          provider: "envia.com",
          status: enviaResponse.status,
          data: enviaData
        }, enviaResponse.ok ? 200 : enviaResponse.status, origin);
      } catch (error) {
        return json({
          success: false,
          error: "No se pudo conectar con Envia.com",
          detail: error instanceof Error ? error.message : String(error)
        }, 502, origin);
      }
    }

    return json({
      success: false,
      error: "Ruta no encontrada",
      routes: [
        "GET /health",
        "POST /quote"
      ]
    }, 404, origin);
  }
};
