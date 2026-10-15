/* ============================================================
   MOCHILA TECH — configuración única para TODAS las páginas
   Edita solo este archivo. Las 3 variaciones lo leen.
   ============================================================ */
window.MT_CONFIG = {
  tienda: "Mochila Tech",

  // 1) URL del Web App de Google Apps Script (ver google-apps-script/README.md)
  //    Mientras esté vacía, los pedidos NO se guardan en el Sheet pero el flujo
  //    igual termina en WhatsApp para que no pierdas ninguna venta.
  scriptUrl: "",

  // 2) WhatsApp de la tienda en formato internacional sin "+" ni espacios.
  //    Ecuador: 593 + número sin el 0 inicial. Ej: 0991234567 -> 593991234567
  whatsapp: "593968637813",   // +593 96 863 7813

  // 3) Producto de esta página
  producto: {
    id: "laptop-hp-estudiantil",
    nombre: "Laptop HP Estudiantil 11.6\"",
    precio: 89.99,
    precioAncla: 150.00,
    stock: 20,                  // unidades reales del lote (se muestra como urgencia honesta)
    entregaDias: "2 a 4 días hábiles",
    // Ofertas por cantidad (como en la referencia). total = lo que paga al recibir.
    ofertas: [
      { cantidad: 1, total: 89.99,  etiqueta: "1 laptop",  nota: "Envío gratis", destacada: true },
      { cantidad: 2, total: 169.98, etiqueta: "2 laptops", nota: "Ahorras $10", destacada: false }
    ]
  },

  // 4) Si quieres que después de enviar el formulario se abra WhatsApp solo
  //    (además del botón). true = redirige a WhatsApp a los 2.5 s.
  autoAbrirWhatsapp: true
};
