import * as THREE from 'three/webgpu';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

function domeSky(world) {
  const radius = 1200;
  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
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

  const zenith = new THREE.Color();
  const horizon = new THREE.Color();
  const ground = new THREE.Color();
  const c = new THREE.Color();

  function update() {
    zenith.copy(world.palette.skyColor);
    horizon.copy(world.palette.bgColor).lerp(world.palette.skyColor, 0.35);
    ground.copy(world.palette.groundColor);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / radius;
      if (y > 0) c.copy(horizon).lerp(zenith, Math.min(1, y * 1.15));
      else c.copy(horizon).lerp(ground, Math.min(1, -y * 0.85));
      c.toArray(colors, i * 3);
    }
    geo.attributes.color.needsUpdate = true;
  }
  update();
  return { mesh, update };
}

export function createSky({ useMesh = true, world } = {}) {
  if (!world) throw new Error('createSky: world is required');
  if (useMesh) {
    try {
      const sky = new SkyMesh();
      sky.scale.setScalar(450000);
      sky.mieCoefficient.value = 0.0045;
      sky.mieDirectionalG.value = 0.82;
      sky.cloudCoverage.value = 0.36;
      sky.cloudDensity.value = 0.3;
      sky.cloudElevation.value = 0.44;
      sky.showSunDisc.value = true;
      if (sky.material) sky.material.fog = false;
      function update() {
        sky.turbidity.value = Math.max(0.5, world.palette.turbidity);
        sky.rayleigh.value = world.palette.rayleigh;
        sky.sunPosition.value.copy(world.sunDir);
        sky.cloudCoverage.value = world.weather.cloudCoverage;
        sky.cloudDensity.value = world.weather.cloudDensity;
      }
      update();
      return { mesh: sky, update };
    } catch (e) {
      console.warn('SkyMesh miss', e);
    }
  }
  return domeSky(world);
}
