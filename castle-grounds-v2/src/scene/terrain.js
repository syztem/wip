import * as THREE from 'three/webgpu';
import { grassMap, dirtMap } from '../textures.js';

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function sampleHeight(x, z) {
  const rYard = Math.hypot(x, z - 6);
  const yard = 1 - smoothstep(0, 34, rYard);
  const rHill = Math.hypot(x, z);
  const hillMask = smoothstep(36, 58, rHill);
  const hills =
    7.5 * Math.sin(x * 0.045) * Math.sin(z * 0.038) +
    11 * Math.exp(-((x - 48) ** 2 + (z + 8) ** 2) / 1100) +
    9 * Math.exp(-((x + 52) ** 2 + (z - 4) ** 2) / 980) +
    6 * Math.exp(-((x - 10) ** 2 + (z + 70) ** 2) / 1600);
  const cx = 0, cz = -38;
  const cr = Math.hypot(x - cx, z - cz);
  const island = 1 - smoothstep(12, 16.2, cr);
  const moat = -2.15 * (smoothstep(15.5, 18.2, cr) * (1 - smoothstep(26.5, 30.5, cr)));
  const path = -0.04 * (1 - smoothstep(0, 2.4, Math.abs(x))) * (1 - smoothstep(8, 22, Math.abs(z - 10)));
  const h = hills * hillMask * (1 - yard * 0.92) + moat + path;
  return h * (1 - island);
}

export function createTerrain() {
  const segs = 160, size = 180;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI * 0.5);
  const pos = geo.attributes.position;
  const color = new Float32Array(pos.count * 3);
  const grass = new THREE.Color(0x2f9a3c);
  const dirt = new THREE.Color(0xa07848);
  const rock = new THREE.Color(0x8a7a68);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = sampleHeight(x, z);
    pos.setY(i, y);
    const pathAmt = (z > -8 && z < 26 && Math.abs(x) < 2.8) ? 1 - smoothstep(1.1, 2.8, Math.abs(x)) : 0;
    tmp.copy(grass);
    if (pathAmt > 0.05) tmp.lerp(dirt, pathAmt);
    if (y < -0.6) tmp.lerp(new THREE.Color(0x6a5a40), 0.55);
    if (y > 6) tmp.lerp(rock, smoothstep(6, 12, y));
    tmp.toArray(color, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ map: grassMap(), vertexColors: true, roughness: 0.92, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  const pathGeo = new THREE.PlaneGeometry(4.2, 28, 1, 8);
  pathGeo.rotateX(-Math.PI * 0.5);
  const pathPos = pathGeo.attributes.position;
  for (let i = 0; i < pathPos.count; i++) {
    const x = pathPos.getX(i);
    const z = pathPos.getZ(i) + 10;
    pathPos.setY(i, sampleHeight(x, z) + 0.04);
  }
  pathGeo.computeVertexNormals();
  const path = new THREE.Mesh(
    pathGeo,
    new THREE.MeshStandardMaterial({ map: dirtMap(), roughness: 0.95, metalness: 0 }),
  );
  path.position.set(0, 0, 10);
  path.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh, path);
  return { group, mesh, path };
}
