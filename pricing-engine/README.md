# E&D Pricing Engine v0.1

Estado actual: simulador local.

## Incluye

- Conversión USD a MXN.
- Colchón de tipo de cambio.
- Costo del producto y envío.
- Reserva para devoluciones.
- Utilidad fija o porcentaje mínimo.
- Comparación entre pasarelas.
- Tarifa externa de Shopify configurable.
- Redondeo comercial.
- Publicación automática desactivada.

## No incluye todavía

- Conexión real con CJdropshipping.
- Consulta automática del tipo de cambio.
- Credenciales de Shopify.
- Publicación de productos.
- Tarifas reales de las pasarelas.
- Impuestos aduanales automáticos.

## Ejecutar prueba

node pricing-engine/engine.js

Las tarifas incluidas inicialmente están en cero.
Deben configurarse únicamente con los costos reales
del contrato y cuenta de E&D Market.
