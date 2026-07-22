/**
 * Controlador de Backend para la vista de Mapeo 3D de Tiendas y Cámaras.
 */

function guardarMapaTienda(tiendaId, jsonMapa) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const clave = "MAPA_3D_" + (tiendaId || "DEFAULT");
    properties.setProperty(clave, typeof jsonMapa === 'string' ? jsonMapa : JSON.stringify(jsonMapa));
    return { status: "success", message: "Mapa 3D guardado exitosamente." };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

function cargarMapaTienda(tiendaId) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const clave = "MAPA_3D_" + (tiendaId || "DEFAULT");
    const datos = properties.getProperty(clave);
    if (!datos) {
      return { status: "success", data: null, message: "Sin mapa previo registrado." };
    }
    return { status: "success", data: JSON.parse(datos) };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

function obtenerListaTiendasMapa() {
  return [
    { id: "tienda_main", nombre: "Tienda Principal - Centro" },
    { id: "tienda_norte", nombre: "Sucursal Norte" },
    { id: "tienda_sur", nombre: "Sucursal Sur" }
  ];
}
