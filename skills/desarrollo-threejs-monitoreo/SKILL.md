---
name: desarrollo-threejs-monitoreo
description: Guía y mejores prácticas para el desarrollo con Three.js en el editor de mapas 3D del Centro de Monitoreo (Raycasting, Gizmos, UI Overlay en 3D, Cámaras CCTV y Eventos).
---

# Skill: Desarrollo y Gestión 3D con Three.js

Esta skill establece las normas de desarrollo con Three.js para la aplicación de mapeo 3D de sucursales y monitoreo CCTV.

---

## 1. Raycasting y Selección sin Interferencia
Para evitar que `OrbitControls` o el canvas impidan la selección de objetos:
1. Usar eventos de tipo `pointerdown` y `pointerup` registrando la posición `(clientX, clientY)`.
2. Considerar que un clic es válido solo si la distancia recorrida es inferior a `6px`:
```javascript
const dx = event.clientX - pointerDownPos.x;
const dy = event.clientY - pointerDownPos.y;
if (Math.sqrt(dx*dx + dy*dy) < 6) {
  // Realizar Raycast con raycaster.intersectObjects(objects, true)
}
```
3. Para hallar el objeto raíz en la jerarquía, recorrer la propiedad `.parent` hasta encontrar el elemento registrado en el arreglo global `objects`.

---

## 2. Inspección y Etiquetado Visual 3D (Three.js Popups & Inspector)
- Sincronizar el panel `#inspector-panel` o elementos flotantes directamente en la pantalla al seleccionar cualquier `Object3D`.
- Para cámaras CCTV (`userData.type === 'camera'`), desplegar opciones de FOV, alcance del cono de visión, enlace de video (stream URL) e imágenes de transmisión en vivo.
- Mantener la jerarquía de `TransformControls` deshabilitando `OrbitControls` durante el evento `dragging-changed`.

---

## 3. Edición Parcial de Archivos HTML/JS
Al realizar modificaciones en `Mapa3D.html` o cualquier archivo del proyecto:
- **NO reescribir todo el HTML con `write_to_file`**.
- Utilizar `replace_file_content` o `multi_replace_file_content` para realizar reemplazos quirúrgicos y precisos únicamente en las funciones o bloques que requieren cambios.
