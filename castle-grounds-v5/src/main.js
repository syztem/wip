import * as THREE from 'three/webgpu';
import { FogExp2, Clock } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createSky } from './scene/sky.js';
import { createTerrain } from './scene/terrain.js';
import { createCastle } from './scene/castle.js';
import { createTrees } from './scene/trees.js';
import { createWater } from './scene/water.js';
import { createMario, createLuigi } from './scene/mario.js';
import { createProps } from './scene/props.js';
import { createBridge } from './scene/bridge.js';
import { createPost, tryCreateBloom } from './post.js';
import { createWorld } from './world/world.js';
import { createParticles } from './world/particles.js';
import { createAudio } from './audio/audio.js';
import { createDirector } from './director/director.js';
import { SHOTS } from './director/shots.js';
import { chapterFor } from './director/script.js';
import { createHud } from './hud.js';
import { LOOP } from './hour.js';

const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const proof = params.get('proof') === '1';
const wantBloom = !proof && params.get('bloom') === '1';
const muteQuery = params.get('mute') === '1';
const startT = Math.max(0, parseFloat(params.get('t') || '0') || 0);
const forceGL = params.get('webgl') === '1';
const wantGPU = params.get('webgpu') === '1';

function asset(rel) {
  return new URL(rel, document.baseURI).href;
}

function die(err) {
  const el = document.getElementById('err');
  document.body.classList.add('dead');
  document.body.classList.remove('live');
  if (el) {
    el.style.display = 'grid';
    el.textContent = (err && err.message) ? err.message : String(err);
  }
  console.error(err);
}

function uaFlags() {
  const ua = navigator.userAgent;
  const firefox = /\bFirefox\b/.test(ua);
  const safari = /\bSafari\b/.test(ua) && !/\b(?:Chrome|Chromium|CriOS|Edg|OPR|Firefox)\b/.test(ua);
  return { safari, firefox };
}

const renderer = new THREE.WebGPURenderer({
  antialias: true,
  alpha: false,
  forceWebGL: forceGL || (!wantGPU && (uaFlags().safari || uaFlags().firefox || typeof navigator.gpu === 'undefined')),
});
renderer.setClearColor(0x7eb7e8, 1);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new FogExp2(0x9ec9e8, 0.012);
scene.background = new THREE.Color(0x7eb7e8);

const camera = new THREE.PerspectiveCamera(48, 1, 0.12, 2000000);
camera.position.set(18, 10, 28);

const clock = new Clock();

function resize() {
  const w = innerWidth;
  const h = Math.max(1, innerHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
resize();
addEventListener('resize', resize, { passive: true });

const world = createWorld({ startHour: 6.4, hoursPerSecond: 0, weather: 'clear' });

let envMap = null;
try {
  const hdr = await new HDRLoader().loadAsync(asset('public/hdr/env.hdr'));
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  envMap = hdr;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;
} catch (e) {
  console.warn('HDR miss', e);
}

const sky = createSky({ useMesh: !proof, world });
if (!proof) scene.add(sky.mesh);

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3d5a32, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d0, 2.35);
sun.position.copy(world.lightDir).multiplyScalar(80);
sun.castShadow = !proof;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 4;
sun.shadow.camera.far = 160;
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 36;
sun.shadow.camera.bottom = -36;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.035;
scene.add(sun);

const bolt = new THREE.PointLight(0xcfe8ff, 0, 180, 1.4);
bolt.position.set(8, 40, -20);
scene.add(bolt);

let terrain = null;
let trees = null;
let water = null;
let props = null;
let bridge = null;

if (!proof) {
  terrain = createTerrain();
  scene.add(terrain.group);
  trees = createTrees();
  scene.add(trees.group);
  try {
    water = createWater({ nodes: true });
  } catch (e) {
    console.warn('water nodes miss', e);
    water = createWater({ nodes: false });
  }
  scene.add(water.mesh);
  props = createProps();
  scene.add(props.group);
  bridge = createBridge();
  scene.add(bridge.group);
}

const castle = createCastle(envMap);
scene.add(castle.group);

const mario = createMario();
scene.add(mario.group);
const luigi = createLuigi();
scene.add(luigi.group);

const director = createDirector(camera, { shots: SHOTS });
director.apply(0);

let particles = null;
try {
  particles = createParticles({ rain: 700, fireflies: 48, seed: 1 });
  scene.add(particles.group);
} catch (e) {
  console.warn('particles init failed', e);
}

const audio = createAudio();
if (!muteQuery) {
  const kick = () => {
    audio.enable();
    if (props && props.waterfall) {
      const wp = props.waterfall.position;
      audio.setWaterfallPosition(wp.x, wp.y, wp.z);
    }
  };
  try { kick(); } catch { /* gesture may be required */ }
  addEventListener('pointerdown', kick, { passive: true, once: true });
  addEventListener('keydown', kick, { once: true });
}

const hud = createHud();

function applyWorld() {
  const p = world.palette;
  const w = world.weather;
  sun.color.copy(p.sunColor);
  sun.intensity = p.sunIntensity * (1 - w.cloudCoverage * 0.55);
  sun.position.copy(world.lightDir).multiplyScalar(80);
  hemi.color.copy(p.skyColor);
  hemi.groundColor.copy(p.groundColor);
  hemi.intensity = p.hemiIntensity * (1 + w.cloudCoverage * 0.15);
  scene.fog.color.copy(p.fogColor);
  scene.fog.density = p.fogDensity + w.fogBias * 0.004;
  scene.background.copy(p.bgColor);
  scene.environmentIntensity = p.envIntensity;
  sky.update();
}

applyWorld();

let post = createPost(renderer, scene, camera);
try {
  await renderer.init();
} catch (e) {
  die(e);
  throw e;
}

if (wantBloom) {
  try {
    post = await tryCreateBloom(renderer, scene, camera);
  } catch (e) {
    console.warn('bloom miss', e);
  }
}

document.body.classList.add('live');

const marioPose = { x: 0, z: 16.2, yaw: Math.PI, moving: false, gesture: 'idle', lantern: false };
const luigiPose = { x: 1.8, z: 17.1, yaw: Math.PI, moving: false, gesture: 'idle', lantern: false };

function targetXZ(tgt, u) {
  const uu = Math.min(1, Math.max(0, u ?? 0));
  const x1 = tgt.x1 ?? tgt.x;
  const z1 = tgt.z1 ?? tgt.z;
  return { x: tgt.x + (x1 - tgt.x) * uu, z: tgt.z + (z1 - tgt.z) * uu };
}

function chasePose(state, tgt, dt, snap, u) {
  const goal = targetXZ(tgt, u);
  const dx = goal.x - state.x;
  const dz = goal.z - state.z;
  if (snap || (dx * dx + dz * dz) > 64) {
    state.x = goal.x;
    state.z = goal.z;
    state.yaw = tgt.yaw;
  } else {
    state.x += dx * Math.min(1, dt * 3.4);
    state.z += dz * Math.min(1, dt * 3.4);
    let dyaw = tgt.yaw - state.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    state.yaw += dyaw * Math.min(1, dt * 3.0);
  }
  state.moving = !!tgt.moving;
  state.gesture = tgt.gesture || (tgt.moving ? 'walk' : 'idle');
  state.lantern = !!tgt.lantern;
}
let lastShot = '';
let flashUntil = 0;
let nextBolt = 2.4;
const themeColorEl = document.querySelector('meta[name="theme-color"]');

const fpsEl = document.getElementById('fps');
let frames = 0;
let fpsT = performance.now();
let fpsLast = '';

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();
  const u = (((t + startT) % LOOP) + LOOP) % LOOP;

  const shot = director.shotAt(u);
  const chapter = chapterFor(shot.id);
  const shotCut = shot.id !== lastShot;
  if (shotCut) {
    lastShot = shot.id;
    world.weather.set(chapter.weather);
  }
  const hourNow = world.hours;
  let hourTarget = chapter.hour;
  let dh = hourTarget - hourNow;
  if (dh > 12) dh -= 24;
  if (dh < -12) dh += 24;
  world.setHour(hourNow + dh * Math.min(1, dt * 0.55));
  world.advance(dt);
  applyWorld();

  director.apply(u);

  chasePose(marioPose, chapter.mario, dt, shotCut, shot.u);
  chasePose(luigiPose, chapter.luigi || chapter.mario, dt, shotCut, shot.u);
  mario.update(u, bridge, marioPose, dt);
  luigi.update(u, bridge, luigiPose, dt);

  if (trees) trees.update(t, world);
  if (props) props.update(t, world);
  if (castle.update) castle.update(t, world);
  else if (castle.nave) castle.nave.update(t);
  particles?.update({ dt, t, camera, world });
  audio.update(camera, world);

  let flash = false;
  if (world.weather.preset === 'storm' && world.weather.rain > 0.4) {
    if (u > nextBolt) {
      flashUntil = u + 0.08 + Math.random() * 0.07;
      nextBolt = u + 1.6 + Math.random() * 3.2;
    }
    if (u < flashUntil) {
      flash = true;
      bolt.intensity = 40;
      renderer.toneMappingExposure = 1.55;
    } else {
      bolt.intensity = 0;
      renderer.toneMappingExposure = 1.05;
    }
  } else {
    bolt.intensity = 0;
    renderer.toneMappingExposure = 1.05;
  }

  if (themeColorEl) {
    themeColorEl.setAttribute('content', '#' + scene.background.getHexString());
  }

  hud.tick({
    dt,
    reelT: u,
    shotId: shot.id,
    hours: world.hours,
    weather: world.weather.preset,
    backend: renderer.backend?.name || 'gpu',
    bloom: post.enabled,
    flash,
  });

  frames++;
  const now = performance.now();
  if (now - fpsT > 250) {
    const fps = Math.round((frames * 1000) / (now - fpsT));
    frames = 0;
    fpsT = now;
    const label = debug ? `${fps} · ${shot.id} · ${post.enabled ? 'bloom' : 'raw'}` : '';
    if (fpsEl && label !== fpsLast) {
      fpsEl.textContent = label;
      fpsLast = label;
    }
  }
  post.render();
});

if (debug) {
  console.info('castle-grounds montage', {
    backend: renderer.backend?.name,
    bloom: post.enabled,
    hdr: !!envMap,
    loop: LOOP,
    shots: SHOTS.length,
  });
}
