import * as THREE from 'three/webgpu';
import { CapsuleGeometry, CircleGeometry, TorusGeometry } from 'three';
import { sampleHeight } from './terrain.js';
import { wave } from '../hour.js';

function mat(hex, { rough = 0.55, metal = 0, emissive = 0, emissiveIntensity = 0 } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHex(hex, THREE.SRGBColorSpace),
    roughness: rough,
    metalness: metal,
    emissive: new THREE.Color().setHex(emissive || 0x000000, THREE.SRGBColorSpace),
    emissiveIntensity,
  });
}

function limb(geo, material, x, y, z, parent) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/**
 * Articulated plumber. `kind` is 'mario' | 'luigi'.
 * Gestures: idle, walk, wave, point, shrug, measure, cheer, shiver, present.
 */
export function createPlumber(kind = 'mario') {
  const isLuigi = kind === 'luigi';
  const root = new THREE.Group();
  root.name = kind;

  const red = mat(isLuigi ? 0x2f9e32 : 0xe01818, { rough: 0.42 });
  const blue = mat(0x1a3ea8, { rough: 0.48 });
  const skin = mat(0xf1b07a, { rough: 0.45 });
  const brown = mat(isLuigi ? 0x3a2414 : 0x4a2c18, { rough: 0.58 });
  const stacheMat = mat(0x2a1810, { rough: 0.52 });
  const white = mat(0xf4f4f4, { rough: 0.4 });
  const gold = mat(0xe6c14a, { rough: 0.3, metal: 0.45 });
  const black = mat(0x141414, { rough: 0.5 });
  const blueEye = mat(0x2a62d8, { rough: 0.28 });
  const shoeMat = mat(isLuigi ? 0x3a2418 : 0x5a2e12, { rough: 0.55 });

  const scale = isLuigi ? 1.08 : 1.0;
  const body = new THREE.Group();
  root.add(body);

  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), blue);
  hip.position.y = 0.62;
  hip.castShadow = true;
  body.add(hip);

  const torso = new THREE.Mesh(new CapsuleGeometry(0.28, 0.34, 6, 12), blue);
  torso.position.y = 0.98;
  torso.castShadow = true;
  body.add(torso);

  const shirt = new THREE.Mesh(new CapsuleGeometry(0.255, 0.14, 4, 10), red);
  shirt.position.y = 1.24;
  shirt.castShadow = true;
  body.add(shirt);

  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.04), blue);
    strap.position.set(s * 0.16, 1.18, 0.2);
    strap.rotation.z = s * -0.18;
    strap.castShadow = true;
    body.add(strap);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), gold);
    btn.position.set(s * 0.1, 0.92, 0.27);
    body.add(btn);
  }

  const headG = new THREE.Group();
  headG.position.y = 1.58;
  body.add(headG);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), skin);
  head.castShadow = true;
  headG.add(head);

  const capY = isLuigi ? 0.16 : 0.12;
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(isLuigi ? 0.27 : 0.29, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    red,
  );
  cap.position.set(0, capY, 0);
  cap.castShadow = true;
  headG.add(cap);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 18), red);
  brim.position.set(0, 0.0, 0.16);
  brim.rotation.x = -0.18;
  brim.scale.set(isLuigi ? 0.92 : 1, 1, 0.72);
  brim.castShadow = true;
  headG.add(brim);

  const emblem = new THREE.Mesh(new CircleGeometry(0.075, 14), white);
  emblem.position.set(0, 0.24, 0.22);
  headG.add(emblem);
  const letter = new THREE.Mesh(new TorusGeometry(0.03, 0.009, 6, 12), red);
  letter.position.set(0, 0.24, 0.226);
  headG.add(letter);
  if (isLuigi) {
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.038, 0.01), red);
    stem.position.set(-0.018, 0.252, 0.227);
    headG.add(stem);
  }

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.7),
    brown,
  );
  hair.position.set(0, -0.06, -0.1);
  hair.scale.set(1.08, 0.72, 0.88);
  headG.add(hair);

  if (isLuigi) {
    for (const s of [-1, 1]) {
      const burn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), brown);
      burn.position.set(s * 0.2, -0.08, 0.06);
      burn.scale.set(0.7, 1.15, 0.55);
      headG.add(burn);
    }
  }

  const irises = [];
  for (const s of [-1, 1]) {
    const whiteEye = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), white);
    whiteEye.position.set(s * 0.09, 0.04, 0.22);
    headG.add(whiteEye);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blueEye);
    iris.position.set(s * 0.09, 0.04, 0.265);
    headG.add(iris);
    irises.push(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), black);
    pupil.position.set(s * 0.09, 0.04, 0.3);
    headG.add(pupil);

    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skin);
    ear.position.set(s * 0.27, -0.02, 0);
    headG.add(ear);
  }

  // Mustache: Mario bushy-and-proud, Luigi long-and-worried.
  const stacheG = new THREE.Group();
  stacheG.position.set(0, -0.1, 0.26);
  headG.add(stacheG);
  const bulge = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), stacheMat);
  bulge.position.set(0, 0, 0.01);
  stacheG.add(bulge);
  for (const s of [-1, 1]) {
    const len = isLuigi ? 0.16 : 0.11;
    const stache = new THREE.Mesh(new CapsuleGeometry(isLuigi ? 0.028 : 0.038, len, 4, 8), stacheMat);
    stache.position.set(s * (isLuigi ? 0.1 : 0.075), isLuigi ? -0.02 : 0.01, 0.01);
    stache.rotation.z = s * (isLuigi ? 0.95 : 0.72);
    stache.rotation.x = isLuigi ? 0.15 : 0;
    stacheG.add(stache);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(isLuigi ? 0.03 : 0.036, 8, 6), stacheMat);
    tip.position.set(s * (isLuigi ? 0.2 : 0.145), isLuigi ? -0.055 : 0.03, 0.02);
    stacheG.add(tip);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(isLuigi ? 0.062 : 0.074, 8, 8), skin);
  nose.position.set(0, -0.04, 0.28);
  headG.add(nose);

  const armL = new THREE.Group();
  armL.position.set(-0.34, 1.18, 0.02);
  body.add(armL);
  limb(new CapsuleGeometry(0.08, 0.3, 4, 8), red, 0, -0.22, 0, armL).rotation.z = -0.12;
  const handL = limb(new THREE.SphereGeometry(0.11, 10, 8), white, -0.04, -0.44, 0.06, armL);

  const armR = new THREE.Group();
  armR.position.set(0.34, 1.18, 0.02);
  body.add(armR);
  limb(new CapsuleGeometry(0.08, 0.3, 4, 8), red, 0, -0.22, 0, armR).rotation.z = 0.12;
  const handR = limb(new THREE.SphereGeometry(0.11, 10, 8), white, 0.04, -0.44, 0.06, armR);

  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.58, 0);
  body.add(legL);
  limb(new CapsuleGeometry(0.1, 0.28, 4, 8), blue, 0, -0.22, 0, legL);
  limb(new THREE.BoxGeometry(0.16, 0.1, 0.3), shoeMat, 0, -0.5, 0.07, legL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.58, 0);
  body.add(legR);
  limb(new CapsuleGeometry(0.1, 0.28, 4, 8), blue, 0, -0.22, 0, legR);
  limb(new THREE.BoxGeometry(0.16, 0.1, 0.3), shoeMat, 0, -0.5, 0.07, legR);

  // Handheld props
  const wrench = new THREE.Group();
  const wrenchBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 6), gold);
  wrenchBar.rotation.z = 0.4;
  wrench.add(wrenchBar);
  const wrenchHead = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10, Math.PI), gold);
  wrenchHead.position.set(0.07, 0.14, 0);
  wrenchHead.rotation.z = 0.4;
  wrench.add(wrenchHead);
  wrench.visible = !isLuigi;
  handR.add(wrench);
  wrench.position.set(0.02, -0.08, 0.08);
  wrench.rotation.x = 0.6;

  const tape = new THREE.Group();
  const tapeCase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.14), mat(0xf0c030, { rough: 0.4, metal: 0.2 }));
  tape.add(tapeCase);
  const tapeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.012, 0.04), mat(0xe8d060, { rough: 0.35, metal: 0.3 }));
  tapeBlade.position.set(0.2, 0, 0);
  tape.add(tapeBlade);
  tape.visible = isLuigi;
  handL.add(tape);
  tape.position.set(-0.04, -0.02, 0.1);
  tape.rotation.y = 0.3;

  const lantern = new THREE.Group();
  const lanternCage = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.14, 0.1),
    mat(0xc8a050, { rough: 0.35, metal: 0.55, emissive: 0xffcc66, emissiveIntensity: 0 }),
  );
  lantern.add(lanternCage);
  const lanternGlow = new THREE.PointLight(0xffcc77, 0, 6, 2);
  lanternGlow.position.y = 0.02;
  lantern.add(lanternGlow);
  lantern.visible = false;
  handL.add(lantern);
  lantern.position.set(-0.02, -0.12, 0.04);

  root.scale.setScalar(scale);

  const poseState = { x: isLuigi ? 1.6 : 0, z: 16.2, yaw: Math.PI, moving: false, gesture: 'idle' };
  const rig = {
    aLx: 0, aLy: 0, aLz: isLuigi ? -0.16 : -0.1,
    aRx: 0, aRy: 0, aRz: isLuigi ? 0.16 : 0.1,
    lLx: 0, lRx: 0, headX: 0, headY: 0, bodyX: 0, bodyZ: 0,
  };
  let phase = 0;

  function damp(cur, tgt, k) {
    return cur + (tgt - cur) * k;
  }

  function applyGesture(name, t, moving, dt) {
    const g = name || (moving ? 'walk' : 'idle');
    const walking = moving && (g === 'walk' || g === 'idle' || g === 'shiver');
    if (walking) phase += dt * 8.2;
    else phase += (0 - phase) * Math.min(1, dt * 6);

    const stride = Math.sin(phase);
    const idle = Math.sin(t * (isLuigi ? 2.4 : 1.9));

    let aLx = 0, aLy = 0, aLz = isLuigi ? -0.16 : -0.1;
    let aRx = 0, aRy = 0, aRz = isLuigi ? 0.16 : 0.1;
    let lLx = idle * 0.03, lRx = -idle * 0.03;
    let headX = idle * 0.03, headY = 0, stacheKick = 0;
    let bodyX = idle * 0.012, bodyZ = 0;

    if (walking) {
      aLx = stride * 0.62;
      aRx = -stride * 0.62;
      lLx = -stride * 0.78;
      lRx = stride * 0.78;
      bodyX = Math.sin(phase) * 0.04;
      bodyZ = -stride * 0.03;
      headX = -Math.abs(stride) * 0.04;
    }

    if (g === 'wave') {
      aRx = -0.2;
      aRz = 1.35;
      aRy = Math.sin(t * 6.2) * 0.38;
      aLx = idle * 0.08;
    } else if (g === 'point') {
      aRx = -1.05;
      aRz = 0.12;
      aRy = 0.22;
      headY = 0.14;
      headX = -0.1;
      aLx = 0.12;
    } else if (g === 'shrug') {
      aLz = -0.85;
      aRz = 0.85;
      aLx = -0.28;
      aRx = -0.28;
      headX = 0.06;
    } else if (g === 'measure') {
      aLx = -0.7;
      aLy = 0.28;
      aLz = -0.28;
      aRx = -0.42;
      headX = 0.14;
      tape.rotation.z = Math.sin(t * 2.4) * 0.1;
    } else if (g === 'cheer') {
      aLx = -1.75;
      aRx = -1.75;
      aLz = -0.18;
      aRz = 0.18;
      headX = -0.1;
      stacheKick = 0.06;
    } else if (g === 'shiver') {
      aLx = walking ? stride * 0.35 : 0.28 + Math.sin(t * 14) * 0.08;
      aRx = walking ? -stride * 0.35 : 0.28 + Math.sin(t * 14 + 1.2) * 0.08;
      headY = Math.sin(t * 11) * 0.05;
      bodyZ = Math.sin(t * 14) * 0.02;
    } else if (g === 'present') {
      aRx = -0.55;
      aRz = 0.72;
      aRy = 0.12;
      headY = -0.08;
      aLx = 0.1;
    } else if (g === 'kneel') {
      lLx = 1.15;
      lRx = 1.05;
      bodyX = 0.22;
      aLx = -0.55;
      aLy = 0.2;
      aRx = -0.35;
      headX = 0.22;
      tape.rotation.z = Math.sin(t * 1.6) * 0.08;
    }

    // Cyclic walk is applied live. Gesture bases are damped so cuts do not pop.
    const k = walking ? 0.45 : 0.2;
    rig.aLx = damp(rig.aLx, aLx, k);
    rig.aLy = damp(rig.aLy, aLy, k);
    rig.aLz = damp(rig.aLz, aLz, k);
    rig.aRx = damp(rig.aRx, aRx, k);
    rig.aRy = damp(rig.aRy, aRy, k);
    rig.aRz = damp(rig.aRz, aRz, k);
    rig.lLx = damp(rig.lLx, lLx, walking ? 0.5 : 0.22);
    rig.lRx = damp(rig.lRx, lRx, walking ? 0.5 : 0.22);
    rig.headX = damp(rig.headX, headX, k);
    rig.headY = damp(rig.headY, headY, k);
    rig.bodyX = damp(rig.bodyX, bodyX, k);
    rig.bodyZ = damp(rig.bodyZ, bodyZ, k);

    armL.rotation.set(rig.aLx, rig.aLy, rig.aLz);
    armR.rotation.set(rig.aRx, rig.aRy, rig.aRz);
    legL.rotation.x = rig.lLx;
    legR.rotation.x = rig.lRx;
    headG.rotation.set(rig.headX, rig.headY, 0);
    stacheG.rotation.z = stacheKick * Math.sin(t * 6);
    body.rotation.x = rig.bodyX;
    body.rotation.z = rig.bodyZ;

    wrench.visible = !isLuigi && (g === 'present' || g === 'idle' || g === 'wave' || g === 'cheer');
    tape.visible = isLuigi && !lantern.visible && (g === 'measure' || g === 'idle' || g === 'shrug' || g === 'kneel');
  }

  return {
    group: root,
    kind,
    lantern,
    lanternGlow,
    update(t, bridge, directed, dt = 0.016) {
      const pose = directed || poseState;
      const x = pose.x ?? poseState.x;
      const z = pose.z ?? poseState.z;
      let y = sampleHeight(x, z);
      if (bridge && z <= bridge.z1 && z >= bridge.z0) y = bridge.deckY;
      const moving = !!pose.moving;
      const g = pose.gesture || (moving ? 'walk' : 'idle');
      const night = !!pose.lantern;
      lantern.visible = isLuigi && night;
      lanternGlow.intensity = night ? 2.4 + 0.35 * Math.sin(t * 6) : 0;
      applyGesture(g, t, moving, dt);
      const walking = moving && (g === 'walk' || g === 'idle' || g === 'shiver');
      const bob = walking
        ? 0.055 * Math.abs(Math.sin(phase))
        : (g === 'kneel' ? -0.16 : 0.016 * wave(t, isLuigi ? 3 : 2));
      root.position.set(x, y + bob, z);
      root.rotation.y = pose.yaw ?? Math.PI;
    },
  };
}

export function createMario() {
  return createPlumber('mario');
}

export function createLuigi() {
  return createPlumber('luigi');
}
