import * as THREE from 'three/webgpu';
import { sampleHeight } from './terrain.js';

export function createProps() {
  const root = new THREE.Group();

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

  const flags = [];
  const flagSpecs = [
    [-12.5, -47, 0xd02020],
    [12.5, -47, 0x2f9e32],
  ];
  for (const [x, z, hex] of flagSpecs) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.5, metalness: 0.2 }),
    );
    pole.position.set(x, 30.2, z);
    root.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.5,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    );
    flag.position.set(x + 0.85, 31.6, z);
    root.add(flag);
    flags.push(flag);
  }

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

  const bedX = 8.1;
  const bedZ = 11.5;
  const wilt = new THREE.MeshStandardMaterial({ color: 0x6a7a2a, roughness: 0.85 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 0.55 + (i % 3) * 0.22;
    const fx = bedX + Math.cos(a) * r;
    const fz = bedZ + Math.sin(a) * r * 0.8;
    const fy = sampleHeight(fx, fz);
    const h = 0.18 + (i % 4) * 0.04;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5), wilt);
    stem.position.set(fx, fy + h * 0.5, fz);
    stem.rotation.z = (i % 2 ? 0.35 : -0.28);
    stem.castShadow = true;
    root.add(stem);
    const head2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 7, 6),
      new THREE.MeshStandardMaterial({
        color: petalColors[i % petalColors.length],
        roughness: 0.62,
        emissive: petalColors[i % petalColors.length],
        emissiveIntensity: 0.03,
      }),
    );
    head2.position.set(fx + (i % 2 ? 0.06 : -0.05), fy + h + 0.04, fz);
    head2.castShadow = true;
    root.add(head2);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.05, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.8 }),
  );
  ring.rotation.x = Math.PI * 0.5;
  ring.position.set(bedX, sampleHeight(bedX, bedZ) + 0.04, bedZ);
  root.add(ring);

  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x2f8a3a, roughness: 0.7 });
  const bloomMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.45,
    emissive: 0xffe8f0,
    emissiveIntensity: 0.08,
  });
  const lilies = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.4;
    const r = 18 + (i % 4) * 2.1;
    const lx = Math.cos(a) * r;
    const lz = -38 + Math.sin(a) * r;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 10), lilyMat);
    pad.position.set(lx, -0.95, lz);
    root.add(pad);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), bloomMat);
    flower.position.set(lx, -0.86, lz);
    root.add(flower);
    lilies.push(pad);
  }

  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xf0c14a,
    roughness: 0.28,
    metalness: 0.7,
    emissive: 0xaa7700,
    emissiveIntensity: 0.18,
  });
  const coins = [];
  const coinSpots = [[-3.2, 12.5], [3.4, 11.2], [-2.6, 8.4], [2.8, 6.6], [-4.1, 4.8]];
  for (const [cx, cz] of coinSpots) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), coinMat);
    coin.rotation.x = Math.PI * 0.5;
    const y = sampleHeight(cx, cz) + 0.85;
    coin.position.set(cx, y, cz);
    coin.castShadow = true;
    root.add(coin);
    coins.push(coin);
  }

  const birdMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e4, roughness: 0.6 });
  const birds = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 5), birdMat);
    b.rotation.x = Math.PI * 0.5;
    root.add(b);
    birds.push({ mesh: b, phase: i * 1.1, radius: 10 + i * 1.4, height: 8 + (i % 3) * 1.6 });
  }

  return {
    group: root,
    waterfall: sheet,
    update(t, world) {
      const gust = world ? world.weather.windStrength : 1;
      const s = Math.sin(t * 1.3);
      for (const f of flags) f.rotation.y = 0.28 * s * gust;
      waterMat.emissiveIntensity = 0.28 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.1));
      sheet.position.y = 7 + 0.08 * Math.sin(t * 1.7);
      for (let i = 0; i < coins.length; i++) {
        coins[i].rotation.z = t * 1.6 + i;
        coins[i].position.y = sampleHeight(coins[i].position.x, coins[i].position.z) + 0.85 + 0.12 * Math.sin(t * 2 + i);
      }
      for (const b of birds) {
        const a = t * 0.28 + b.phase;
        b.mesh.position.set(Math.cos(a) * b.radius, b.height + Math.sin(t * 1.4 + b.phase) * 0.4, -20 + Math.sin(a) * b.radius * 0.6);
        b.mesh.rotation.y = -a;
      }
      for (let i = 0; i < lilies.length; i++) {
        lilies[i].position.y = -0.95 + 0.03 * Math.sin(t * 1.1 + i);
      }
    },
  };
}
