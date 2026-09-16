import * as THREE from 'three/webgpu';
import { sampleHeight } from '../scene/terrain.js';
import { mulberry32 } from '../rand.js';

const _xAxis = new THREE.Vector3(1, 0, 0);

function createRain({ count = 600, box = [40, 30, 40] } = {}) {
  const [bx, by, bz] = box;
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xc8dfff, transparent: true, opacity: 0.0,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = 900;
  mesh.count = count;

  const px = new Float32Array(count);
  const py = new Float32Array(count);
  const pz = new Float32Array(count);
  const sp = new Float32Array(count);
  const rng = mulberry32(0x5a17);
  for (let i = 0; i < count; i++) {
    px[i] = (rng() - 0.5) * bx;
    py[i] = (rng() - 0.5) * by;
    pz[i] = (rng() - 0.5) * bz;
    sp[i] = 9 + rng() * 4;
  }

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  return {
    mesh,
    update(dt, world, camera) {
      const w = world.weather;
      const vis = w.rain > 0.02;
      mesh.visible = vis;
      if (!vis) return;

      const halfY = by * 0.5;
      mesh.position.set(camera.position.x, camera.position.y + halfY - 4, camera.position.z);

      const wx = w.windX * 4.5;
      const wz = w.windZ * 4.5;
      const halfX = bx * 0.5;
      const halfZ = bz * 0.5;

      for (let i = 0; i < count; i++) {
        px[i] += wx * dt;
        py[i] -= sp[i] * dt;
        pz[i] += wz * dt;
        if (py[i] < -halfY) py[i] += by;
        if (px[i] < -halfX) px[i] += bx; else if (px[i] > halfX) px[i] -= bx;
        if (pz[i] < -halfZ) pz[i] += bz; else if (pz[i] > halfZ) pz[i] -= bz;
        pos.set(px[i], py[i], pz[i]);
        scl.set(0.018, 0.5, 1);
        q.setFromAxisAngle(_xAxis, Math.atan2(wz, sp[i]) * 0.5);
        m4.compose(pos, q, scl);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mat.opacity = 0.10 + w.rain * 0.32;
    },
  };
}

function createFireflies({ count = 40, seed = 1 } = {}) {
  const geo = new THREE.BufferGeometry();
  const base = new Float32Array(count * 3);
  const pos = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const rng = mulberry32(0x1e3f + seed);
  for (let i = 0; i < count; i++) {
    const fx = (rng() - 0.5) * 26;
    const fz = 8 + rng() * 16;
    const fy = sampleHeight(fx, fz) + 0.6 + rng() * 1.1;
    base[i * 3] = fx; base[i * 3 + 1] = fy; base[i * 3 + 2] = fz;
    pos[i * 3] = fx; pos[i * 3 + 1] = fy; pos[i * 3 + 2] = fz;
    phase[i] = rng() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, 'rgba(255,244,180,1)');
  g.addColorStop(0.35, 'rgba(255,220,100,0.6)');
  g.addColorStop(1.0, 'rgba(255,200,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.PointsMaterial({
    size: 0.55, map: tex, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
    sizeAttenuation: true, fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 950;

  return {
    mesh: pts,
    update(t, world) {
      const dark = world.palette.sunIntensity < 0.35;
      const rainHide = 1 - Math.min(1, world.weather.rain * 1.4);
      mat.opacity = 0.95 * (dark ? 1 : 0) * rainHide;
      pts.visible = mat.opacity > 0.02;
      if (!pts.visible) return;
      for (let i = 0; i < count; i++) {
        pos[i * 3]     = base[i * 3]     + Math.sin(t * 0.5 + phase[i] * 1.3) * 0.6;
        pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.7 + phase[i])       * 0.4;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

export function createParticles({ rain = 600, fireflies = 40, seed = 1 } = {}) {
  const group = new THREE.Group();
  const r = createRain({ count: rain });
  const f = createFireflies({ count: fireflies, seed });
  group.add(r.mesh, f.mesh);
  return {
    group,
    update({ dt, t, camera, world }) {
      r.update(dt, world, camera);
      f.update(t, world);
    },
  };
}
