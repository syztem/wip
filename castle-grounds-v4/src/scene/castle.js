import * as THREE from 'three/webgpu';
import { ConeGeometry } from 'three';
import { stoneMap, roofMap } from '../textures.js';
import { createRose } from './rose.js';
import { createNave } from './nave.js';
import {
  KEEP_X, KEEP_Z, KEEP_W, KEEP_H, KEEP_D, WALL_T,
  DOOR_W, DOOR_H, DOOR_Y0, ROSE_W, ROSE_H, ROSE_Y0, FRONT_Z,
} from './layout.js';

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
  root.position.set(KEEP_X, 0, KEEP_Z);

  const stone = new THREE.MeshStandardMaterial({
    map: stoneMap(),
    roughness: 0.78,
    metalness: 0.02,
    color: 0xf3e6cc,
  });
  const stoneDark = new THREE.MeshStandardMaterial({
    color: 0x1c1612,
    roughness: 0.94,
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
  const wood = new THREE.MeshStandardMaterial({
    color: 0x4a2c18,
    roughness: 0.72,
    metalness: 0.04,
  });

  const zFront = FRONT_Z - WALL_T * 0.5;
  const zBack = -FRONT_Z + WALL_T * 0.5;
  const yMid = KEEP_H * 0.5;
  const roseY1 = ROSE_Y0 + ROSE_H;
  const doorY1 = DOOR_Y0 + DOOR_H;
  const sideDoor = (KEEP_W - DOOR_W) * 0.5;
  const sideRose = (KEEP_W - ROSE_W) * 0.5;

  // Front wall around door + rose (hollow — no solid keep brick)
  box(stone, sideDoor, DOOR_H, WALL_T, -KEEP_W * 0.5 + sideDoor * 0.5, DOOR_Y0 + DOOR_H * 0.5, zFront, root);
  box(stone, sideDoor, DOOR_H, WALL_T, KEEP_W * 0.5 - sideDoor * 0.5, DOOR_Y0 + DOOR_H * 0.5, zFront, root);
  box(stone, KEEP_W, ROSE_Y0 - doorY1, WALL_T, 0, doorY1 + (ROSE_Y0 - doorY1) * 0.5, zFront, root);
  box(stone, sideRose, ROSE_H, WALL_T, -KEEP_W * 0.5 + sideRose * 0.5, ROSE_Y0 + ROSE_H * 0.5, zFront, root);
  box(stone, sideRose, ROSE_H, WALL_T, KEEP_W * 0.5 - sideRose * 0.5, ROSE_Y0 + ROSE_H * 0.5, zFront, root);
  const capH = KEEP_H - roseY1;
  if (capH > 0.05) box(stone, KEEP_W, capH, WALL_T, 0, roseY1 + capH * 0.5, zFront, root);

  box(stone, WALL_T, KEEP_H, KEEP_D, -KEEP_W * 0.5 + WALL_T * 0.5, yMid, 0, root);
  box(stone, WALL_T, KEEP_H, KEEP_D, KEEP_W * 0.5 - WALL_T * 0.5, yMid, 0, root);
  box(stone, KEEP_W, KEEP_H, WALL_T, 0, yMid, zBack, root);

  box(stoneDark, KEEP_W - WALL_T * 2, 0.45, KEEP_D - WALL_T * 2, 0, 0.22, 0, root);
  box(stoneDark, KEEP_W - WALL_T * 2, 0.4, KEEP_D - WALL_T * 2, 0, KEEP_H - 0.2, 0, root);

  // plinth, gap at the door
  const plinthSide = (32 - DOOR_W - 1.2) * 0.5;
  box(stone, plinthSide, 2.2, 26, -16 + plinthSide * 0.5, 1.1, 1.2, root);
  box(stone, plinthSide, 2.2, 26, 16 - plinthSide * 0.5, 1.1, 1.2, root);

  box(stone, 22, 8, 16, 0, 18, -1, root);
  box(stone, 10, 18, 10, 0, 28, -1, root);
  cone(roof, 8.2, 9, 0, 41.5, -1, root);
  box(gold, 0.35, 2.4, 0.35, 0, 46.4, -1, root);

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

  for (let i = -13; i <= 13; i += 2.2) {
    box(stone, 1.3, 1.6, 1.3, i, 16.7, 11.2, root);
    box(stone, 1.3, 1.6, 1.3, i, 16.7, -11.2, root);
  }
  for (let i = -10; i <= 10; i += 2.2) {
    box(stone, 1.3, 1.6, 1.3, 14.2, 16.7, i, root);
    box(stone, 1.3, 1.6, 1.3, -14.2, 16.7, i, root);
  }

  box(stone, 1.15, DOOR_H + 0.3, 1.5, -DOOR_W * 0.5 - 0.55, DOOR_Y0 + DOOR_H * 0.5, FRONT_Z + 0.15, root);
  box(stone, 1.15, DOOR_H + 0.3, 1.5, DOOR_W * 0.5 + 0.55, DOOR_Y0 + DOOR_H * 0.5, FRONT_Z + 0.15, root);

  const leafL = new THREE.Mesh(new THREE.BoxGeometry(1.45, DOOR_H * 0.96, 0.14), wood);
  leafL.position.set(-DOOR_W * 0.5 + 0.1, DOOR_Y0 + DOOR_H * 0.5, FRONT_Z - 0.2);
  leafL.rotation.y = 1.15;
  leafL.castShadow = true;
  root.add(leafL);
  const leafR = leafL.clone();
  leafR.position.set(DOOR_W * 0.5 - 0.1, DOOR_Y0 + DOOR_H * 0.5, FRONT_Z - 0.2);
  leafR.rotation.y = -1.15;
  root.add(leafR);

  for (let s = 0; s < 6; s++) {
    box(stone, 8 - s * 0.35, 0.38, 1.15, 0, 0.25 + s * 0.38, 14.2 + s * 0.55, root);
  }

  const rose = createRose(env);
  rose.mesh.position.set(0, ROSE_Y0, zFront);
  root.add(rose.mesh);

  box(stone, 10, 10, 12, -19, 6, 0, root);
  box(stone, 10, 10, 12, 19, 6, 0, root);
  cone(roof, 6.4, 5, -19, 13.6, 0, root);
  cone(roof, 6.4, 5, 19, 13.6, 0, root);

  const glassNight = new THREE.MeshStandardMaterial({
    color: 0xffe2a8,
    emissive: 0xffc266,
    emissiveIntensity: 0.15,
    roughness: 0.25,
    metalness: 0.05,
  });
  const windows = [];
  const windowSlots = [
    [-8.5, 7.2, zFront + 0.12],
    [8.5, 7.2, zFront + 0.12],
    [-8.5, 7.2, zBack - 0.12],
    [8.5, 7.2, zBack - 0.12],
    [-KEEP_W * 0.5 - 0.02, 8.4, -4],
    [KEEP_W * 0.5 + 0.02, 8.4, -4],
    [-KEEP_W * 0.5 - 0.02, 8.4, 4],
    [KEEP_W * 0.5 + 0.02, 8.4, 4],
  ];
  for (const [x, y, z] of windowSlots) {
    const slim = Math.abs(x) > KEEP_W * 0.4;
    const w = new THREE.Mesh(new THREE.BoxGeometry(slim ? 0.12 : 1.1, 1.8, slim ? 1.1 : 0.12), glassNight);
    w.position.set(x, y, z);
    root.add(w);
    windows.push(w);
  }

  const ivy = new THREE.MeshStandardMaterial({ color: 0x1f6a28, roughness: 0.9 });
  for (const [x, z, h] of [[-13.6, zFront + 0.2, 7], [13.6, zFront + 0.2, 6.2], [-18.2, 6.4, 5.5]]) {
    const vine = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 0.18), ivy);
    vine.position.set(x, h * 0.45, z);
    vine.castShadow = true;
    root.add(vine);
  }

  const nave = createNave(root);

  return {
    group: root,
    glass: rose.material,
    nave,
    update(t, world) {
      if (nave) nave.update(t);
      const night = world ? Math.max(0, 1 - world.palette.sunIntensity / 1.6) : 0;
      glassNight.emissiveIntensity = 0.12 + night * 1.35;
    },
  };
}
