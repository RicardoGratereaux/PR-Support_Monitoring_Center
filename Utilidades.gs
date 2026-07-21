function extraerHora(valor) {
  if (!valor) return "";
  if (valor instanceof Date)
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "HH:mm");
  let texto = valor.toString().trim();
  if (!texto.includes(":")) return texto;
  return texto.substring(0, 5);
}

function generarIdSeguro(prefijo, hojaOp) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = hojaOp || ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    if (!prefijo) {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, "0");
      const day = String(hoy.getDate()).padStart(2, "0");
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
          return prefijo + String(ultimoNumero + 1).padStart(4, "0");
        }
      }
    }
    return prefijo + "0001";
  } finally {
    lock.releaseLock();
  }
}

function respuestaExitosa(datos = {}) {
  return { success: true, ...datos };
}

function respuestaError(mensaje, detalles = null) {
  return { success: false, message: mensaje, detalles: detalles };
}

function logError(funcion, error) {
  Logger.log(`Error en ${funcion}: ${error.message}`);
}
