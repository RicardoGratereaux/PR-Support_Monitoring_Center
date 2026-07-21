function gatherDailyBreachData(ss, dateObj, timezone) {
  const hojaCalendario = ss.getSheetByName(CONFIG.HOJAS.CALENDARIO_PROTOCOLOS);
  const data = hojaCalendario.getRange("A2:G" + hojaCalendario.getLastRow()).getValues();
  const hoyStr = Utilities.formatDate(dateObj, timezone, "dd/MM/yyyy");

  const breachItems = [];
  const pendingItems = [];
  let cumplidas = 0,
    pendientes = 0,
    incumplidas = 0,
    recordatoriosEnviados = 0;

  for (let i = 0; i < data.length; i++) {
    const fila = data[i];
    if (!fila[0]) continue;

    const fechaCeldaStr = Utilities.formatDate(new Date(fila[0]), timezone, "dd/MM/yyyy");
    if (fechaCeldaStr !== hoyStr) continue;

    const tienda = fila[1];
    const horaAlertaObj = fila[2];
    const estado = (fila[3] || "Pendiente").trim();
    const observacion = fila[4] || "Sin observaciones registradas.";
    const correoEnviado = fila[5];

    let horaFormateada = "";
    if (horaAlertaObj) {
      try {
        horaFormateada = Utilities.formatDate(new Date(horaAlertaObj), timezone, "HH:mm");
      } catch (e) {
        horaFormateada = String(horaAlertaObj);
      }
    }

    if (estado === "Incumplido") {
      incumplidas++;
      breachItems.push({
        tienda,
        hora: horaFormateada,
        observacion: observacion
      });
    } else if (estado === "Pendiente") {
      pendientes++;
      pendingItems.push({ tienda, hora: horaFormateada });
    } else if (estado === "Cumplido") {
      cumplidas++;
    }

    if (correoEnviado && correoEnviado.toString().indexOf("Enviado") === 0) {
      recordatoriosEnviados++;
    }
  }

  return {
    breachItems,
    pendingItems,
    numCumplidas: cumplidas,
    numPendientes: pendientes,
    numIncumplidas: incumplidas,
    numRecordatoriosEnviados: recordatoriosEnviados
  };
}

function generateStyledDailySummaryHtml(dateStr, data) {
  const totalStores = data.numCumplidas + data.numPendientes + data.numIncumplidas;

  let colorEstatus = "#16a34a";
  let headerText = "Alertas cumplidas correctamente";

  if (data.numIncumplidas > 0) {
    colorEstatus = "#dc2626";
    headerText = "Alerta de Incumplimiento";
  } else if (data.numPendientes > 0) {
    colorEstatus = "#f59e0b";
    headerText = "Reporte de Tiendas Pendientes";
  }

  let bodyHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #374151; max-width: 580px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: ${colorEstatus}; color: white; padding: 25px 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${headerText}</h2>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Control de Alertas de Reposición | ${dateStr}</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
  `;

  if (data.numIncumplidas > 0 && data.breachItems && data.breachItems.length > 0) {
    bodyHtml += `
      <p style="margin-top:0; margin-bottom: 12px; font-size:14px; color:#4b5563; line-height: 1.5; font-weight: 600;">Sucursales con Incumplimiento:</p>
      <div style="margin-bottom: 25px; width: 100%;">
    `;

    data.breachItems.forEach((item) => {
      let observacionFormateada = item.observacion || "";

      observacionFormateada = observacionFormateada.replace(
        /\[?\s*📸?\s*Evidencia de tienda:\s*https?:\/\/[^\s\]]+/gi,
        ""
      );
      observacionFormateada = observacionFormateada.replace(/\[\s*\]/g, "");
      observacionFormateada = observacionFormateada.trim();

      if (!observacionFormateada || observacionFormateada === '""') {
        observacionFormateada = "Sin observaciones registradas.";
      }

      bodyHtml += `
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-top: 1px solid #fee2e2; border-right: 1px solid #fee2e2; border-bottom: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: block; clear: both;">
          
          <div style="display: block; width: 100%; margin-bottom: 6px; font-size: 14px;">
            <span style="color: #991b1b; font-weight: bold; float: right; font-size: 12px; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">Hora Alerta: ${item.hora}</span>
            <b style="color: #111827; font-size: 15px;">${item.tienda}</b>
            <div style="clear: both;"></div>
          </div>
          
          <div style="color: #7f1d1d; font-size: 14.5px; font-weight: 500; background: #ffffff; padding: 14px; border-radius: 6px; border: 1px dashed #fca5a5; margin-top: 10px; line-height: 1.5; word-wrap: break-word; word-break: break-word; white-space: normal;">
            "${observacionFormateada}"
          </div>
          
        </div>
      `;
    });
    bodyHtml += `</div>`;
  }

  if (data.numPendientes > 0 && data.pendingItems && data.pendingItems.length > 0) {
    bodyHtml += `
      <p style="margin-top: 15px; font-size:14px; color:#4b5563; line-height: 1.5;">Se detalla a continuación el reporte de las sucursales que permanecen en estado <b>pendiente de alerta</b>:</p>
      <div style="margin-top: 15px; margin-bottom: 25px; display: block; width: 100%;">
    `;

    data.pendingItems.forEach((item) => {
      bodyHtml += `
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin-bottom: 16px; display: block; clear: both;">
          <span style="font-size: 12px; color: #b45309; font-weight: bold; float: right; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">Hora asignada: ${item.hora}</span>
          <b style="color: #111827; font-size: 14.5px;">${item.tienda}</b>
          <div style="clear: both;"></div>
        </div>
      `;
    });
    bodyHtml += `</div>`;
  }

  if (data.numIncumplidas === 0 && data.numPendientes === 0) {
    bodyHtml += `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 15px; color: #14532d; font-weight: 600;">Todas las tiendas cumplieron con la reposición de hoy de manera exitosa.</p>
      </div>
    `;
  }

  bodyHtml += `
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; color: #6b7280; font-weight: 600; text-align: center; border-collapse: collapse;">
            <tr>
              <td width="25%" style="padding: 4px 0;">Cumplidas: <span style="color: #111827; font-weight: 700;">${data.numCumplidas}</span></td>
              <td width="25%" style="padding: 4px 0;">Pendientes: <span style="color: #111827; font-weight: 700;">${data.numPendientes}</span></td>
              <td width="25%" style="padding: 4px 0;">Incumplidas: <span style="color: #111827; font-weight: 700;">${data.numIncumplidas}</span></td>
              <td width="25%" style="padding: 4px 0;">Total Alertas: <span style="color: #111827; font-weight: 700;">${totalStores}</span></td>
            </tr>
          </table>
        </div>
        
        <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          Reporte automatizado emitido de forma exclusiva por el Centro de Monitoreo.
        </div>
      </div>
    </div>
  `;

  return bodyHtml;
}

function sendStyledDailyBreachSummaryEmail() {
  const idSpreadsheetReposicion = CONFIG.ID_SPREADSHEET_REPOSICION;
  const ss = SpreadsheetApp.openById(idSpreadsheetReposicion);
  const ahora = new Date();
  const zona = Session.getScriptTimeZone();
  const hoyStr = Utilities.formatDate(ahora, zona, "dd/MM/yyyy");

  const breachData = gatherDailyBreachData(ss, ahora, zona);
  const totalStores =
    breachData.numCumplidas + breachData.numPendientes + breachData.numIncumplidas;
  if (totalStores === 0) return;

  const htmlBody = generateStyledDailySummaryHtml(hoyStr, breachData);

  const asunto = `Resumen diario reposición tiendas - ${hoyStr}`;
  const destinatarioPruebas = CONFIG.NOTIFICACIONES.RESUMEN_DIARIO_TO;

  if (MailApp.getRemainingDailyQuota() > 0) {
    try {
      MailApp.sendEmail({
        to: destinatarioPruebas,
        cc: CONFIG.NOTIFICACIONES.RESUMEN_DIARIO_CC,
        subject: asunto,
        htmlBody: htmlBody
      });
      Logger.log("Resumen de control despachado directo al punto a: " + destinatarioPruebas);
    } catch (e) {
      logError("sendStyledDailyBreachSummaryEmail", e);
    }
  } else {
    Logger.log("No hay cuota disponible para enviar el correo.");
  }
}

function ejecutarCronExacto() {
  try {
    const ahora = new Date();
    const zona = Session.getScriptTimeZone();
    const horaMinutosStr = Utilities.formatDate(ahora, zona, "HH:mm");

    if (horaMinutosStr === "07:30") {
    }

    if (horaMinutosStr === "18:00") {
      sendStyledDailyBreachSummaryEmail();
    }
  } catch (error) {
    logError("ejecutarCronExacto", error);
  }
}

function executarCronExacto() {
  ejecutarCronExacto();
}

function enviarAlertaCorreo(datos, idReporte, urlCarpeta) {
  try {
    if (MailApp.getRemainingDailyQuota() <= 0) {
      Logger.log("Alerta: Cuota de MailApp agotada. No se pudo enviar alerta.");
      return;
    }
    const correosDestino = CONFIG.NOTIFICACIONES.ALERTA_CRITICA;

    const palabrasCriticas = ["robo", "asalto", "violencia", "fraude", "urgente", "amenaza"];
    const tipo = (datos.tipoReporte || "").toLowerCase();

    const esUrgente = palabrasCriticas.some((palabra) => tipo.includes(palabra));

    if (esUrgente) {
      const asunto = ` ALERTA CRÍTICA: ${datos.tienda} - ${datos.tipoReporte}`;

      const mensajeHtml = `
        <div style="font-family: Arial, sans-serif; color: #374151; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #dc2626; color: white; padding: 15px 20px;">
            <h2 style="margin: 0;">Alerta de Seguridad Crítica</h2>
          </div>
          <div style="padding: 20px;">
            <p>Se ha registrado un reporte que requiere atención inmediata en el Centro de Monitoreo.</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>ID Reporte:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${idReporte}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Operación:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${datos.empresa}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Tienda:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${datos.tienda}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Tipo:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #dc2626;"><strong>${datos.tipoReporte}</strong></td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Empleado:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${datos.empleado}</td></tr>
            </table>
            <h4 style="margin-top: 20px; margin-bottom: 5px;">Observaciones:</h4>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 0;">${datos.observaciones}</p>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${urlCarpeta}" style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"> Abrir Evidencias en Drive</a>
            </div>
          </div>
        </div>
      `;

      try {
        MailApp.sendEmail({
          to: correosDestino,
          subject: asunto,
          htmlBody: mensajeHtml
        });
      } catch (e) {
        logError("enviarAlertaCorreo", e);
      }
    }
  } catch (e) {
    logError("enviarAlertaCorreo", e);
  }
}

function enviarResolucionMonitor(idReporte, estado, datos, correoDestino) {
  const correoMonitor = correoDestino || "seguridad@empresa.com";

  const esAprobado = estado === "Aprobado";
  const colorEstatus = esAprobado ? "#16a34a" : "#dc2626";
  const icono = esAprobado ? "✅" : "❌";

  const asunto = `${icono} Actualización de Reporte: ${idReporte} [${estado}]`;
  const mensajeHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #374151; max-width: 550px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: ${colorEstatus}; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Reporte ${estado}</h2>
        <p style="margin: 5px 0 0; opacity: 0.9; font-size: 13px;">ID: ${idReporte}</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p>El estatus de tu reporte enviado para la tienda <b>${datos.tienda}</b> (${datos.tipoReporte}) ha sido actualizado por el Supervisor.</p>
        
        <h4 style="color: #1e293b; margin-bottom: 8px; margin-top: 20px;">Observaciones del Supervisor:</h4>
        <div style="background-color: #f8fafc; border-left: 4px solid ${colorEstatus}; padding: 15px; border-radius: 4px; font-style: italic; color: #475569; font-size: 13px;">
          "${datos.observacionSupervisor}"
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">Notificaciones automáticas del Centro de Monitoreo.</p>
      </div>
    </div>
  `;

  try {
    if (MailApp.getRemainingDailyQuota() > 0) {
      MailApp.sendEmail({ to: correoMonitor, subject: asunto, htmlBody: mensajeHtml });
    }
  } catch (e) {
    logError("enviarResolucionMonitor", e);
  }
}

function obtenerPlantillaRecordatorio(fecha, nombreTienda, hora) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #374151; max-width: 580px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #2563eb; color: white; padding: 25px 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Recordatorio de Reposición</h2>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Centro de Monitoreo | Alerta Programada</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="margin-top:0; font-size:15px; color:#4b5563; line-height: 1.5;">
          Hola, se le notifica que de acuerdo al calendario oficial de protocolos para hoy (<b>${fecha}</b>), su tienda tiene un control próximo:
        </p>
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-top: 1px solid #dbeafe; border-right: 1px solid #dbeafe; border-bottom: 1px solid #dbeafe; padding: 18px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
          <div style="font-size: 16px; margin-bottom: 6px;">Sucursal: <b style="color: #111827;">${nombreTienda}</b></div>
          <div style="font-size: 15px; color: #1e40af; font-weight: 600;">Hora de Alerta Obligatoria: ${hora} hrs.</div>
        </div>
        <div style="background-color: #fffbeb; border: 1px dashed #fcd34d; padding: 14px; border-radius: 6px; color: #b45309; font-size: 13.5px; line-height: 1.4; font-weight: 500;">
          <b>Nota operativa:</b> Recuerde lanzar la alerta de forma puntual para certificar el estatus de la reposición de tienda.
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://docs.google.com/spreadsheets/d/1neZoocmPwyMYa-31dbfUqSv0IsXHP8tp8Xvwj7MadLw/edit?gid=131321006#gid=131321006" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
            Ir a la hoja de reposición
          </a>
        </div>

        <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 35px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          Aviso automatizado de control logístico interno. Por favor no responder a este mensaje.
        </div>
      </div>
    </div>
  `;
}

function ejecutarRecordatoriosProgramadosGlobal() {
  const idSpreadsheetReposicion = CONFIG.ID_SPREADSHEET_REPOSICION;

  try {
    if (MailApp.getRemainingDailyQuota() <= 0) {
      Logger.log("Alerta: Cuota de MailApp agotada. No se pudo enviar recordatorios.");
      return;
    }
    const ss = SpreadsheetApp.openById(idSpreadsheetReposicion);
    const hojaCalendario = ss.getSheetByName(CONFIG.HOJAS.CALENDARIO_PROTOCOLOS);
    const hojaTiendas = ss.getSheetByName(CONFIG.HOJAS.TIENDAS);

    if (!hojaCalendario || !hojaTiendas) {
      Logger.log("⚠️ Error en Recordatorios: No se encontraron las pestañas en el Sheets externo.");
      return;
    }

    const ahora = new Date();
    const zona = Session.getScriptTimeZone();
    const hoy = Utilities.formatDate(ahora, zona, "dd/MM/yyyy");

    const datosTiendas = hojaTiendas.getDataRange().getValues();
    let mapaCorreos = {};
    for (let t = 1; t < datosTiendas.length; t++) {
      const nombreT = (datosTiendas[t][0] || "").toString().trim();
      const correoT = (datosTiendas[t][1] || "").toString().trim();
      if (nombreT && correoT) mapaCorreos[nombreT] = correoT;
    }

    const data = hojaCalendario.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      if (!fila[0] || !fila[2]) continue;

      const fechaCelda = fila[0];
      const tienda = (fila[1] || "").toString().trim();
      const horaCelda = fila[2];
      const estado = (fila[3] || "Pendiente").trim();
      const yaEnviado = (fila[5] || "").toString().trim();

      const fechaFormateada = Utilities.formatDate(new Date(fechaCelda), zona, "dd/MM/yyyy");
      if (fechaFormateada !== hoy) continue;

      if (yaEnviado.indexOf("Enviado") === 0 || estado === "Cumplido" || estado === "Incumplido")
        continue;

      const horaObj = new Date(horaCelda);
      const fechaAlerta = new Date(fechaCelda);
      fechaAlerta.setHours(horaObj.getHours(), horaObj.getMinutes(), 0, 0);

      const fechaEnvio = new Date(fechaAlerta.getTime() - 30 * 60000);
      const horaAlertaStr = Utilities.formatDate(fechaAlerta, zona, "HH:mm");

      if (ahora >= fechaEnvio && ahora < fechaAlerta) {
        if (mapaCorreos[tienda]) {
          const cuerpoHtml = obtenerPlantillaRecordatorio(hoy, tienda, horaAlertaStr);

          if (MailApp.getRemainingDailyQuota() > 0) {
            MailApp.sendEmail({
              to: mapaCorreos[tienda],
              subject: "Recordatorio de Reposición - " + tienda + " (" + horaAlertaStr + ")",
              htmlBody: cuerpoHtml
            });
          }

          hojaCalendario
            .getRange(i + 1, 6)
            .setValue("Enviado " + Utilities.formatDate(ahora, zona, "HH:mm"));
          Logger.log("📨 Recordatorio enviado desde App Principal a: " + mapaCorreos[tienda]);
        }
      }
    }
  } catch (errorCrítico) {
    logError("ejecutarRecordatoriosProgramadosGlobal", errorCrítico);
  }
}

function PROBAR_Recordatorio_Ahora() {
  const correoTest = "seguridad09@prsup.net";
  const tiendaEjemplo = "CT-01 ARECIBO";
  const horaAlertaFormateada = "17:00";
  const hoyStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  try {
    const cuerpoHtml = obtenerPlantillaRecordatorio(hoyStr, tiendaEjemplo, horaAlertaFormateada);

    MailApp.sendEmail({
      to: correoTest,
      subject: "Recordatorio de Reposición - " + tiendaEjemplo + " (" + horaAlertaFormateada + ")",
      htmlBody: cuerpoHtml
    });
    Logger.log("Correo de prueba de recordatorio enviado con éxito a: " + correoTest);
  } catch (e) {
    Logger.log("Error en prueba de recordatorio: " + e.message);
  }
}

function PROBAR_ResumenDirectivos_Ahora() {
  const correoTest = "seguridad09@prsup.net";
  const hoyStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  const datosFicticiosPrueba = {
    numCumplidas: 12,
    numPendientes: 3,
    numIncumplidas: 1,
    breachItems: [
      {
        tienda: "CT-01 ARECIBO",
        hora: "17:00",
        observacion:
          "Llamada no contestada tras los intentos reglamentarios por el personal de turno."
      }
    ],
    pendingItems: [
      { tienda: "CT-02 BAYAMON", hora: "17:30" },
      { tienda: "CT-05 CAGUAS", hora: "17:45" },
      { tienda: "CT-09 MAYAGUEZ", hora: "18:00" }
    ]
  };

  try {
    const cuerpoHtml = generateStyledDailySummaryHtml(hoyStr, datosFicticiosPrueba);

    MailApp.sendEmail({
      to: correoTest,
      subject: "Resumen diario reposicion tiendas - " + hoyStr,
      htmlBody: cuerpoHtml
    });
    Logger.log("Correo de prueba corporativo enviado con exito a: " + correoTest);
  } catch (e) {
    Logger.log("Error en prueba corporativa: " + e.message);
  }
}
