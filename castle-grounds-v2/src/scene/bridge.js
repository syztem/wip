import * as THREE from 'three/webgpu';
import { stoneMap } from '../textures.js';

export function createBridge() {
  const root = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ map: stoneMap(), roughness: 0.8, metalness: 0.02, color: 0xead7b4 });
  const rail = new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 0.7, metalness: 0.04 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.45, 28), stone);
  deck.position.set(0, 0.55, -8);
  deck.castShadow = true; deck.receiveShadow = true;
  root.add(deck);

  for (const side of [-2.15, 2.15]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 28), rail);
    wall.position.set(side, 1.15, -8);
    wall.castShadow = true; wall.receiveShadow = true;
    root.add(wall);
    for (let z = -20; z <= 4; z += 2.4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.35, 0.32), rail);
      post.position.set(side, 1.35, z);
      post.castShadow = true;
      root.add(post);
    }
  }
  for (const z of [-16, -8, 0]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 1.4), stone);
    pier.position.set(0, -0.7, z);
    pier.castShadow = true; pier.receiveShadow = true;
    root.add(pier);
  }
  return { group: root };
}
