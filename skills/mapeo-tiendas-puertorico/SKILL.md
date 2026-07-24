---
name: mapeo-tiendas-puertorico
description: Estándares de gestión de cadenas comerciales (Farmacias Rey, Chinatown & More, Exchange by Figna), configuración de cámaras CCTV y persistencia en Google Apps Script.
---

# Skill: Mapeo de Cadenas de Tiendas y Cámaras CCTV

Esta skill define la gestión estructurada de tiendas de Puerto Rico y la configuración de cobertura CCTV en 3D.

---

## 1. Cadenas Comerciales y Codificación

| Cadena | Prefijo Código | Descripción / Enfoque |
|---|---|---|
| **Farmacias Rey** | `FR-XX` | Farmacias y retail de salud (ej: `FR-01 LITHEDA`, `FR-08 HUMACAO`). |
| **Chinatown & More** | `CT-XX` | Tiendas por departamento y mercancía variada (ej: `CT-01 ARECIBO`, `CT-14 PONCE`). |
| **Exchange by Figna** | `QTD-XX` | Centros de cambio y servicios financieros (ej: `QTD-01 CAROLINA`, `QTD-09 MAYAGUEZ`). |

---

## 2. Parámetros Técnicos de Cámaras CCTV 3D

1. **Geometría 3D**:
   - Modelo procedural CCTV Bullet con base, brazo orientable, cuerpo cilíndrico, visera parasol y lente frontal.
   - Indicador de estado LED en color Verde (Activa) o Rojo (Fallo).
2. **Cono de Visión (Frustum)**:
   - Ángulo de apertura (FOV): Ajustable de $20^\circ$ a $120^\circ$.
   - Alcance de distancia: Ajustable de $3\text{m}$ a $25\text{m}$.
   - Renderizado en wireframe semitransparente (`opacity: 0.35`).
3. **Persistencia por Sucursal**:
   - Clave única de almacenamiento en Apps Script `PropertiesService`: `MAPA_3D_<ID_TIENDA>`.
