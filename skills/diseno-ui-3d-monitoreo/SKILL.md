---
name: diseno-ui-3d-monitoreo
description: Guía de métricas de diseño UI/UX, componentes glassmorphism, menús desplegables (dropdowns) y patrones de integración Three.js 3D para el Centro de Monitoreo.
---

# Skill: Diseño UI/UX y Menús de Herramientas 3D

Esta skill establece las métricas de diseño, tokens de interfaz y arquitectura de menús organizados (Dropdowns, Glassmorphism, Toolbars) para la herramienta de Mapeo 3D del Centro de Monitoreo.

---

## 1. Métricas de Diseño y Jerarquía de Interfaz

### Reglas de Layout y Organización de Herramientas
1. **Evitar Saturación Horizontal**: No colocar más de 4-5 botones de acción sueltos en la barra principal. Agrupar funcionalidades relacionadas mediante menús desplegables (`Dropdowns`).
2. **Jerarquía Visual por Categorías**:
   - 🏗️ **Arquitectura**: Estructuras físicas del local (Paredes, Columnas, Entradas).
   - 🛒 **Mobiliario**: Elementos comerciales (Góndolas, Cajas, Neveras, Islas).
   - 📹 **Seguridad**: Equipos CCTV y conos de cobertura.
   - 📐 **Gizmos**: Controles de manipulación (Mover, Rotar, Escalar).
3. **Z-Index y Acople con Navbar**:
   - `Navbar Global (.top-bar)`: `z-index: 99` (Altura: `50px`).
   - `Toolbar 3D (.mapa3d-toolbar)`: `z-index: 50` con `margin-top: 50px`.
   - `Dropdowns (.dropdown-content)`: `z-index: 150` con `backdrop-filter: blur(16px)`.

---

## 2. Patrón de Dropdown Glassmorphic (HTML/CSS)

```html
<div class="tool-dropdown">
  <button class="btn-tool dropdown-trigger">
    <span class="material-symbols-outlined">storefront</span> Mobiliario <span class="arrow">▼</span>
  </button>
  <div class="dropdown-menu">
    <button onclick="addStructure('gondola_doble')">Góndola Doble</button>
    <button onclick="addStructure('mostrador')">Caja POS</button>
  </div>
</div>
```

```css
.tool-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 6px;
  min-width: 180px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.6);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 150;
}

.tool-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(2px);
}
```
