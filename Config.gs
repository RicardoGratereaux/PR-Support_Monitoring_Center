/**
 * Config.gs
 * Archivo centralizado de configuraciones y constantes.
 */

const CONFIG = {
  // IDs de Spreadsheets y Carpetas
  ID_CARPETA_RAIZ: "1kuePSEk3H7XXLntS7YFCC-qLVAUxUIlH",
  ID_SPREADSHEET_REPOSICION: "1neZoocmPwyMYa-31dbfUqSv0IsXHP8tp8Xvwj7MadLw",
  CARPETA_PROTOCOLOS_EVIDENCIAS: "Protocolos_Reposicion_Evidencias",
  
  // Nombres de Hojas
  HOJAS: {
    PRINCIPAL: "Hoja 1",
    HORARIOS: "Horarios",
    CALENDARIO_PROTOCOLOS: "Calendario de protocolos",
    TIENDAS: "Tiendas"
  },
  
  // Emails
  SUPERVISORES: [
    "seguridad@prsup.net",
    "mbrito@prsup.net",
    "seguridad07@prsup.net"
  ],
  NOTIFICACIONES: {
    ALERTA_CRITICA: "seguridad09@prsup.net",
    RESUMEN_DIARIO_TO: "seguridad@prsup.net",
    RESUMEN_DIARIO_CC: "mrodriguez@farmaciasreypr.com, mbrito@prsup.net, rreynoso@chinatownandmore.com, yalbelo@farmaciasreypr.com"
  },
  
  // Caché
  CACHE_TTL: {
    REPORTES: 600, // 10 minutos
    REPOSICION: 600,
    MIS_REPORTES: 600
  },
  
  // Rutas
  RUTAS: {
    'index': 'Index',
    'misreportes': 'MisReportes',
    'reposicion': 'Reposicion',
    'dashboard': 'Dashboard',
    'horarios': 'Horarios',
    'gestionsupervisor': 'GestionSupervisor'
  }
};
