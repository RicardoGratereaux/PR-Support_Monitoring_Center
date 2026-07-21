const ID_CARPETA_RAIZ = CONFIG.ID_CARPETA_RAIZ;

function guardarReporte(datos, files) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    if (!hoja) throw new Error("No se encontró la pestaña 'Hoja 1'.");

    const id = generarIdSeguro(null, hoja);

    const nombreEmpresa = datos.empresa || "Empresa_Sin_Nombre";
    const nombreTienda = datos.tienda || "Tienda_Sin_Nombre";

    const carpetaEmpresa = obtenerOCrearCarpeta(nombreEmpresa);
    const carpetaTienda = obtenerOCrearSubCarpeta(carpetaEmpresa, nombreTienda);
    const carpetaReporte = carpetaTienda.createFolder(id);

    if (files && files.length > 0) {
      files.forEach((f) => {
        if (f && f.data) {
          const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type, f.name);
          carpetaReporte.createFile(blob);
        }
      });
    }

    const correoMonitor = Session.getActiveUser().getEmail().toLowerCase();
    const logInicial = `[${new Date().toLocaleDateString("es-PR")}] Creado por:${correoMonitor}`;

    hoja.appendRow([
      id,

      new Date(),

      datos.empresa,

      datos.tienda,

      datos.posicion,

      datos.tipoReporte,
      datos.empleado,

      datos.iniciales,

      datos.observaciones,

      "Pendiente",

      carpetaReporte.getUrl(),

      "",
      logInicial,
      correoMonitor
    ]);
    enviarAlertaCorreo(datos, id, carpetaReporte.getUrl());
    CacheService.getScriptCache().remove("lista_reportes_global");
    CacheService.getScriptCache().remove("mis_reportes_" + correoMonitor);
    Logger.log("Cachés destruidas. Próxima consulta leerá datos frescos de la Hoja 1.");
    return { success: true, id: id };
  } catch (error) {
    logError("guardarReporte", error);
    return respuestaError(error.message);
  }
}

function getReportes() {
  const cache = CacheService.getScriptCache();
  const cacheKey = "lista_reportes_global";

  const datosCache = cache.get(cacheKey);
  if (datosCache !== null) {
    Logger.log("Velocidad Turbo: Entregando lista de reportes desde la Caché.");
    return datosCache;
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
    const data = hoja.getDataRange().getValues();

    let reportes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      reportes.push({
        id: row[0],
        fecha: row[1] ? new Date(row[1]).toISOString() : "",
        empresa: row[2],
        tienda: row[3],
        posicion: row[4],
        tipoReporte: row[5],
        empleado: row[6],
        iniciales: row[7],
        observacionesMonitor: row[8],
        estado: row[9] || "Pendiente",
        carpeta: row[10] || "#",
        observacionSupervisor: row[11] || "",
        correoMonitor: row[13] || ""
      });
    }

    const resultadoJson = JSON.stringify(reportes.reverse());

    cache.put(cacheKey, resultadoJson, 600);
    Logger.log("Caché creada exitosamente para la lista global de reportes.");

    return resultadoJson;
  } catch (error) {
    logError("getReportes", error);
    return JSON.stringify([]);
  }
}

function _cambiarEstadoReporte(idReporte, estado) {
  const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_PRINCIPAL);
  const hoja = ss.getSheetByName(CONFIG.HOJAS.PRINCIPAL);
  const data = hoja.getDataRange().getValues();

  const usuario = obtenerEmailUsuario() || "Usuario Desconocido";
  const fecha = new Date().toLocaleString("es-PR");
  const logMensaje = `[${fecha}]  ${estado} por: ${usuario}`;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idReporte) {
      hoja.getRange(i + 1, 10).setValue(estado);

      const logActual = data[i][12] || "";
      hoja.getRange(i + 1, 13).setValue(logActual ? logActual + "\n" + logMensaje : logMensaje);

      const datosNotificacion = {
        tienda: data[i][3],
        tipoReporte: data[i][5],
        observacionSupervisor:
          data[i][11] ||
          (estado === "Rechazado" ? "Revisar observaciones." : "Sin observaciones adicionales.")
      };

      const correoMonitorOriginal = data[i][13];
      enviarResolucionMonitor(idReporte, estado, datosNotificacion, correoMonitorOriginal);

      CacheService.getScriptCache().remove("lista_reportes_global");
      return respuestaExitosa({ message: `${estado}.` });
    }
  }
  throw new Error("No se encontró el ID.");
}

function aprobarReporte(idReporte) {
  try {
    verificarSupervisor("aprobar reporte");
    return _cambiarEstadoReporte(idReporte, "Aprobado");
  } catch (error) {
    logError("aprobarReporte", error);
    return respuestaError(error.message);
  }
}

function rechazarReporte(idReporte) {
  try {
    verificarSupervisor("rechazar reporte");
    return _cambiarEstadoReporte(idReporte, "Rechazado");
  } catch (error) {
    logError("rechazarReporte", error);
    return respuestaError(error.message);
  }
}

function obtenerOCrearCarpeta(nombre) {
  try {
    const carpetaRaiz = DriveApp.getFolderById(ID_CARPETA_RAIZ);
    const carpetas = carpetaRaiz.getFoldersByName(nombre);

    if (carpetas.hasNext()) {
      return carpetas.next();
    }

    return carpetaRaiz.createFolder(nombre);
  } catch (error) {
    logError("obtenerOCrearCarpeta", error);
    throw error;
  }
}

function obtenerOCrearSubCarpeta(carpetaPadre, nombreSubcarpeta) {
  try {
    const carpetas = carpetaPadre.getFoldersByName(nombreSubcarpeta);

    if (carpetas.hasNext()) {
      return carpetas.next();
    }

    return carpetaPadre.createFolder(nombreSubcarpeta);
  } catch (error) {
    logError("obtenerOCrearSubCarpeta", error);
    throw error;
  }
}

function getCalendarioReposicionHoy() {
  const cache = CacheService.getScriptCache();
  const cacheKey = "reposicion_hoy";

  const datosCache = cache.get(cacheKey);
  if (datosCache !== null) {
    Logger.log("Velocidad Turbo: Entregando agenda de reposición desde la Caché.");
    return datosCache;
  }

  try {
    const idSpreadsheetReposicion = CONFIG.ID_SPREADSHEET_REPOSICION;
    const ss = SpreadsheetApp.openById(idSpreadsheetReposicion);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.CALENDARIO_PROTOCOLOS);
    if (!hoja) throw new Error("No se encontró la hoja 'Calendario de protocolos'");

    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return JSON.stringify([]);

    const datos = hoja.getRange("A2:G" + ultimaFila).getValues();
    const zona = Session.getScriptTimeZone();
    const hoyStr = Utilities.formatDate(new Date(), zona, "dd/MM/yyyy");

    let agendaHoy = [];

    datos.forEach((fila, indice) => {
      if (!fila[0]) return;
      const fechaCeldaStr = Utilities.formatDate(new Date(fila[0]), zona, "dd/MM/yyyy");

      if (fechaCeldaStr === hoyStr) {
        let horaFormateada = "";
        if (fila[2]) {
          try {
            horaFormateada = Utilities.formatDate(new Date(fila[2]), zona, "HH:mm");
          } catch (e) {
            horaFormateada = fila[2].toString();
          }
        }

        let evidenciaUrl = "";
        if (fila[6] && fila[6].toString().indexOf("http") === 0) {
          evidenciaUrl = fila[6].toString();
        }

        agendaHoy.push({
          numFila: indice + 2,
          fecha: fechaCeldaStr,
          tienda: fila[1] || "Sin Tienda",
          horaProgramada: horaFormateada,
          estado: fila[3] || "Pendiente",
          observacion: fila[4] || "",
          evidenciaUrl: evidenciaUrl
        });
      }
    });

    const resultadoJson = JSON.stringify(agendaHoy);

    cache.put(cacheKey, resultadoJson, 600);
    Logger.log("Caché creada exitosamente para la agenda de reposición.");

    return resultadoJson;
  } catch (error) {
    logError("getCalendarioReposicionHoy", error);
    return JSON.stringify([]);
  }
}

function limpiarCacheManual() {
  try {
    CacheService.getScriptCache().remove("reposicion_hoy");
    Logger.log("Caché borrada. El Dashboard volverá a leer la hoja en vivo.");
  } catch (error) {
    logError("limpiarCacheManual", error);
  }
}

function actualizarEstadoReposicionConEvidencia(
  numFila,
  nuevoEstado,
  observacionInput,
  archivoImagen
) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.ID_SPREADSHEET_REPOSICION);
    const hoja = ss.getSheetByName(CONFIG.HOJAS.CALENDARIO_PROTOCOLOS);
    if (!hoja) throw new Error("Error al conectar con el libro de protocolos externos.");

    let urlEvidencia = "";

    if (archivoImagen && archivoImagen.data) {
      try {
        const idCarpetaRaizCompartida = CONFIG.ID_CARPETA_RAIZ;
        const carpetaRaiz = DriveApp.getFolderById(idCarpetaRaizCompartida);

        let carpetaProtocolos;
        const nombreCarpetaProtocolo = CONFIG.CARPETA_PROTOCOLOS_EVIDENCIAS;
        const carpetasExistentes = carpetaRaiz.getFoldersByName(nombreCarpetaProtocolo);

        if (carpetasExistentes.hasNext()) {
          carpetaProtocolos = carpetasExistentes.next();
        } else {
          carpetaProtocolos = carpetaRaiz.createFolder(nombreCarpetaProtocolo);
        }

        const nombreTienda = hoja.getRange(numFila, 2).getValue();
        const fechaHoyFormato = Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );

        const blob = Utilities.newBlob(
          Utilities.base64Decode(archivoImagen.data),
          archivoImagen.type,
          `Evidencia_${nombreTienda}_${fechaHoyFormato}`
        );
        const archivoCreado = carpetaProtocolos.createFile(blob);
        urlEvidencia = archivoCreado.getUrl();
      } catch (errorDrive) {
        Logger.log("Aviso: No se pudo almacenar la foto en Drive: " + errorDrive.message);
      }
    }

    hoja.getRange(numFila, 4).setValue(nuevoEstado);
    hoja.getRange(numFila, 5).setValue(observacionInput.trim());

    if (urlEvidencia) {
      hoja.getRange(numFila, 7).setValue(urlEvidencia);
    }

    CacheService.getScriptCache().remove("reposicion_hoy");
    Logger.log("Caché destruida debido a una nueva inserción de datos.");

    return respuestaExitosa({ message: "Modificación exitosa." });
  } catch (error) {
    logError("actualizarEstadoReposicionConEvidencia", error);
    return respuestaError(error.message);
  }
}
