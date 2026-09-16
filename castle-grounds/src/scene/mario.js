import * as THREE from 'three/webgpu';
import { CapsuleGeometry, CircleGeometry, TorusGeometry } from 'three';
import { sampleHeight } from './terrain.js';
import { wrap, wave, LOOP } from '../hour.js';
import { KEEP_Z, FRONT_Z } from './layout.js';

function mat(hex, { rough = 0.55, metal = 0 } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHex(hex, THREE.SRGBColorSpace),
    roughness: rough,
    metalness: metal,
  });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/** Piecewise path. Keys at t=0 and t=30 match. */
const KEYS = [
  { t: 0, z: 16.0, yaw: Math.PI },
  { t: 8, z: -10.0, yaw: Math.PI },
  { t: 12, z: KEEP_Z + FRONT_Z + 1.35, yaw: Math.PI },
  { t: 15, z: KEEP_Z + FRONT_Z + 1.35, yaw: Math.PI },
  { t: 17, z: KEEP_Z + FRONT_Z + 1.35, yaw: 0 },
  { t: 24, z: -10.0, yaw: 0 },
  { t: 28, z: 16.0, yaw: 0 },
  { t: 30, z: 16.0, yaw: Math.PI },
];

function samplePath(t) {
  const u = wrap(t);
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].t < u) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const f = (u - a.t) / Math.max(1e-6, b.t - a.t);
  const s = f * f * (3 - 2 * f);
  return {
    z: lerp(a.z, b.z, s),
    yaw: lerpAngle(a.yaw, b.yaw, s),
    moving: Math.abs(b.z - a.z) > 0.4,
  };
}

export function createMario() {
  const root = new THREE.Group();
  root.rotation.y = Math.PI;

  const red = mat(0xe01818, { rough: 0.42 });
  const blue = mat(0x1a3ea8, { rough: 0.48 });
  const skin = mat(0xf1b07a, { rough: 0.45 });
  const brown = mat(0x4a2c18, { rough: 0.6 });
  const white = mat(0xf4f4f4, { rough: 0.4 });
  const gold = mat(0xe6c14a, { rough: 0.3, metal: 0.4 });
  const black = mat(0x141414, { rough: 0.5 });
  const blueEye = mat(0x2a62d8, { rough: 0.3 });

  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), blue);
  hip.position.y = 0.62;
  hip.castShadow = true;
  root.add(hip);

  const torso = new THREE.Mesh(new CapsuleGeometry(0.28, 0.32, 6, 12), blue);
  torso.position.y = 0.98;
  torso.castShadow = true;
  root.add(torso);

  const shirt = new THREE.Mesh(new CapsuleGeometry(0.26, 0.12, 4, 10), red);
  shirt.position.y = 1.22;
  shirt.castShadow = true;
  root.add(shirt);

  for (const s of [-1, 1]) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), gold);
    btn.position.set(s * 0.1, 0.92, 0.26);
    root.add(btn);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
  head.position.y = 1.58;
  head.castShadow = true;
  root.add(head);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), red);
  cap.position.set(0, 1.7, 0);
  cap.castShadow = true;
  root.add(cap);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), red);
  brim.position.set(0, 1.58, 0.16);
  brim.rotation.x = -0.18;
  brim.scale.set(1, 1, 0.72);
  brim.castShadow = true;
  root.add(brim);
  const emblem = new THREE.Mesh(new CircleGeometry(0.07, 12), white);
  emblem.position.set(0, 1.82, 0.22);
  root.add(emblem);
  const letter = new THREE.Mesh(new TorusGeometry(0.028, 0.008, 6, 10), red);
  letter.position.set(0, 1.82, 0.225);
  root.add(letter);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.7), brown);
  hair.position.set(0, 1.52, -0.1);
  hair.scale.set(1.05, 0.7, 0.85);
  root.add(hair);

  for (const s of [-1, 1]) {
    const whiteEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), white);
    whiteEye.position.set(s * 0.09, 1.62, 0.22);
    root.add(whiteEye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blueEye);
    iris.position.set(s * 0.09, 1.62, 0.265);
    root.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), black);
    pupil.position.set(s * 0.09, 1.62, 0.3);
    root.add(pupil);

    const stache = new THREE.Mesh(new CapsuleGeometry(0.035, 0.1, 3, 6), brown);
    stache.position.set(s * 0.07, 1.48, 0.25);
    stache.rotation.z = s * 0.7;
    root.add(stache);

    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skin);
    ear.position.set(s * 0.27, 1.56, 0);
    root.add(ear);

    const arm = new THREE.Mesh(new CapsuleGeometry(0.08, 0.28, 4, 8), red);
    arm.position.set(s * 0.38, 1.08, 0.02);
    arm.rotation.z = s * 0.35;
    arm.castShadow = true;
    root.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), white);
    hand.position.set(s * 0.5, 0.86, 0.08);
    hand.castShadow = true;
    root.add(hand);

    const leg = new THREE.Mesh(new CapsuleGeometry(0.1, 0.28, 4, 8), blue);
    leg.position.set(s * 0.13, 0.38, 0);
    leg.castShadow = true;
    root.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), brown);
    shoe.position.set(s * 0.13, 0.08, 0.06);
    shoe.castShadow = true;
    root.add(shoe);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skin);
  nose.position.set(0, 1.54, 0.28);
  root.add(nose);

  return {
    group: root,
    update(t, bridge) {
      const pose = samplePath(t);
      const x = 0;
      const z = pose.z;
      let y = sampleHeight(x, z);
      if (bridge && z <= bridge.z1 && z >= bridge.z0) y = bridge.deckY;
      const bob = pose.moving ? 0.04 * wave(t, 16) : 0.02 * wave(t, 2);
      root.position.set(x, y + bob, z);
      root.rotation.y = pose.yaw;
    },
  };
}

export { LOOP };
