import * as THREE from 'three/webgpu';
import { barkMap, leafMap } from '../textures.js';
import { sampleHeight } from './terrain.js';

function makeTree(bark, leaf, scale) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 3.2, 8), bark);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  const canopies = [
    [0, 3.6, 0, 1.55],
    [0.55, 4.15, 0.2, 1.15],
    [-0.5, 4.05, -0.25, 1.1],
    [0.15, 5.05, -0.1, 0.95],
  ];
  for (const [x, y, z, r] of canopies) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), leaf);
    c.position.set(x, y, z);
    c.castShadow = true;
    c.receiveShadow = true;
    g.add(c);
  }
  g.scale.setScalar(scale);
  return g;
}

export function createTrees() {
  const root = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({
    map: barkMap(),
    roughness: 0.9,
    metalness: 0,
  });
  const leaf = new THREE.MeshStandardMaterial({
    map: leafMap(),
    roughness: 0.72,
    metalness: 0,
    color: 0x2a8a34,
  });

  const spots = [
    [-9.5, 18, 1.05],
    [10.2, 17.5, 1.12],
    [-16, 12, 1.35],
    [17.5, 11, 1.28],
    [-14, 26, 0.95],
    [15, 27, 1.0],
    [-22, 8, 1.45],
    [23, 7, 1.4],
    [-20, 22, 1.15],
    [21, 21, 1.2],
    [-28, 16, 1.55],
    [29, 14, 1.5],
    [-11, 32, 0.88],
    [12, 33, 0.9],
    [-32, 2, 1.7],
    [33, 0, 1.65],
    [-24, -6, 1.25],
    [26, -8, 1.3],
  ];

  const trees = [];
  for (const [x, z, s] of spots) {
    const t = makeTree(bark, leaf, s);
    const y = sampleHeight(x, z);
    t.position.set(x, y, z);
    t.rotation.y = (x * 12.7 + z) * 0.13;
    root.add(t);
    trees.push(t);
  }

  return {
    group: root,
    update(t, world) {
      const gust = world ? world.weather.windStrength : 1;
      const w = Math.sin(t * 0.7) * 0.016 * gust;
      for (let i = 0; i < trees.length; i++) {
        trees[i].rotation.z = w * (i % 2 === 0 ? 1 : -1);
      }
    },
  };
}
