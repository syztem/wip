import * as THREE from 'three/webgpu';
import { sampleHeight } from './terrain.js';

export function createProps() {
  const root = new THREE.Group();

  // waterfall — right of keep
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0xa8e4ff,
    roughness: 0.15,
    metalness: 0.05,
    emissive: 0x3a88aa,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 16, 1, 8), waterMat);
  sheet.position.set(22, 7, -36);
  sheet.rotation.y = -0.4;
  root.add(sheet);
  const foam = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xeef8ff, roughness: 0.8, emissive: 0xaad4ee, emissiveIntensity: 0.2 }),
  );
  foam.position.set(21.2, 0.4, -34.5);
  foam.scale.set(1.4, 0.45, 1.2);
  root.add(foam);

  // flags — loop-safe spin via sin
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xd02020,
    roughness: 0.5,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const flags = [];
  for (const [x, z] of [[-12.5, -47], [12.5, -47]]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.5, metalness: 0.2 }),
    );
    pole.position.set(x, 30.2, z);
    root.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), flagMat);
    flag.position.set(x + 0.85, 31.6, z);
    root.add(flag);
    flags.push(flag);
  }

  // flowers — N64-round, remaster materials
  const petalColors = [0xe02020, 0xf0d040, 0x3a6adf, 0xf4f4f4];
  const stemM = new THREE.MeshStandardMaterial({ color: 0x2f7a28, roughness: 0.8 });
  const rng = (i) => {
    const n = Math.sin(i * 127.1) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let i = 0; i < 48; i++) {
    const fx = (rng(i) - 0.5) * 28;
    const fz = 6 + rng(i + 9) * 18;
    if (Math.abs(fx) < 3.2) continue;
    const fy = sampleHeight(fx, fz);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.28, 5), stemM);
    stem.position.set(fx, fy + 0.16, fz);
    stem.castShadow = true;
    root.add(stem);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({
        color: petalColors[i % petalColors.length],
        roughness: 0.5,
        emissive: petalColors[i % petalColors.length],
        emissiveIntensity: 0.08,
      }),
    );
    head.position.set(fx, fy + 0.32, fz);
    head.castShadow = true;
    root.add(head);
  }

  return {
    group: root,
    update(t) {
      const s = Math.sin((t / 30) * Math.PI * 2);
      for (const f of flags) f.rotation.y = 0.35 * s;
    },
  };
}
