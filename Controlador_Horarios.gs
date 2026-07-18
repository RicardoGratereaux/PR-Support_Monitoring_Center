// 1. Obtener los turnos de un día específico
function getHorariosPorFecha(fechaStr) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) return [];

    const data = ws.getDataRange().getValues();
    const resultados = [];

  for (let i = 1; i < data.length; i++) {
    let rowFecha = data[i][1];
    if (!rowFecha) continue;

    let rowFechaStr = (rowFecha instanceof Date) ? Utilities.formatDate(rowFecha, Session.getScriptTimeZone(), "yyyy-MM-dd") : rowFecha.toString().trim().substring(0, 10);

    if (rowFechaStr === fechaStr) {
      let ordenRaw = data[i][8];
      let ordenFinal = (ordenRaw === undefined || ordenRaw === "") ? 999 : Number(ordenRaw);

      resultados.push({
        id: data[i][0],
        nombre: data[i][2],
        entrada: extraerHora(data[i][3]),
        salida: extraerHora(data[i][4]),
        breakIn: extraerHora(data[i][5]),
        breakOut: extraerHora(data[i][6]),
        foto: data[i][7] || "",
        orden: ordenFinal,
        nota: data[i][9] || "" // <--- NUEVO: Lee la Columna J
      });
    }
  }
    resultados.sort((a, b) => a.orden - b.orden);
    return resultados;
  } catch (error) {
    logError("getHorariosPorFecha", error);
    return [];
  }
}

// 2. Guardar un turno nuevo
function guardarTurnoNuevo(turnoData) {
  try {
    verificarSupervisor("guardar nuevo turno");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) throw new Error("No existe la hoja 'Horarios'.");

    ws.appendRow([
      turnoData.id,
      turnoData.fecha,
      turnoData.nombre,
      "'" + turnoData.entrada,
      turnoData.salida ? "'" + turnoData.salida : "",
      turnoData.breakIn ? "'" + turnoData.breakIn : "",
      turnoData.breakOut ? "'" + turnoData.breakOut : "",
      turnoData.foto || "",
      turnoData.orden || 999, // Columna I
      turnoData.nota || ""    // <--- NUEVO: Escribe en la Columna J
    ]);

    return true;
  } catch (error) {
    logError("guardarTurnoNuevo", error);
    return false;
  }
}

// 3. Actualizar un turno existente
function actualizarTurnoExistente(turnoData) {
  try {
    verificarSupervisor("actualizar turno");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);

    const data = ws.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(turnoData.id)) {
        ws.getRange(i + 1, 4, 1, 7).setValues([[
          "'" + turnoData.entrada,
          turnoData.salida ? "'" + turnoData.salida : "",
          turnoData.breakIn ? "'" + turnoData.breakIn : "",
          turnoData.breakOut ? "'" + turnoData.breakOut : "",
          data[i][7],
          data[i][8],
          turnoData.nota || ""
        ]]);
        return true;
      }
    }
    return false;
  } catch (error) {
    logError("actualizarTurnoExistente", error);
    return false;
  }
}

// 4. Eliminar un turno existente
function eliminarTurno(id) {
  try {
    verificarSupervisor("eliminar turno");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);

    if (!ws) throw new Error("No existe la hoja 'Horarios'.");

    const data = ws.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        ws.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  } catch (error) {
    logError("eliminarTurno", error);
    return false;
  }
}

// 5. Actualizar el orden de los turnos en Sheets (BLINDADO CONTRA TIPOS)
function actualizarOrdenTurnos(idsOrdenados) {
  try {
    verificarSupervisor("actualizar orden");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) return false;

    const data = ws.getDataRange().getValues();
    const idsStr = idsOrdenados.map(String);

    for (let i = 1; i < data.length; i++) {
      let idFila = String(data[i][0]);
      let nuevoIndex = idsStr.indexOf(idFila);

      if (nuevoIndex !== -1) {
        ws.getRange(i + 1, 9).setValue(nuevoIndex);
      }
    }
    return true;
  } catch (error) {
    logError("actualizarOrdenTurnos", error);
    return false;
  }
}

// 6. Eliminar múltiples turnos a la vez (Optimizado: De abajo hacia arriba)
function eliminarTurnosMasivo(idsArray) {
  try {
    verificarSupervisor("eliminar turnos");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) return false;

    const data = ws.getDataRange().getValues();
    const idsStr = idsArray.map(String);

    for (let i = data.length - 1; i >= 1; i--) {
      let idFila = String(data[i][0]);
      if (idsStr.includes(idFila)) {
        ws.deleteRow(i + 1);
      }
    }
    return true;
  } catch (error) {
    logError("eliminarTurnosMasivo", error);
    return false;
  }
}

// 7. Obtener el historial completo de un colaborador
function getHorariosPorColaborador(nombre) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) return [];

    const data = ws.getDataRange().getValues();
    const resultados = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === nombre) {
      let rowFecha = data[i][1];
      let fechaFmt = (rowFecha instanceof Date) ? Utilities.formatDate(rowFecha, Session.getScriptTimeZone(), "yyyy-MM-dd") : rowFecha.toString().trim().substring(0, 10);

      resultados.push({
        id: data[i][0],
        fecha: fechaFmt,
        nombre: data[i][2],
        entrada: extraerHora(data[i][3]),
        salida: extraerHora(data[i][4]),
        breakIn: extraerHora(data[i][5]),
        breakOut: extraerHora(data[i][6]),
        nota: data[i][9] || "" // <--- NUEVO: Lee la Columna J para el Historial
      });
    }
  }
    resultados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return resultados;
  } catch (error) {
    logError("getHorariosPorColaborador", error);
    return [];
  }
}

function predecirHorarioColaborador(nombre, fechaStr) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) return null;

    const data = ws.getDataRange().getValues();

    const partes = fechaStr.split('-');
    const fechaObjetivo = new Date(partes[0], partes[1] - 1, partes[2]);
    const diaSemanaObjetivo = fechaObjetivo.getDay();

  let conteoPatronesDia = {}; // Votos para el día específico (Ej. Sábados)
  let conteoPatronesGeneral = {}; // Votos generales (Plan de Respaldo)

  // 2. Minería de Datos: Escaneamos el historial
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === nombre) {
      let entradaStr = extraerHora(data[i][3]);

      // Ignoramos si ese día estaba de Vacaciones, Licencia, etc. (solo queremos turnos reales)
      if (!entradaStr.includes(":")) continue;

      let salidaStr = extraerHora(data[i][4]);
      let breakInStr = extraerHora(data[i][5]);
      let breakOutStr = extraerHora(data[i][6]);

      // Empaquetamos el turno completo como un "ADN" único
      let patronADN = JSON.stringify({
        entrada: entradaStr, salida: salidaStr, breakIn: breakInStr, breakOut: breakOutStr
      });

      // Sumamos 1 voto al plan de respaldo
      conteoPatronesGeneral[patronADN] = (conteoPatronesGeneral[patronADN] || 0) + 1;

      // Extraemos la fecha de la fila para ver qué día de la semana fue
      let rowFecha = data[i][1];
      if (rowFecha) {
        let fechaFila;
        if (rowFecha instanceof Date) {
          fechaFila = rowFecha;
        } else {
          let p = rowFecha.toString().trim().substring(0, 10).split('-');
          fechaFila = new Date(p[0], p[1] - 1, p[2]);
        }

        // Si el día de la semana coincide con lo que buscamos, sumamos 1 voto al objetivo principal
        if (fechaFila.getDay() === diaSemanaObjetivo) {
          conteoPatronesDia[patronADN] = (conteoPatronesDia[patronADN] || 0) + 1;
        }
      }
    }
  }

  // 3. Seleccionar al ganador (Calculamos la "Moda" estadística)
  let patronGanador = null;
  let maxVotos = 0;

  for (let adn in conteoPatronesDia) {
    if (conteoPatronesDia[adn] > maxVotos) {
      maxVotos = conteoPatronesDia[adn];
      patronGanador = adn;
    }
  }

  // 4. Fallback (Plan de respaldo): Si nunca trabajó este día, usamos su turno histórico general
  let usoFallback = false;
  if (!patronGanador) {
    usoFallback = true;
    for (let adn in conteoPatronesGeneral) {
      if (conteoPatronesGeneral[adn] > maxVotos) {
        maxVotos = conteoPatronesGeneral[adn];
        patronGanador = adn;
      }
    }
  }

  // 5. Devolvemos el resultado a la pantalla
    if (patronGanador) {
      let resultadoFinal = JSON.parse(patronGanador);
      resultadoFinal.esFallback = usoFallback;
      return resultadoFinal;
    } else {
      return null;
    }
  } catch (error) {
    logError("predecirHorarioColaborador", error);
    return null;
  }
}

// 8. Pegar turnos masivos (Clonador de Días)
function pegarTurnosMasivosBackend(fechaDestino, turnosCopiados) {
  try {
    verificarSupervisor("pegar turnos masivos");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) throw new Error("No existe la hoja 'Horarios'.");

    let nuevasFilas = [];
    let baseId = Date.now(); 

    turnosCopiados.forEach((turno, index) => {
      nuevasFilas.push([
        baseId + index,
        fechaDestino,
        turno.nombre,
        "'" + turno.entrada,
        turno.salida ? "'" + turno.salida : "",
        turno.breakIn ? "'" + turno.breakIn : "",
        turno.breakOut ? "'" + turno.breakOut : "",
        turno.foto || "",
        turno.orden || 999,
        turno.nota || "" 
      ]);
    });

    if (nuevasFilas.length > 0) {
      ws.getRange(ws.getLastRow() + 1, 1, nuevasFilas.length, nuevasFilas[0].length).setValues(nuevasFilas);
    }

    return true;
  } catch (error) {
    logError("pegarTurnosMasivosBackend", error);
    return false;
  }
}

// 9. Actualizar múltiples turnos a la vez (Asignación Masiva)
function actualizarTurnosMasivoBackend(idsArray, turnoData) {
  try {
    verificarSupervisor("actualizar turnos masivos");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ws = ss.getSheetByName(CONFIG.HOJAS.HORARIOS);
    if (!ws) return false;

    const data = ws.getDataRange().getValues();
    const idsStr = idsArray.map(String);

    for (let i = 1; i < data.length; i++) {
      let idFila = String(data[i][0]);
      if (idsStr.includes(idFila)) {
        ws.getRange(i + 1, 4, 1, 4).setValues([[
          "'" + turnoData.entrada,
          turnoData.salida ? "'" + turnoData.salida : "",
          turnoData.breakIn ? "'" + turnoData.breakIn : "",
          turnoData.breakOut ? "'" + turnoData.breakOut : ""
        ]]);
      }
    }
    return true;
  } catch (error) {
    logError("actualizarTurnosMasivoBackend", error);
    return false;
  }
}