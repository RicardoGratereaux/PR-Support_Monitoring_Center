/**
 * MÓDULO DE ANÁLISIS GEOMÉTRICO Y MAPAS DE CALOR CCTV (CENTRO DE MONITOREO)
 * Sistema escalable e independiente para cálculo de cobertura 3D y conos de visión.
 */

window.CCTVAnalytics = (function() {
  /**
   * Calcula el porcentaje de cobertura y puntos ciegos basado en la posición 3D,
   * orientación (quaternion/dirección) y apertura (FOV) de cada cámara active.
   */
  function calcularCoberturaTienda(cams, ancho = 40, largo = 30) {
    const minX = -ancho / 2, maxX = ancho / 2, stepX = 1.0;
    const minZ = -largo / 2, maxZ = largo / 2, stepZ = 1.0;

    let totalPuntos = 0;
    let puntosCubiertos = 0;

    const gridRows = Math.floor((maxZ - minZ) / stepZ);
    const gridCols = Math.floor((maxX - minX) / stepX);
    const gridData = [];

    const camData = cams.map(cam => {
      const worldPos = new THREE.Vector3();
      cam.getWorldPosition(worldPos);

      const worldDir = new THREE.Vector3(0, 0, 1);
      worldDir.applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion())).normalize();

      const fov = cam.userData.fov || 60;
      const halfFovRad = ((fov * 0.5) * Math.PI) / 180;
      const maxDist = cam.userData.dist || 8;
      const rotY = Math.atan2(worldDir.x, worldDir.z);

      return { worldPos, worldDir, fov, halfFovRad, maxDist, rotY };
    });

    for (let r = 0; r < gridRows; r++) {
      const row = [];
      const z = minZ + r * stepZ + stepZ / 2;
      for (let c = 0; c < gridCols; c++) {
        const x = minX + c * stepX + stepX / 2;
        totalPuntos++;

        const pt = new THREE.Vector3(x, 0, z);
        let cubierto = false;

        for (let i = 0; i < camData.length; i++) {
          const cd = camData[i];
          const vecToPt = pt.clone().sub(cd.worldPos);
          const dist = vecToPt.length();

          if (dist <= cd.maxDist) {
            const dirToPt = vecToPt.normalize();
            const dot = dirToPt.dot(cd.worldDir);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
            if (angle <= cd.halfFovRad) {
              cubierto = true;
              break;
            }
          }
        }

        if (cubierto) puntosCubiertos++;
        row.push(cubierto);
      }
      gridData.push(row);
    }

    const porcentaje = totalPuntos > 0 ? Math.round((puntosCubiertos / totalPuntos) * 100) : 0;
    const superficieTotal = ancho * largo;
    const superficieCubierta = Math.round(superficieTotal * (porcentaje / 100));

    return {
      porcentaje,
      puntosCubiertos,
      totalPuntos,
      superficieTotal,
      superficieCubierta,
      superficieCiega: superficieTotal - superficieCubierta,
      camsCount: cams.length,
      camData,
      gridCols,
      gridRows,
      gridData,
      ancho,
      largo
    };
  }

  /**
   * Genera una textura de mapa de calor 2D para Three.js donde los conos de luz
   * se orientan y rotan en la dirección exacta hacia la que apunta la cámara
   * y se acotan de manera realista contra obstáculos / paredes en la escena 3D.
   */
  function generarTexturaMapaCalor(cams, ancho = 40, largo = 30, targets = []) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Fondo base de Puntos Ciegos (Rosa Coral)
    ctx.fillStyle = 'rgba(243, 139, 168, 0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const raycaster = new THREE.Raycaster();
    const doubleSideSaved = new Map();
    if (targets && targets.length > 0) {
      targets.forEach(o => {
        o.traverse(child => {
          if (child.isMesh && child.material) {
            doubleSideSaved.set(child.material, child.material.side);
            child.material.side = THREE.DoubleSide;
          }
        });
      });
    }

    cams.forEach(cam => {
      if (!cam.visible) return;

      const worldPos = new THREE.Vector3();
      cam.getWorldPosition(worldPos);

      const camWorldQuat = new THREE.Quaternion();
      cam.getWorldQuaternion(camWorldQuat);

      const fov = cam.userData.fov || 60;
      const maxDist = cam.userData.dist || 8;
      const numRays = 36; // 36 rayos radiales acotados por paredes

      // Coordenadas en canvas
      const cx = ((worldPos.x + (ancho / 2)) / ancho) * canvas.width;
      const cy = ((worldPos.z + (largo / 2)) / largo) * canvas.height;
      const maxRadiusPx = (maxDist / ancho) * canvas.width;

      const halfFovRad = ((fov * 0.5) * Math.PI) / 180;
      const tanFov = Math.tan(halfFovRad);

      const polygonPoints = [];

      for (let i = 0; i <= numRays; i++) {
        const frac = i / numRays;
        const currentAngleInFov = -halfFovRad + frac * (halfFovRad * 2);

        const dirLocal = new THREE.Vector3(
          Math.sin(currentAngleInFov) * tanFov,
          0,
          Math.cos(currentAngleInFov)
        ).normalize();

        const dirWorld = dirLocal.clone().applyQuaternion(camWorldQuat).normalize();

        let effectiveDist = maxDist;
        if (targets && targets.length > 0) {
          raycaster.set(worldPos, dirWorld);
          raycaster.near = 0.05;
          raycaster.far = maxDist;
          const hits = raycaster.intersectObjects(targets, true);
          if (hits.length > 0) {
            effectiveDist = Math.max(0.2, hits[0].distance - 0.08);
          }
        }

        const hitWorldPos = worldPos.clone().add(dirWorld.multiplyScalar(effectiveDist));
        const px = ((hitWorldPos.x + (ancho / 2)) / ancho) * canvas.width;
        const py = ((hitWorldPos.z + (largo / 2)) / largo) * canvas.height;

        polygonPoints.push({ x: px, y: py });
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      polygonPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadiusPx);
      grad.addColorStop(0, 'rgba(148, 226, 213, 0.9)');
      grad.addColorStop(0.7, 'rgba(116, 199, 236, 0.65)');
      grad.addColorStop(1, 'rgba(148, 226, 213, 0)');

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });

    doubleSideSaved.forEach((origSide, mat) => {
      mat.side = origSide;
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  return {
    calcularCoberturaTienda,
    generarTexturaMapaCalor
  };
})();
