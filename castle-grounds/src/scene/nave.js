import * as THREE from 'three/webgpu';
import { Sprite } from 'three';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { wrap } from '../hour.js';
import { ROSE_Y0, ROSE_H, WALL_T, FRONT_Z } from './layout.js';

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
  for (let i = 0; i < 240; i++) {
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
      const u = wrap(t);
      const tau = (u / 30) * Math.PI * 2;
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

export function createNave(parent) {
  THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
  const light = new THREE.RectAreaLight(0xffc8a0, 18, 4, 6);
  const roseMidY = ROSE_Y0 + ROSE_H * 0.5;
  const innerZ = FRONT_Z - WALL_T - 0.15;
  light.position.set(0, roseMidY, innerZ);
  parent.add(light);

  const motes = makeMotes();
  parent.add(motes.group);
  return {
    light,
    update: motes.update,
  };
}
