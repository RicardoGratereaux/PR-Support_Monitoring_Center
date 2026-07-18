/**
 * Seguridad.gs
 * Módulo de autorización y verificación de permisos.
 */

/**
 * Verifica si el usuario actual es supervisor.
 * @returns {boolean}
 */
function esSupervisor() {
  const email = obtenerEmailUsuario();
  return CONFIG.SUPERVISORES.includes(email);
}

/**
 * Verifica que el usuario actual sea supervisor. Lanza error si no.
 * @param {string} operacion - Nombre de la operación para el mensaje de error
 * @throws {Error} Si el usuario no es supervisor
 */
function verificarSupervisor(operacion) {
  if (!esSupervisor()) {
    throw new Error('No autorizado: se requieren permisos de supervisor para ' + operacion);
  }
}

/**
 * Verifica que el usuario actual sea el autor del recurso.
 * @param {string} emailAutor - Email del autor del recurso
 * @throws {Error} Si el usuario no es el autor
 */
function verificarAutoria(emailAutor) {
  const emailActual = obtenerEmailUsuario();
  if (emailActual !== emailAutor.toLowerCase()) {
    throw new Error('No autorizado: solo el autor puede realizar esta acción');
  }
}

/**
 * Obtiene el email del usuario actual (cacheado durante la ejecución).
 * @returns {string} Email en minúsculas
 */
function obtenerEmailUsuario() {
  // Cache in script execution scope
  if (!obtenerEmailUsuario._cache) {
    obtenerEmailUsuario._cache = Session.getActiveUser().getEmail().toLowerCase();
  }
  return obtenerEmailUsuario._cache;
}
