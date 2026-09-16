import * as THREE from 'three/webgpu';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

function sunVector() {
  const sunDir = new THREE.Vector3();
  sunDir.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - 46),
    THREE.MathUtils.degToRad(28),
  );
  return sunDir;
}

function domeSky() {
  const radius = 1200;
  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const zenith = new THREE.Color(0x5ea0d8);
  const horizon = new THREE.Color(0xc8e4f4);
  const ground = new THREE.Color(0x8fbc7a);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius;
    if (y > 0) c.copy(horizon).lerp(zenith, Math.min(1, y * 1.15));
    else c.copy(horizon).lerp(ground, Math.min(1, -y * 0.85));
    c.toArray(colors, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return mesh;
}

export function createSky({ useMesh = true } = {}) {
  const sunDir = sunVector();
  if (useMesh) {
    try {
      const sky = new SkyMesh();
      sky.scale.setScalar(450000);
      sky.turbidity.value = 5.5;
      sky.rayleigh.value = 2.35;
      sky.mieCoefficient.value = 0.0045;
      sky.mieDirectionalG.value = 0.82;
      sky.cloudCoverage.value = 0.36;
      sky.cloudDensity.value = 0.3;
      sky.cloudElevation.value = 0.44;
      sky.showSunDisc.value = true;
      if (sky.material) sky.material.fog = false;
      sky.sunPosition.value.copy(sunDir);
      return { mesh: sky, sunDir };
    } catch (e) {
      console.warn('SkyMesh miss', e);
    }
  }
  return { mesh: domeSky(), sunDir };
}
