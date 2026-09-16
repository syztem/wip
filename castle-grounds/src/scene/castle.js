import * as THREE from 'three/webgpu';
import { ConeGeometry } from 'three';
import { stoneMap, roofMap, glassMap } from '../textures.js';

function box(mat, w, h, d, x, y, z, parent, shadows = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (shadows) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  parent.add(m);
  return m;
}

function cone(mat, r, h, x, y, z, parent) {
  const m = new THREE.Mesh(new ConeGeometry(r, h, 8), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function createCastle(env) {
  const root = new THREE.Group();
  root.position.set(0, 0, -38);

  const stone = new THREE.MeshStandardMaterial({
    map: stoneMap(),
    roughness: 0.78,
    metalness: 0.02,
    color: 0xf3e6cc,
  });
  const stoneDark = new THREE.MeshStandardMaterial({
    color: 0x6a5844,
    roughness: 0.9,
    metalness: 0,
  });
  const roof = new THREE.MeshStandardMaterial({
    map: roofMap(),
    roughness: 0.55,
    metalness: 0.04,
    color: 0xd03030,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe6c35c,
    roughness: 0.28,
    metalness: 0.65,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    map: glassMap(),
    color: 0xffffff,
    metalness: 0,
    roughness: 0.08,
    transmission: 0.82,
    thickness: 0.35,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
    attenuationColor: new THREE.Color().setHex(0xc45a88, THREE.SRGBColorSpace),
    attenuationDistance: 0.8,
    envMap: env || null,
    envMapIntensity: 1.1,
  });

  // keep
  box(stone, 28, 16, 22, 0, 8, 0, root);
  // plinth
  box(stone, 32, 2.2, 26, 0, 1.1, 1.2, root);
  // upper band
  box(stone, 22, 8, 16, 0, 18, -1, root);
  // center tower
  box(stone, 10, 18, 10, 0, 28, -1, root);
  cone(roof, 8.2, 9, 0, 41.5, -1, root);
  box(gold, 0.35, 2.4, 0.35, 0, 46.4, -1, root);

  // corner towers
  const towers = [
    [-12.5, -9],
    [12.5, -9],
    [-12.5, 9],
    [12.5, 9],
  ];
  for (const [tx, tz] of towers) {
    box(stone, 7.2, 20, 7.2, tx, 12, tz, root);
    cone(roof, 5.6, 6.2, tx, 25.2, tz, root);
    box(gold, 0.28, 1.6, 0.28, tx, 28.6, tz, root);
  }

  // battlements
  for (let i = -13; i <= 13; i += 2.2) {
    box(stone, 1.3, 1.6, 1.3, i, 16.7, 11.2, root);
    box(stone, 1.3, 1.6, 1.3, i, 16.7, -11.2, root);
  }
  for (let i = -10; i <= 10; i += 2.2) {
    box(stone, 1.3, 1.6, 1.3, 14.2, 16.7, i, root);
    box(stone, 1.3, 1.6, 1.3, -14.2, 16.7, i, root);
  }

  // door recess + door
  box(stoneDark, 4.2, 5.2, 1.2, 0, 3.6, 11.6, root);
  box(stone, 1.1, 5.4, 1.4, -2.4, 3.7, 11.7, root);
  box(stone, 1.1, 5.4, 1.4, 2.4, 3.7, 11.7, root);
  box(gold, 0.35, 0.35, 0.35, 0.7, 3.5, 12.2, root);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 4.5), stoneDark);
  door.position.set(0, 3.35, 12.22);
  root.add(door);

  // steps
  for (let s = 0; s < 6; s++) {
    box(stone, 8 - s * 0.35, 0.38, 1.15, 0, 0.25 + s * 0.38, 14.2 + s * 0.55, root);
  }

  // stained glass (front) — dark well behind so transmission reads
  box(stoneDark, 5.4, 7.6, 0.4, 0, 12.6, 10.85, root, false);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 7.4), glass);
  pane.position.set(0, 12.6, 11.25);
  pane.castShadow = false;
  pane.receiveShadow = false;
  root.add(pane);

  // windows
  for (const [wx, wy, wz] of [
    [-8, 10, 11.15],
    [8, 10, 11.15],
    [-8, 10, -11.15],
    [8, 10, -11.15],
    [0, 24, 4.1],
  ]) {
    const insetZ = wz > 0 ? wz - 0.22 : wz + 0.22;
    box(stoneDark, 2.05, 2.85, 0.35, wx, wy, insetZ, root, false);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), glass);
    w.position.set(wx, wy, wz);
    if (wz < 0) w.rotation.y = Math.PI;
    root.add(w);
  }

  // side wings
  box(stone, 10, 10, 12, -19, 6, 0, root);
  box(stone, 10, 10, 12, 19, 6, 0, root);
  cone(roof, 6.4, 5, -19, 13.6, 0, root);
  cone(roof, 6.4, 5, 19, 13.6, 0, root);

  return { group: root, glass };
}
