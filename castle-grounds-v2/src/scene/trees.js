import * as THREE from 'three/webgpu';
import { barkMap, leafMap } from '../textures.js';
import { sampleHeight } from './terrain.js';

const SPOTS = [
  [-9.5, 18, 1.05], [10.2, 17.5, 1.12], [-16, 12, 1.35], [17.5, 11, 1.28],
  [-14, 26, 0.95], [15, 27, 1.0], [-22, 8, 1.45], [23, 7, 1.4],
  [-20, 22, 1.15], [21, 21, 1.2], [-28, 16, 1.55], [29, 14, 1.5],
  [-11, 32, 0.88], [12, 33, 0.9], [-32, 2, 1.7], [33, 0, 1.65],
  [-24, -6, 1.25], [26, -8, 1.3],
];

const CANOPY = [
  { r: 1.55, x: 0.00, y: 3.60, z: 0.00 },
  { r: 1.15, x: 0.55, y: 4.15, z: 0.20 },
  { r: 1.10, x: -0.50, y: 4.05, z: -0.25 },
  { r: 0.95, x: 0.15, y: 5.05, z: -0.10 },
];

function trunkGeometry() {
  const g = new THREE.CylinderGeometry(0.28, 0.42, 3.2, 8);
  g.translate(0, 1.6, 0);
  return g;
}
function canopyGeometry({ r, x, y, z }) {
  const g = new THREE.SphereGeometry(r, 10, 8);
  g.translate(x, y, z);
  return g;
}

export function createTrees() {
  const root = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ map: barkMap(), roughness: 0.9, metalness: 0 });
  const leaf = new THREE.MeshStandardMaterial({ map: leafMap(), roughness: 0.72, metalness: 0, color: 0x2a8a34 });

  const N = SPOTS.length;
  const trunkIM = new THREE.InstancedMesh(trunkGeometry(), bark, N);
  const canopyIM = CANOPY.map((c) => new THREE.InstancedMesh(canopyGeometry(c), leaf, N));

  for (const im of [trunkIM, ...canopyIM]) {
    im.castShadow = true; im.receiveShadow = true;
    im.frustumCulled = false;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(im);
  }

  const basePos = new Array(N);
  const baseYaw = new Float32Array(N);
  const baseScale = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const [x, z, s] = SPOTS[i];
    basePos[i] = new THREE.Vector3(x, sampleHeight(x, z), z);
    baseYaw[i] = (x * 12.7 + z) * 0.13;
    baseScale[i] = s;
  }

  const m4 = new THREE.Matrix4();
  const qY = new THREE.Quaternion();
  const qZ = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  const axisY = new THREE.Vector3(0, 1, 0);
  const axisZ = new THREE.Vector3(0, 0, 1);

  function writeInstances(im, sway) {
    for (let i = 0; i < N; i++) {
      qY.setFromAxisAngle(axisY, baseYaw[i]);
      if (sway !== 0) {
        qZ.setFromAxisAngle(axisZ, sway * (i % 2 === 0 ? 1 : -1));
        qY.multiply(qZ);
      }
      v.copy(basePos[i]);
      s.setScalar(baseScale[i]);
      m4.compose(v, qY, s);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
  }

  writeInstances(trunkIM, 0);

  return {
    group: root,
    update(t, world) {
      const wind = world?.weather?.windStrength ?? 0.5;
      const sway = Math.sin((t / 30) * Math.PI * 2) * 0.018 * (0.6 + wind * 0.9);
      for (const im of canopyIM) writeInstances(im, sway);
    },
  };
}
