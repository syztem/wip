import * as THREE from 'three/webgpu';
import { CatmullRomCurve3 } from 'three';

export const LOOP = 30;

/**
 * Closed Catmull-Rom flyby. u=0 and u=1 share pose.
 * Beats: plumber over-shoulder → bridge → facade glass → right tower → aerial → settle.
 */
export function createFlyby(camera) {
  const pts = [
    new THREE.Vector3(0.2, 1.72, 24.8),
    new THREE.Vector3(3.4, 2.35, 16.5),
    new THREE.Vector3(-12.8, 4.6, 13.2),
    new THREE.Vector3(-5.4, 3.1, 5.8),
    new THREE.Vector3(0.0, 3.55, 3.2),
    new THREE.Vector3(0.15, 4.4, -8.5),
    new THREE.Vector3(5.2, 9.4, -18.0),
    new THREE.Vector3(16.5, 20.0, -24.0),
    new THREE.Vector3(24.0, 15.5, -40.0),
    new THREE.Vector3(6.0, 32.0, -6.0),
    new THREE.Vector3(18.5, 20.5, 34.0),
    new THREE.Vector3(5.0, 7.2, 36.5),
  ];
  const looks = [
    new THREE.Vector3(0.0, 9.2, -32.0),
    new THREE.Vector3(0.2, 8.4, -34.0),
    new THREE.Vector3(3.0, 11.0, -26.0),
    new THREE.Vector3(0.0, 5.4, -18.0),
    new THREE.Vector3(0.0, 6.8, -30.0),
    new THREE.Vector3(0.0, 11.5, -40.0),
    new THREE.Vector3(0.0, 17.5, -42.0),
    new THREE.Vector3(-1.0, 18.0, -40.0),
    new THREE.Vector3(-4.0, 12.0, -36.0),
    new THREE.Vector3(0.0, 8.0, -18.0),
    new THREE.Vector3(0.0, 10.0, -16.0),
    new THREE.Vector3(0.0, 9.0, -28.0),
  ];

  const posCurve = new CatmullRomCurve3(pts, true, 'catmullrom', 0.14);
  const lookCurve = new CatmullRomCurve3(looks, true, 'catmullrom', 0.14);
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
