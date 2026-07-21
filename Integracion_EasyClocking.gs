const EASY_CLOCKING_CONFIG = {
  API_URL: "https://api.easyclocking.com/v1",

  API_KEY: "API_KEY",
  COMPANY_ID: "COMPANY_ID"
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "No data received" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    const nombreEmpleado = data.EmployeeName || data.employee_name;
    const fechaHoraPunch = new Date(data.PunchTime || data.punch_time);

    const fecha = Utilities.formatDate(fechaHoraPunch, Session.getScriptTimeZone(), "yyyy-MM-dd");
    const hora = Utilities.formatDate(fechaHoraPunch, Session.getScriptTimeZone(), "HH:mm");

    let registrado = registrarLlegadaDesdeAPI(nombreEmpleado, fecha, hora);

    if (registrado) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", message: "Punch registrado" })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "Colaborador o turno no encontrado" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    logError("doPost_EasyClocking", error);
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function sincronizarEasyClocking() {
  if (EASY_CLOCKING_CONFIG.API_KEY === "API_KEY") {
    Logger.log("API Key no configurada aún.");
    return;
  }

  try {
    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const url = `${EASY_CLOCKING_CONFIG.API_URL}/punches?date=${hoy}`;

    const opciones = {
      method: "get",
      headers: {
        Authorization: "Bearer " + EASY_CLOCKING_CONFIG.API_KEY,
        CompanyId: EASY_CLOCKING_CONFIG.COMPANY_ID
      },
      muteHttpExceptions: true
    };

    const respuesta = UrlFetchApp.fetch(url, opciones);
    if (respuesta.getResponseCode() === 200) {
      const data = JSON.parse(respuesta.getContentText());

      if (data && data.punches) {
        data.punches.forEach((punch) => {
          let nombreEmpleado = punch.EmployeeName || punch.employee_name;
          let fechaHoraPunch = new Date(punch.PunchTime || punch.punch_time);
          let fecha = Utilities.formatDate(
            fechaHoraPunch,
            Session.getScriptTimeZone(),
            "yyyy-MM-dd"
          );
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

function registrarLlegadaDesdeAPI(nombre, fechaStr, horaStr) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    const data = ws.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      let rowFecha = data[i][1];
      let rowFechaStr =
        rowFecha instanceof Date
          ? Utilities.formatDate(rowFecha, Session.getScriptTimeZone(), "yyyy-MM-dd")
          : rowFecha.toString().trim().substring(0, 10);
      let rowNombre = data[i][2];

      if (rowNombre.toLowerCase() === nombre.toLowerCase() && rowFechaStr === fechaStr) {
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
