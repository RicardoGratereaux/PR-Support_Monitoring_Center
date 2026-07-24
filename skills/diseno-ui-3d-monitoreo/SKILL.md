---
name: diseno-ui-3d-monitoreo
description: Guía de métricas de diseño UI/UX Catppuccin, componentes glassmorphism, creador de prefabs y patrones 3D para la app.
---

# Skill: Diseño UI/UX y Sistema de Prefabs 3D

Esta skill define la paleta oficial de colores (Catppuccin Macchiato/Mocha), reglas de componentes y el motor de elementos preconstruidos (Prefabs) para la herramienta 3D.

---

## 1. Paleta Oficial de Colores de la App (Variables CSS)

```css
:root {
  --bg-main: #11111b;
  --glass-bg: #1e1e2e;
  --glass-bg-hover: #313244;
  --glass-border: #45475a;
  --glass-border-focus: #f9e2af;
  --text-main: #cdd6f4;
  --text-muted: #bac2de;
  --accent-primary: #f9e2af;
  --sapphire: #74c7ec;
  --blue: #89b4fa;
  --teal: #94e2d5;
  --success: #a6e3a1;
  --danger: #f38ba8;
}
```

---

## 2. Catálogo Extendido de Elementos 3D

1. **Arquitectura y Exteriores**:
   - 🧱 Pared / Muro
   - 🏛️ Columna Soporte
   - 🚪 Puerta de Cristal
   - 🅿️ Área de Parking / Estacionamiento
   - 🌳 Árbol / Planta Decorativa
2. **Mobiliario Comercial**:
   - 🛒 Góndola Doble Central
   - 📚 Estante Pared Alta
   - 💳 Caja Registradora POS
   - 🏢 Escritorio de Oficina / Administración
   - 🪑 Mesas y Asientos
   - 🛒 Stack de Carritos de Compra
   - ❄️ Nevera Exhibidora
   - 🏷️ Isla Promocional
   - 📦 Cajas / Tarima de Almacén
3. **Cámaras CCTV**:
   - 📹 Cámara Bullet CCTV con brazo y visera.

---

## 3. Creador de Elementos Preconstruidos (Prefabs)

Permite seleccionar cualquier objeto o combinación en la escena 3D y guardarlo con un nombre personalizado en `localStorage` o memoria para reutilizarlo libremente desde la pestaña **"Personalizados"**.
