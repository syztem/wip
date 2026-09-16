import * as THREE from 'three/webgpu';
import { CatmullRomCurve3 } from 'three';
import { LOOP } from './hour.js';
import { KEEP_Z, FRONT_Z } from './scene/layout.js';

export { LOOP };

/**
 * Closed Catmull-Rom. Camera goes in.
 * Beats: figure → bridge → rose outside → door thread → nave look-up → well → aerial → settle.
 */
export function createFlyby(camera) {
  const doorZ = KEEP_Z + FRONT_Z;
  const pts = [
    new THREE.Vector3(0.35, 1.78, 18.4),
    new THREE.Vector3(0.2, 2.15, 4.0),
    new THREE.Vector3(0.15, 2.45, -10.5),
    new THREE.Vector3(0.08, 2.55, -22.2),
    new THREE.Vector3(0.04, 2.42, doorZ + 0.35),
    new THREE.Vector3(0.02, 2.55, doorZ - 2.8),
    new THREE.Vector3(-0.4, 4.8, KEEP_Z + 2.2),
    new THREE.Vector3(0.6, 6.4, KEEP_Z - 4.5),
    new THREE.Vector3(-2.2, 5.2, KEEP_Z - 6.0),
    new THREE.Vector3(14.5, 19.5, KEEP_Z + 16),
    new THREE.Vector3(20.0, 14.0, 18.0),
    new THREE.Vector3(6.2, 7.4, 32.0),
  ];
  const looks = [
    new THREE.Vector3(0.0, 3.4, 16.2),
    new THREE.Vector3(0.0, 4.2, -18.0),
    new THREE.Vector3(0.0, 6.0, -28.0),
    new THREE.Vector3(0.0, 12.2, doorZ),
    new THREE.Vector3(0.0, 6.5, KEEP_Z),
    new THREE.Vector3(0.0, 8.0, KEEP_Z - 4),
    new THREE.Vector3(0.0, 12.4, doorZ - 0.4),
    new THREE.Vector3(0.2, 12.0, doorZ),
    new THREE.Vector3(1.2, 10.5, doorZ - 1),
    new THREE.Vector3(0.0, 12.0, KEEP_Z),
    new THREE.Vector3(0.0, 10.0, KEEP_Z + 8),
    new THREE.Vector3(0.0, 9.2, KEEP_Z + 12),
  ];

  const posCurve = new CatmullRomCurve3(pts, true, 'catmullrom', 0.08);
  const lookCurve = new CatmullRomCurve3(looks, true, 'catmullrom', 0.08);
  const p = new THREE.Vector3();
  const l = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  return {
    duration: LOOP,
    apply(t) {
      const u = (((t % LOOP) + LOOP) % LOOP) / LOOP;
      posCurve.getPointAt(u, p);
      lookCurve.getPointAt(u, l);
      camera.position.copy(p);
      camera.up.copy(up);
      camera.lookAt(l);
    },
  };
}
