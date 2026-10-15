/**
 * MOCHILA TECH — Recibe pedidos de la página y los guarda en Google Sheets.
 *
 * INSTALACIÓN (5 minutos):
 * 1. Crea un Google Sheet nuevo llamado "Pedidos Mochila Tech".
 * 2. Extensiones → Apps Script. Borra todo y pega este archivo.
 * 3. (Opcional) Cambia EMAIL_AVISO por tu correo para recibir un aviso por cada pedido.
 * 4. Implementar → Nueva implementación → Tipo: "Aplicación web"
 *      Ejecutar como: Yo
 *      Quién tiene acceso: CUALQUIER USUARIO  (no "cualquier usuario con cuenta de Google")
 *    → Implementar → Autorizar → copia la URL que termina en /exec
 * 5. Pega esa URL en assets/js/config.js → scriptUrl
 *
 * IMPORTANTE: cada vez que cambies este código: Implementar → Gestionar implementaciones
 * → lápiz → Versión: Nueva → Implementar. Si no, sigue corriendo el código viejo.
 */

var SHEET_NAME = "Pedidos";
var EMAIL_AVISO = "";            // ej. "ventas@mochilatech.ec" (vacío = sin aviso)
var CODIGO_PAIS = "593";         // Ecuador

var COLUMNAS = ["Fecha", "Nombre", "WhatsApp", "Cédula", "Provincia", "Ciudad", "Dirección",
  "Referencia", "Producto", "Cantidad", "Total", "Origen", "Página", "Estado", "Link WhatsApp"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(COLUMNAS);
      sheet.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var d = e.parameter || {};
    if (e.postData && e.postData.type === "text/plain" && e.postData.contents) {
      try { d = JSON.parse(e.postData.contents); } catch (err) {}
    }
    if (d.empresa) return ok(); // honeypot anti-bots

    var tel = String(d.telefono || "").replace(/\D/g, "");
    var waNum = tel.charAt(0) === "0" ? CODIGO_PAIS + tel.slice(1) : CODIGO_PAIS + tel;
    var waMsg = encodeURIComponent(
      "Hola " + (d.nombre || "").split(" ")[0] + ", te escribimos de Mochila Tech 👋 " +
      "Recibimos tu pedido de " + (d.cantidad || 1) + " × " + (d.producto || "") +
      " por $" + (d.total || "") + ", pago al recibir. " +
      "Lo enviamos a: " + (d.direccion || "") + (d.referencia ? " (" + d.referencia + ")" : "") +
      ", " + (d.ciudad || "") + ", " + (d.provincia || "") + ". ¿Confirmas que todo está correcto? ✅"
    );
    var waLink = "https://wa.me/" + waNum + "?text=" + waMsg;

    sheet.appendRow([
      new Date(), d.nombre || "", "'" + tel, d.cedula || "", d.provincia || "", d.ciudad || "",
      d.direccion || "", d.referencia || "", d.producto || "", Number(d.cantidad || 1),
      Number(d.total || 0), d.origen || "", d.pagina || "", "Pendiente confirmar", waLink
    ]);

    // Menú desplegable en la columna Estado (solo la fila nueva)
    var row = sheet.getLastRow();
    var estados = ["Pendiente confirmar", "Confirmado", "Despachado", "Entregado", "Rechazado", "No contesta"];
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(estados, true).build();
    sheet.getRange(row, 14).setDataValidation(rule);

    if (EMAIL_AVISO) {
      MailApp.sendEmail(EMAIL_AVISO, "🛒 Nuevo pedido: " + d.nombre + " — " + d.ciudad,
        "Producto: " + d.producto + " x" + d.cantidad + "\nTotal: $" + d.total +
        "\nWhatsApp: " + tel + "\nDirección: " + d.direccion + ", " + d.ciudad + ", " + d.provincia +
        "\n\nConfirmar por WhatsApp: " + waLink);
    }
    return ok();
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function ok() {
  return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Para probar la URL en el navegador: debe decir "Mochila Tech OK"
function doGet() {
  return ContentService.createTextOutput("Mochila Tech OK");
}
