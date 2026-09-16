import * as THREE from 'three/webgpu';
import { FogExp2, Timer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createSky } from './scene/sky.js';
import { createTerrain } from './scene/terrain.js';
import { createCastle } from './scene/castle.js';
import { createTrees } from './scene/trees.js';
import { createWater } from './scene/water.js';
import { createMario } from './scene/mario.js';
import { createProps } from './scene/props.js';
import { createBridge } from './scene/bridge.js';
import { createFlyby } from './flyby.js';
import { createPost, tryCreateBloom } from './post.js';
import { wrap } from './hour.js';

const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const proof = params.get('proof') === '1';
const orbit = params.has('orbit');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const wantBloom = !proof && params.get('bloom') !== '0' && (params.get('bloom') === '1' || !isSafari);

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

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: false });
renderer.setClearColor(0x7eb7e8, 1);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
if (!proof) {
  scene.fog = new FogExp2(0x9ec9e8, 0.012);
  scene.background = new THREE.Color(0x7eb7e8);
} else {
  scene.background = new THREE.Color(0x141018);
  renderer.setClearColor(0x141018, 1);
}

const camera = new THREE.PerspectiveCamera(48, 1, 0.12, 2000);
camera.position.set(18, 10, 28);

const timer = new Timer();
timer.connect(document);

let controls = null;
if (orbit) {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 8, -20);
}

function resize() {
  const w = innerWidth;
  const h = Math.max(1, innerHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
resize();
addEventListener('resize', resize, { passive: true });

let envMap = null;
try {
  const hdr = await new HDRLoader().loadAsync(asset('public/hdr/env.hdr'));
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  envMap = hdr;
  scene.environment = envMap;
} catch (e) {
  console.warn('HDR miss', e);
}

const sky = createSky({ useMesh: !proof });
if (!proof) scene.add(sky.mesh);

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3d5a32, proof ? 0.12 : 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d0, proof ? 0.15 : 2.35);
sun.position.copy(sky.sunDir).multiplyScalar(80);
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

const flyby = createFlyby(camera);
if (!orbit) flyby.apply(0);

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

const fpsEl = document.getElementById('fps');
let frames = 0;
let fpsT = performance.now();
let fpsLast = '';

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  const t = timer.getElapsed();
  const u = wrap(t);
  if (!orbit) flyby.apply(u);
  else controls.update();
  mario.update(u, bridge);
  if (trees) trees.update(u);
  if (props) props.update(u);
  if (castle.nave) castle.nave.update(u);

  frames++;
  const now = timestamp;
  if (now - fpsT > 250) {
    const fps = Math.round((frames * 1000) / (now - fpsT));
    frames = 0;
    fpsT = now;
    const label = post.enabled ? `${fps} · bloom` : `${fps}`;
    if (fpsEl && label !== fpsLast) {
      fpsEl.textContent = label;
      fpsLast = label;
    }
  }
  post.render();
});

if (debug) {
  console.info('castle-grounds v2', {
    backend: renderer.backend?.name,
    proof,
    bloom: post.enabled,
    hdr: !!envMap,
  });
}
