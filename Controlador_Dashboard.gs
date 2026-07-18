function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    const data = hoja.getDataRange().getValues();
    const zona = Session.getScriptTimeZone();
    
    let total = 0;
    let reportesHoy = 0;
    let pendientes = 0;
    let aprobados = 0;
    let rechazados = 0;
    let incidencias = 0;
    
    const porTienda = {};
    const porEmpleado = {};
    const porOperacion = {};
    const porTipo = {};
    
    const hoyStr = Utilities.formatDate(new Date(), zona, 'M/d/yyyy');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      total++;
      
      const fechaRow = row[1];
      const operacionRaw = row[2] ? row[2].toString().trim() : "General";
      const operacion = operacionRaw.charAt(0).toUpperCase() + operacionRaw.slice(1);
      const tienda = row[3] ? row[3].toString().trim() : "Desconocida";
      const tipo = row[5] ? row[5].toString().trim() : "No Especificado";
      const empleado = row[6] ? row[6].toString().trim() : "Sin Nombre";
      const estado = row[9] ? row[9].toString().trim() : "Pendiente";
            
      if (fechaRow && Utilities.formatDate(new Date(fechaRow), zona, 'M/d/yyyy') === hoyStr) {
        reportesHoy++;
      }
      
      const estLower = estado.toLowerCase();
      if (estLower.includes("pendiente")) pendientes++;
      else if (estLower.includes("aprobado")) aprobados++;
      else if (estLower.includes("rechazado")) rechazados++;
      
      if (tipo && tipo !== "No Especificado") incidencias++;
      
      porTienda[tienda] = (porTienda[tienda] || 0) + 1;
      porEmpleado[empleado] = (porEmpleado[empleado] || 0) + 1;
      porOperacion[operacion] = (porOperacion[operacion] || 0) + 1;
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    }
    
    return {
      total: total,
      reportesHoy: reportesHoy,
      pendientes: pendientes,
      aprobados: aprobados,
      rechazados: rechazados,
      incidencias: incidencias,
      porTienda: porTienda,
      porEmpleado: porEmpleado,
      porOperacion: porOperacion,
      porTipo: porTipo
    };
  } catch(e) {
    logError("getDashboardData", e);
    return {};
  }
}

function agregarObservacionSupervisor(idReporte, observacion) {
  try {
    verificarSupervisor("agregarObservacionSupervisor");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    const data = hoja.getDataRange().getValues();
    
    const usuario = obtenerEmailUsuario() || "Usuario Desconocido";
    const zona = Session.getScriptTimeZone();
    const fecha = Utilities.formatDate(new Date(), zona, 'M/d/yyyy HH:mm:ss');
    const logMensaje = `[${fecha}]  Obs. Editada por: ${usuario}`;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idReporte) {
        hoja.getRange(i + 1, 12).setValue(observacion);
        
        const logActual = data[i][12] || "";
        const nuevoLog = logActual ? logActual + "\n" + logMensaje : logMensaje;
        
        hoja.getRange(i + 1, 13).setValue(nuevoLog);
        
        return respuestaExitosa({ message: "Observación guardada con registro de auditoría" });
      }
    }
    throw new Error("No se encontró el ID del reporte.");
  } catch (error) {
    logError("agregarObservacionSupervisor", error);
    return respuestaError(error.message);
  }
}

function borrarReporte(idReporte) {
  try {
    verificarSupervisor("borrarReporte");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    const data = hoja.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idReporte) {
        
        // 1. Intentar borrar la carpeta de Drive si existe (Columna K es índice 10)
        const urlCarpeta = data[i][10];
        if (urlCarpeta && urlCarpeta.includes("drive.google.com/drive/folders/")) {
           try {
             // Extraemos el ID de la carpeta de la URL para poder borrarla
             const idCarpeta = urlCarpeta.split("folders/")[1].split("?")[0];
             DriveApp.getFolderById(idCarpeta).setTrashed(true);
           } catch(e) {
             Logger.log("Aviso: No se pudo mover la carpeta a la papelera -> " + e.message);
           }
        }

        // 2. Borrar la fila de Google Sheets (i + 1 porque Sheets no usa índice 0)
        hoja.deleteRow(i + 1); 
        
        return respuestaExitosa({ message: "Reporte y evidencias eliminados" });
      }
    }
    throw new Error("No se encontró el ID del reporte en la base de datos.");
  } catch (error) {
    logError("borrarReporte", error);
    return respuestaError(error.message);
  }
}

function obtenerArchivosDrive(urlCarpeta) {
  try {
    if (!urlCarpeta || !urlCarpeta.includes("folders/")) return [];
    
    const idCarpeta = urlCarpeta.split("folders/")[1].split("?")[0];
    const carpeta = DriveApp.getFolderById(idCarpeta);
    const filesIter = carpeta.getFiles();
    
    let archivos = [];
    while (filesIter.hasNext()) {
      const f = filesIter.next();
      archivos.push({ 
        id: f.getId(), 
        name: f.getName(), 
        mimeType: f.getMimeType(), 
        url: f.getUrl() 
      });
    }
    return archivos;
  } catch(e) { 
    logError("obtenerArchivosDrive", e);
    return []; 
  }
}