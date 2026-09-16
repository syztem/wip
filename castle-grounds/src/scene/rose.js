import * as THREE from 'three/webgpu';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { glassMap } from '../textures.js';
import { ROSE_W, ROSE_H } from './layout.js';

/**
 * Lofted dual-surface arched pane (transmission volume), not a card.
 * 32×16 grid, rim wall, mergeVertices weld + computeVertexNormals.
 */
function makeRoseLoft() {
  const SEG_V = 32;
  const SEG_U = 16;
  const cu = SEG_U + 1;
  const cv = SEG_V + 1;
  const nSurface = cu * cv;
  const T_HALF = 0.09;

  function halfWidth(u) {
    const half = ROSE_W * 0.5;
    const archStart = 0.62;
    if (u <= archStart) return half;
    const t = (u - archStart) / (1 - archStart);
    return half * Math.sqrt(Math.max(0, 1 - t * t));
  }

  function centerPos(u, v, out) {
    const w = halfWidth(u);
    const x = (v - 0.5) * 2 * w;
    const y = u * ROSE_H;
    const edge = Math.abs(v - 0.5) * 2;
    const belly = Math.sin(u * Math.PI) * (1 - edge) * 0.07;
    return out.set(x, y, belly);
  }

  const center = new Array(nSurface);
  for (let i = 0; i <= SEG_U; i++) {
    const u = i / SEG_U;
    for (let j = 0; j <= SEG_V; j++) {
      const v = j / SEG_V;
      center[i * cv + j] = centerPos(u, v, new THREE.Vector3());
    }
  }

  const nor = new Array(nSurface);
  const du = new THREE.Vector3();
  const dv = new THREE.Vector3();
  for (let i = 0; i <= SEG_U; i++) {
    for (let j = 0; j <= SEG_V; j++) {
      const idx = i * cv + j;
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(SEG_U, i + 1);
      const j0 = Math.max(0, j - 1);
      const j1 = Math.min(SEG_V, j + 1);
      du.subVectors(center[i1 * cv + j], center[i0 * cv + j]);
      dv.subVectors(center[i * cv + j1], center[i * cv + j0]);
      nor[idx] = new THREE.Vector3().crossVectors(dv, du).normalize();
    }
  }

  const pos = new Float32Array(nSurface * 2 * 3);
  const uvs = new Float32Array(nSurface * 2 * 2);
  for (let i = 0; i <= SEG_U; i++) {
    const u = i / SEG_U;
    for (let j = 0; j <= SEG_V; j++) {
      const v = j / SEG_V;
      const idx = i * cv + j;
      const c = center[idx];
      const n = nor[idx];
      const o = idx * 3;
      pos[o] = c.x + n.x * T_HALF;
      pos[o + 1] = c.y + n.y * T_HALF;
      pos[o + 2] = c.z + n.z * T_HALF;
      uvs[idx * 2] = v;
      uvs[idx * 2 + 1] = u;

      const ii = nSurface + idx;
      pos[ii * 3] = c.x - n.x * T_HALF;
      pos[ii * 3 + 1] = c.y - n.y * T_HALF;
      pos[ii * 3 + 2] = c.z - n.z * T_HALF;
      uvs[ii * 2] = v;
      uvs[ii * 2 + 1] = u;
    }
  }

  const indices = [];
  for (let i = 0; i < SEG_U; i++) {
    for (let j = 0; j < SEG_V; j++) {
      const a = i * cv + j;
      const b = i * cv + (j + 1);
      const c = (i + 1) * cv + (j + 1);
      const d = (i + 1) * cv + j;
      indices.push(a, b, c, a, c, d);
    }
  }
  const off = nSurface;
  for (let i = 0; i < SEG_U; i++) {
    for (let j = 0; j < SEG_V; j++) {
      const a = off + i * cv + j;
      const b = off + i * cv + (j + 1);
      const c = off + (i + 1) * cv + (j + 1);
      const d = off + (i + 1) * cv + j;
      indices.push(a, c, b, a, d, c);
    }
  }

  function addRim(outerA, outerB) {
    const innerA = outerA + off;
    const innerB = outerB + off;
    indices.push(outerA, innerB, outerB, outerA, innerA, innerB);
  }
  for (let j = 0; j < SEG_V; j++) addRim(0 * cv + j, 0 * cv + (j + 1));
  for (let i = 0; i < SEG_U; i++) addRim(i * cv + SEG_V, (i + 1) * cv + SEG_V);
  for (let j = SEG_V; j > 0; j--) addRim(SEG_U * cv + j, SEG_U * cv + (j - 1));
  for (let i = SEG_U; i > 0; i--) addRim(i * cv + 0, (i - 1) * cv + 0);

  const raw = new THREE.BufferGeometry();
  raw.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  raw.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  raw.setIndex(indices);
  const geo = mergeVertices(raw, 1e-4);
  raw.dispose();
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

export function createRose(env) {
  let geo;
  try {
    geo = makeRoseLoft();
  } catch (e) {
    console.warn('rose loft miss', e);
    geo = new THREE.PlaneGeometry(ROSE_W, ROSE_H);
  }

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
    envMapIntensity: 1.15,
  });

  const mesh = new THREE.Mesh(geo, glass);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return { mesh, material: glass };
}
