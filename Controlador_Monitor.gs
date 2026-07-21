function getMisReportes() {
  const emailUsuario = obtenerEmailUsuario();
  const cache = CacheService.getScriptCache();

  const cacheKey = "mis_reportes_" + emailUsuario;

  const datosCache = cache.get(cacheKey);
  if (datosCache !== null) {
    Logger.log("Velocidad Turbo Monitor: Historial recuperado desde caché privada.");
    return datosCache;
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    if (!hoja) return JSON.stringify([]);

    const data = hoja.getDataRange().getValues();
    let misReportes = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const creadorReporte = (row[13] || "").toString().toLowerCase();

      if (creadorReporte === emailUsuario) {
        misReportes.push({
          id: row[0],
          fecha: row[1]
            ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "dd/MM/yyyy")
            : "",
          empresa: row[2],
          tienda: row[3],
          posicion: row[4],
          tipoReporte: row[5],
          empleado: row[6],
          iniciales: row[7],
          observacionesMonitor: row[8],
          estado: row[9] || "Pendiente",
          carpeta: row[10] || "#",
          observacionSupervisor: row[11] || ""
        });
      }
    }

    const resultadoJson = JSON.stringify(misReportes.reverse());

    cache.put(cacheKey, resultadoJson, 600);
    Logger.log("Caché privada generada con éxito para: " + emailUsuario);

    return resultadoJson;
  } catch (error) {
    logError("getMisReportes", error);
    return JSON.stringify([]);
  }
}

function corregirReporteMonitor(idReporte, datos, files, archivosAEliminar) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    const data = hoja.getDataRange().getValues();
    const miCorreo = obtenerEmailUsuario();
    const zona = Session.getScriptTimeZone();
    const fecha = Utilities.formatDate(new Date(), zona, "M/d/yyyy HH:mm:ss");

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idReporte && (data[i][13] || "").toString().toLowerCase() === miCorreo) {
        hoja.getRange(i + 1, 3).setValue(datos.empresa);

        hoja.getRange(i + 1, 4).setValue(datos.tienda);

        hoja.getRange(i + 1, 5).setValue(datos.posicion);

        hoja.getRange(i + 1, 6).setValue(datos.tipoReporte);

        hoja.getRange(i + 1, 7).setValue(datos.empleado);

        hoja.getRange(i + 1, 8).setValue(datos.iniciales);

        hoja.getRange(i + 1, 9).setValue(datos.observaciones);

        hoja.getRange(i + 1, 10).setValue("Pendiente");

        hoja.getRange(i + 1, 12).setValue("");

        const logActual = data[i][12] || "";
        const logMensaje = `[${fecha}] Corregido y reenviado por el Monitor`;
        hoja.getRange(i + 1, 13).setValue(logActual + "\n" + logMensaje);

        if (archivosAEliminar && archivosAEliminar.length > 0) {
          archivosAEliminar.forEach((fileId) => {
            try {
              DriveApp.getFileById(fileId).setTrashed(true);
            } catch (e) {}
          });
        }

        if (files && files.length > 0) {
          const urlCarpeta = data[i][10];
          if (urlCarpeta && urlCarpeta.includes("drive.google.com/drive/folders/")) {
            try {
              const idCarpeta = urlCarpeta.split("folders/")[1].split("?")[0];
              const carpeta = DriveApp.getFolderById(idCarpeta);

              files.forEach((f) => {
                if (f && f.data) {
                  const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type, f.name);
                  carpeta.createFile(blob);
                }
              });
            } catch (e) {
              Logger.log("Aviso en actualización de archivos: " + e.message);
            }
          }
        }

        const correoMonitorActivo = obtenerEmailUsuario();
        CacheService.getScriptCache().remove("mis_reportes_" + correoMonitorActivo);
        CacheService.getScriptCache().remove("lista_reportes_global");
        Logger.log("Cachés de reportes invalidadas correctamente tras actualización.");
        return { success: true, message: "Reporte actualizado y enviado a revisión." };
      }
    }
    throw new Error("No tienes permiso o el reporte no existe.");
  } catch (error) {
    logError("corregirReporteMonitor", error);
    return respuestaError(error.message);
  }
}

function agregarObservacionMonitor(idReporte, observacion) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    const data = hoja.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idReporte) {
        verificarAutoria(data[i][13]);

        hoja.getRange(i + 1, 8).setValue(observacion);

        const correoMonitorActivo = obtenerEmailUsuario();
        CacheService.getScriptCache().remove("mis_reportes_" + correoMonitorActivo);
        CacheService.getScriptCache().remove("lista_reportes_global");
        Logger.log("Cachés de reportes invalidadas correctamente tras actualización.");
        return respuestaExitosa({ message: "Observación de monitor guardada" });
      }
    }
    throw new Error("No se encontró el ID del reporte.");
  } catch (error) {
    logError("agregarObservacionMonitor", error);
    return respuestaError(error.message);
  }
}
