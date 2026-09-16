import * as THREE from 'three/webgpu';
import { stoneMap } from '../textures.js';
import { KEEP_Z, FRONT_Z, MOAT_INNER } from './layout.js';

function chain(mat, ax, ay, az, bx, by, bz, parent) {
  const a = new THREE.Vector3(ax, ay, az);
  const b = new THREE.Vector3(bx, by, bz);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 6), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createBridge() {
  const root = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    map: stoneMap(),
    roughness: 0.8,
    metalness: 0.02,
    color: 0xead7b4,
  });
  const rail = new THREE.MeshStandardMaterial({
    color: 0xd8c49a,
    roughness: 0.7,
    metalness: 0.04,
  });
  const iron = new THREE.MeshStandardMaterial({
    color: 0x3a342e,
    roughness: 0.45,
    metalness: 0.55,
  });

  const deckLen = 12;
  const keepFront = KEEP_Z + FRONT_Z;
  const innerZ = KEEP_Z + MOAT_INNER;
  const deckZ = innerZ + deckLen * 0.5;
  const deckY = 0.55;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.38, deckLen), stone);
  deck.position.set(0, deckY, deckZ);
  deck.castShadow = true;
  deck.receiveShadow = true;
  root.add(deck);

  for (const side of [-2.05, 2.05]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, deckLen), rail);
    wall.position.set(side, deckY + 0.5, deckZ);
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
  }

  chain(iron, -1.7, 7.2, keepFront - 0.2, -1.7, deckY + 0.4, innerZ + deckLen - 0.6, root);
  chain(iron, 1.7, 7.2, keepFront - 0.2, 1.7, deckY + 0.4, innerZ + deckLen - 0.6, root);

  return { group: root, deckY, z0: innerZ, z1: innerZ + deckLen };
}
