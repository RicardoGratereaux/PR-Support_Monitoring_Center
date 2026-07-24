# Skill: Monitoreo Mapa de Calor y Análisis Geométrico de CCTV

Esta skill proporciona las directivas para implementar mapas de calor (Heatmaps) de alta definición en Three.js y tableros visuales de cobertura de seguridad para el Centro de Monitoreo.

## Principios de Diseño para Mapa de Calor 3D en Three.js:

1. **Resolución y Filtrado Suave**:
   - Generar canvas con resolución suficiente (e.g. 200x150 píxeles).
   - Utilizar gradientes radiales por cámara basados en la posición 3D (`getWorldPosition`), orientación vector 3D (`applyQuaternion`) y ángulo FOV.
   - Usar `THREE.LinearFilter` en la textura `CanvasTexture` para difuminar transiciones suaves y estéticas entre áreas cubiertas y puntos ciegos.

2. **Paleta de Colores Catppuccin Monitoreo**:
   - **Áreas Protegidas (Cobertura Alta)**: Esmeralda Teal (`rgba(148, 226, 213, 0.65)` a `rgba(166, 227, 161, 0.85)`).
   - **Puntos Ciegos / Desprotegidos**: Rosa Coral / Magenta (`rgba(243, 139, 168, 0.55)`).
   - **Transición**: Lavanda / Zafiro suave (`rgba(116, 199, 236, 0.4)`).

3. **Interacción y Leyenda Flotante**:
   - Ofrecer un HUD o barra de control para el mapa de calor con deslizador de opacidad (0% a 100%) y botón para desactivar el mapa de calor.
   - Regenerar dinámicamente la textura cada vez que las cámaras sean modificadas o cuando se invoque la función.
