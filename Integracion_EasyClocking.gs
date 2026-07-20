// ==========================================
// INTEGRACIÓN CON EASY CLOCKING (XENIOS)
// ==========================================

// Configuración de la API (Dejar preparado para cuando se obtenga)
const EASY_CLOCKING_CONFIG = {
  API_URL: "https://api.easyclocking.com/v1", // Ejemplo de endpoint
  API_KEY: "AQUI_IRÁ_TU_API_KEY_CUANDO_LA_TENGAS",
  COMPANY_ID: "AQUI_IRÁ_TU_COMPANY_ID"
};

/**
 * METODO 1: WEBHOOK (Receptor Pasivo)
 * Easy Clocking enviará los datos automáticamente a esta función.
 */
function doPost(e) {
  try {
    // Si la petición viene vacía, retornamos error
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Parsear los datos que envía Easy Clocking
    const data = JSON.parse(e.postData.contents);
    
    // Suponiendo la estructura de Easy Clocking
    // Adaptar cuando se tenga la documentación oficial exacta
    const nombreEmpleado = data.EmployeeName || data.employee_name; 
    const fechaHoraPunch = new Date(data.PunchTime || data.punch_time);
    
    const fecha = Utilities.formatDate(fechaHoraPunch, Session.getScriptTimeZone(), "yyyy-MM-dd");
    const hora = Utilities.formatDate(fechaHoraPunch, Session.getScriptTimeZone(), "HH:mm");

    // 2. Registrar la llegada real
    let registrado = registrarLlegadaDesdeAPI(nombreEmpleado, fecha, hora);

    if (registrado) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Punch registrado" })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Colaborador o turno no encontrado" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    logError("doPost_EasyClocking", error);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * METODO 2: FETCH ACTIVO (Receptor Activo - Cron Job)
 * En caso de que Easy Clocking no permita Webhooks, esta función jalará la información cada X minutos.
 */
function sincronizarEasyClocking() {
  if (EASY_CLOCKING_CONFIG.API_KEY === "AQUI_IRÁ_TU_API_KEY_CUANDO_LA_TENGAS") {
    Logger.log("API Key no configurada aún.");
    return;
  }

  try {
    // 1. Preparar la llamada a la API
    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const url = `${EASY_CLOCKING_CONFIG.API_URL}/punches?date=${hoy}`;
    
    const opciones = {
      method: "get",
      headers: {
        "Authorization": "Bearer " + EASY_CLOCKING_CONFIG.API_KEY,
        "CompanyId": EASY_CLOCKING_CONFIG.COMPANY_ID
      },
      muteHttpExceptions: true
    };

    // 2. Hacer la solicitud
    const respuesta = UrlFetchApp.fetch(url, opciones);
    if (respuesta.getResponseCode() === 200) {
      const data = JSON.parse(respuesta.getContentText());
      
      // 3. Procesar e insertar
      if (data && data.punches) {
        data.punches.forEach(punch => {
          let nombreEmpleado = punch.EmployeeName || punch.employee_name;
          let fechaHoraPunch = new Date(punch.PunchTime || punch.punch_time);
          let fecha = Utilities.formatDate(fechaHoraPunch, Session.getScriptTimeZone(), "yyyy-MM-dd");
          let hora = Utilities.formatDate(fechaHoraPunch, Session.getScriptTimeZone(), "HH:mm");
          
          registrarLlegadaDesdeAPI(nombreEmpleado, fecha, hora);
        });
      }
    } else {
      logError("sincronizarEasyClocking API HTTP", respuesta.getContentText());
    }

  } catch (error) {
    logError("sincronizarEasyClocking", error);
  }
}

/**
 * Función central para registrar el punch en Google Sheets
 */
function registrarLlegadaDesdeAPI(nombre, fechaStr, horaStr) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    const data = ws.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      // Normalizamos las fechas para comparar
      let rowFecha = data[i][1];
      let rowFechaStr = (rowFecha instanceof Date) ? Utilities.formatDate(rowFecha, Session.getScriptTimeZone(), "yyyy-MM-dd") : rowFecha.toString().trim().substring(0, 10);
      let rowNombre = data[i][2];
      
      if (rowNombre.toLowerCase() === nombre.toLowerCase() && rowFechaStr === fechaStr) {
        // La columna de llegada real es la 11 (K)
        // Solo sobrescribimos si está vacía (es la primera marcación del día) 
        if (!data[i][10] || data[i][10] === "") {
          ws.getRange(i + 1, 11).setValue("'" + horaStr);
        }
        return true;
      }
    }
    return false;
  } catch (e) {
    logError("registrarLlegadaDesdeAPI", e);
    return false;
  }
}
