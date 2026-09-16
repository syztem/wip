import * as THREE from 'three/webgpu';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

export function createSky() {
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

  const sunDir = new THREE.Vector3();
  const elevation = 46;
  const azimuth = 28;
  sunDir.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevation),
    THREE.MathUtils.degToRad(azimuth),
  );
  sky.sunPosition.value.copy(sunDir);

  return { mesh: sky, sunDir };
}
