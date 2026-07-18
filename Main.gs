function doGet(e) {
  let page = e.parameter.page || 'index';
  page = page.toLowerCase();
  
  const esSuper = esSupervisor();
  
  if ((page === 'dashboard' || page === 'gestionsupervisor') && !esSuper) {
    page = 'index'; 
  }
  
  let nombreArchivo = CONFIG.RUTAS[page] || 'Index';
  
  const template = HtmlService.createTemplateFromFile(nombreArchivo);
  
  template.paginaActiva = page;
  template.baseUrl = ScriptApp.getService().getUrl();
  template.usuarioEsSupervisor = esSuper;
  
  return template.evaluate()
    .setTitle("Centro de Monitoreo - Gestión")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename, pagina) {
  const template = HtmlService.createTemplateFromFile(filename);
  
  if (pagina) {
    template.paginaActiva = pagina;
  }
  
  template.baseUrl = ScriptApp.getService().getUrl();
  
  template.usuarioEsSupervisor = esSupervisor(); 
  
  return template.evaluate().getContent();
}