import * as THREE from 'three/webgpu';
import { Sprite } from 'three';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { ROSE_Y0, ROSE_H, WALL_T, FRONT_Z, KEEP_W, KEEP_D, KEEP_H } from './layout.js';

function makeMotes() {
  const group = new THREE.Group();
  const mat = new THREE.SpriteMaterial({
    color: 0xffe6c8,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const sprites = [];
  const rng = (i) => {
    const n = Math.sin(i * 127.1) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let i = 0; i < 280; i++) {
    const s = new Sprite(mat);
    const x = (rng(i) - 0.5) * 12;
    const y = 1.1 + rng(i + 3) * 13.2;
    const z = (rng(i + 7) - 0.5) * 16;
    s.position.set(x, y, z);
    s.scale.setScalar(0.028 + rng(i + 11) * 0.05);
    s.userData = {
      x, y, z,
      cx: 1 + (i % 3),
      cy: 1 + ((i * 3) % 3),
      cz: 1 + ((i * 5) % 2),
      px: rng(i + 17) * Math.PI * 2,
      py: rng(i + 19) * Math.PI * 2,
      pz: rng(i + 23) * Math.PI * 2,
    };
    group.add(s);
    sprites.push(s);
  }
  return {
    group,
    update(t) {
      const tau = t * 0.21;
      for (let i = 0; i < sprites.length; i++) {
        const s = sprites[i];
        const d = s.userData;
        s.position.set(
          d.x + 0.16 * Math.sin(tau * d.cx + d.px),
          d.y + 0.22 * Math.sin(tau * d.cy + d.py),
          d.z + 0.12 * Math.sin(tau * d.cz + d.pz),
        );
      }
    },
  };
}

function dressInterior(parent) {
  const floor = new THREE.MeshStandardMaterial({
    color: 0x6a4a2c,
    roughness: 0.82,
    metalness: 0.04,
  });
  const rug = new THREE.MeshStandardMaterial({
    color: 0x8b1e2d,
    roughness: 0.7,
    metalness: 0,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4b056,
    roughness: 0.32,
    metalness: 0.6,
  });
  const cream = new THREE.MeshStandardMaterial({
    color: 0xe8d2a8,
    roughness: 0.62,
    metalness: 0.05,
  });
  const bannerRed = new THREE.MeshStandardMaterial({
    color: 0xc42828,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const bannerGreen = new THREE.MeshStandardMaterial({
    color: 0x2f7a32,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: 0x5a3418,
    roughness: 0.7,
    metalness: 0.04,
  });

  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(KEEP_W - 3.2, 0.08, KEEP_D - 3.2),
    floor,
  );
  tile.position.set(0, 0.48, 0);
  tile.receiveShadow = true;
  parent.add(tile);

  const runner = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, KEEP_D - 5), rug);
  runner.position.set(0, 0.54, 0.4);
  runner.receiveShadow = true;
  parent.add(runner);

  const cols = [
    [-7.4, -6.2],
    [7.4, -6.2],
    [-7.4, 5.4],
    [7.4, 5.4],
  ];
  for (const [x, z] of cols) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, KEEP_H - 1.2, 10), cream);
    col.position.set(x, (KEEP_H - 1.2) * 0.5 + 0.4, z);
    col.castShadow = true;
    col.receiveShadow = true;
    parent.add(col);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.28, 10), gold);
    cap.position.set(x, KEEP_H - 0.55, z);
    parent.add(cap);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.28, 10), gold);
    base.position.set(x, 0.62, z);
    parent.add(base);
  }

  for (const [x, mat] of [[-KEEP_W * 0.5 + 1.55, bannerRed], [KEEP_W * 0.5 - 1.55, bannerGreen]]) {
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.2), mat);
    ban.position.set(x, 6.4, -1.2);
    ban.rotation.y = x < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    parent.add(ban);
  }

  const table = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 1.4), wood);
  table.position.set(0, 1.15, -4.2);
  table.castShadow = true;
  parent.add(table);
  for (const s of [-1.4, 1.4]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), wood);
    leg.position.set(s, 0.78, -4.2);
    parent.add(leg);
  }
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gold);
  bowl.position.set(0, 1.38, -4.2);
  bowl.scale.y = 0.45;
  parent.add(bowl);

  const throne = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.7), wood);
  throne.position.set(0, 1.35, -7.4);
  throne.castShadow = true;
  parent.add(throne);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.16), wood);
  back.position.set(0, 2.4, -7.7);
  parent.add(back);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.55), rug);
  cushion.position.set(0, 2.18, -7.35);
  parent.add(cushion);

  const chand = new THREE.Group();
  chand.position.set(0, 13.4, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 8, 24), gold);
  ring.rotation.x = Math.PI * 0.5;
  chand.add(ring);
  const hang = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), gold);
  hang.position.y = 1.1;
  chand.add(hang);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.28, 6),
      new THREE.MeshStandardMaterial({
        color: 0xfff4d0,
        emissive: 0xffcc77,
        emissiveIntensity: 0.7,
        roughness: 0.4,
      }),
    );
    candle.position.set(Math.cos(a) * 1.35, 0.2, Math.sin(a) * 1.35);
    chand.add(candle);
  }
  const chandLight = new THREE.PointLight(0xffd4a0, 6.5, 22, 1.6);
  chandLight.position.set(0, -0.2, 0);
  chand.add(chandLight);
  parent.add(chand);

  const torches = [];
  for (const [x, z] of [[-8.6, 2.8], [8.6, 2.8], [-8.6, -3.6], [8.6, -3.6]]) {
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.18), gold);
    sconce.position.set(x, 4.6, z);
    parent.add(sconce);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffaa44,
        emissive: 0xff8822,
        emissiveIntensity: 1.4,
        roughness: 0.4,
      }),
    );
    flame.position.set(x, 4.92, z);
    parent.add(flame);
    const light = new THREE.PointLight(0xff9944, 2.2, 9, 2);
    light.position.set(x, 5.05, z);
    parent.add(light);
    torches.push({ flame, light });
  }

  return { torches, chandLight };
}

export function createNave(parent) {
  THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
  const light = new THREE.RectAreaLight(0xffc8a0, 18, 4, 6);
  const roseMidY = ROSE_Y0 + ROSE_H * 0.5;
  const innerZ = FRONT_Z - WALL_T - 0.15;
  light.position.set(0, roseMidY, innerZ);
  parent.add(light);

  const dress = dressInterior(parent);
  const motes = makeMotes();
  parent.add(motes.group);
  return {
    light,
    update(t) {
      motes.update(t);
      for (let i = 0; i < dress.torches.length; i++) {
        const flicker = 1.6 + 0.55 * Math.sin(t * 7.3 + i * 1.7) + 0.25 * Math.sin(t * 13 + i);
        dress.torches[i].light.intensity = flicker;
        dress.torches[i].flame.scale.setScalar(0.85 + 0.18 * Math.sin(t * 9 + i));
      }
      dress.chandLight.intensity = 6.2 + 0.4 * Math.sin(t * 2.2);
    },
  };
}
