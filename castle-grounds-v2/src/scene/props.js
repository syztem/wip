import * as THREE from 'three/webgpu';
import { sampleHeight } from './terrain.js';
import { mulberry32, hashSeed } from '../rand.js';

export function createProps() {
  const root = new THREE.Group();

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0xa8e4ff, roughness: 0.15, metalness: 0.05,
    emissive: 0x3a88aa, emissiveIntensity: 0.35,
    transparent: true, opacity: 0.72, side: THREE.DoubleSide,
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

  const flagMat = new THREE.MeshStandardMaterial({ color: 0xd02020, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
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

  const petalColors = [0xe02020, 0xf0d040, 0x3a6adf, 0xf4f4f4];
  const stemM = new THREE.MeshStandardMaterial({ color: 0x2f7a28, roughness: 0.8 });
  const headM = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const rng = mulberry32(hashSeed(0x5157));

  const spots = [];
  for (let i = 0; i < 48; i++) {
    const fx = (rng() - 0.5) * 28;
    const fz = 6 + rng() * 18;
    if (Math.abs(fx) < 3.2) continue;
    spots.push({ x: fx, z: fz, y: sampleHeight(fx, fz), color: petalColors[i % petalColors.length] });
  }
  const M = spots.length;

  const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.28, 5);
  const headGeo = new THREE.SphereGeometry(0.12, 8, 6);
  const stems = new THREE.InstancedMesh(stemGeo, stemM, M);
  const heads = new THREE.InstancedMesh(headGeo, headM, M);
  stems.castShadow = true; heads.castShadow = true;
  stems.frustumCulled = false; heads.frustumCulled = false;

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const color = new THREE.Color();

  for (let i = 0; i < M; i++) {
    const sp = spots[i];
    v.set(sp.x, sp.y + 0.16, sp.z); m4.compose(v, q, one); stems.setMatrixAt(i, m4);
    v.set(sp.x, sp.y + 0.32, sp.z); m4.compose(v, q, one); heads.setMatrixAt(i, m4);
    color.setHex(sp.color, THREE.SRGBColorSpace);
    heads.setColorAt(i, color);
  }
  stems.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
  root.add(stems, heads);

  return {
    group: root,
    waterfall: { position: sheet.position },
    update(t, world) {
      const wind = world?.weather?.windStrength ?? 0.5;
      const s = Math.sin((t / 30) * Math.PI * 2);
      for (const f of flags) f.rotation.y = 0.35 * s * (0.6 + wind * 0.9);
      waterMat.emissiveIntensity = 0.28 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.1));
      sheet.position.y = 7 + 0.08 * Math.sin(t * 1.7);
    },
  };
}
