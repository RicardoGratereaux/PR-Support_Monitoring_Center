/**
 * Utilidades.gs
 * Funciones utilitarias compartidas entre controladores.
 */

/**
 * Extrae hora numérica de un valor (Date, string HH:MM, número).
 * @param {*} valor
 * @returns {number} Hora como número decimal
 */
function extraerHora(valor) {
  if (!valor) return "";
  if (valor instanceof Date) return Utilities.formatDate(valor, Session.getScriptTimeZone(), "HH:mm");
  let texto = valor.toString().trim();
  if (!texto.includes(":")) return texto;
  return texto.substring(0, 5);
}

/**
 * Genera un ID único con LockService para prevenir race conditions.
 * @param {string} [prefijo='REP'] - Prefijo del ID
 * @param {GoogleAppsScript.Spreadsheet.Sheet} [hojaOp] - Hoja opcional
 * @returns {string} ID generado
 */
function generarIdSeguro(prefijo, hojaOp) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // Wait up to 10 seconds for other processes to finish
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = hojaOp || ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    if (!prefijo) {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      prefijo = `REP-${year}${month}${day}-`;
    }
    
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila <= 1) return prefijo + "0001";
    
    const ultimoID = hoja.getRange(ultimaFila, 1).getValue().toString();
    if (ultimoID.startsWith(prefijo)) {
      const partes = ultimoID.split("-");
      if (partes.length === 3) {
        const ultimoNumero = parseInt(partes[2], 10);
        if (!isNaN(ultimoNumero)) {
          return prefijo + String(ultimoNumero + 1).padStart(4, '0');
        }
      }
    }
    return prefijo + "0001";
  } finally {
    lock.releaseLock();
  }
}

/**
 * Formato de respuesta exitosa.
 */
function respuestaExitosa(datos = {}) {
  return { success: true, ...datos };
}

/**
 * Formato de respuesta con error.
 */
function respuestaError(mensaje, detalles = null) {
  return { success: false, message: mensaje, detalles: detalles };
}

/**
 * Registra y envuelve un error.
 */
function logError(funcion, error) {
  Logger.log(`Error en ${funcion}: ${error.message}`);
}
