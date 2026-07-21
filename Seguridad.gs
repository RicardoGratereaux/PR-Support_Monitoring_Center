function esSupervisor() {
  const email = obtenerEmailUsuario();
  return CONFIG.SUPERVISORES.includes(email);
}

function verificarSupervisor(operacion) {
  if (!esSupervisor()) {
    throw new Error("No autorizado: se requieren permisos de supervisor para " + operacion);
  }
}

function verificarAutoria(emailAutor) {
  const emailActual = obtenerEmailUsuario();
  if (emailActual !== emailAutor.toLowerCase()) {
    throw new Error("No autorizado: solo el autor puede realizar esta acción");
  }
}

function obtenerEmailUsuario() {
  if (!obtenerEmailUsuario._cache) {
    obtenerEmailUsuario._cache = Session.getActiveUser().getEmail().toLowerCase();
  }
  return obtenerEmailUsuario._cache;
}
