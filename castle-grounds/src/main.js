import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createPost } from './post.js';
import { createFlyby, LOOP } from './flyby.js';
import { createSky } from './scene/sky.js';
import { createTerrain } from './scene/terrain.js';
import { createCastle } from './scene/castle.js';
import { createBridge } from './scene/bridge.js';
import { createWater } from './scene/water.js';
import { createTrees } from './scene/trees.js';
import { createMario } from './scene/mario.js';
import { createProps } from './scene/props.js';

const orbitMode = /(?:\?|&)orbit=1(?:&|$)/.test(location.search);
const debug = /(?:\?|&)debug=1(?:&|$)/.test(location.search);
const forceGLQuery = /(?:\?|&)webgl=1(?:&|$)/.test(location.search);
const errEl = document.getElementById('err');
const fpsEl = document.getElementById('fps');

function fail(msg, err) {
  console.error(msg, err);
  document.body.classList.add('dead');
  if (errEl) {
    errEl.style.display = 'grid';
    errEl.textContent = msg;
  }
}

function asset(relFromThisModule) {
  return new URL(relFromThisModule, import.meta.url).href;
}

async function loadEnv() {
  const url = asset('../public/hdr/env.hdr');
  const load = async (type) => {
    const loader = new HDRLoader();
    if (type) loader.type = type;
    const tex = await loader.loadAsync(url);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  };
  try {
    return await load();
  } catch (e) {
    console.warn('HDR half-float miss, FloatType', e);
    return await load(THREE.FloatType);
  }
}

function applyRenderer(renderer, webgl) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, webgl ? 1.25 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.55;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);
}

async function bootRenderer() {
  const common = { antialias: true, powerPreference: 'high-performance' };
  const wantGL = forceGLQuery
    || (typeof navigator.gpu === 'undefined' && /\bFirefox\b/.test(navigator.userAgent));

  const make = async (forceWebGL) => {
    const renderer = new THREE.WebGPURenderer({ ...common, forceWebGL });
    applyRenderer(renderer, forceWebGL);
    await renderer.init();
    return renderer;
  };

  try {
    return { renderer: await make(wantGL), webgl: wantGL };
  } catch (e) {
    console.warn('WebGPU init failed, WebGL2 backend', e);
    document.querySelectorAll('canvas').forEach((c) => c.remove());
    return { renderer: await make(true), webgl: true };
  }
}

async function main() {
  let renderer;
  let webgl = false;
  try {
    ({ renderer, webgl } = await bootRenderer());
  } catch (e) {
    fail('Need WebGL2 (current Firefox / Chrome / Edge / Safari).', e);
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x9ec8e8, 0.0065);

  const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.15, 2000000);
  camera.position.set(0.2, 1.72, 24.8);
  scene.add(camera);

  let sky;
  try {
    sky = createSky();
    scene.add(sky.mesh);
  } catch (e) {
    console.warn('SkyMesh miss', e);
    const sunDir = new THREE.Vector3();
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(44), THREE.MathUtils.degToRad(28));
    sky = { mesh: null, sunDir };
  }

  let env = null;
  try {
    env = await loadEnv();
    scene.environment = env;
    scene.environmentIntensity = 0.38;
  } catch (e) {
    console.warn('HDR miss', e);
  }

  const hemi = new THREE.HemisphereLight(0xa8d4ff, 0x3a4a28, 0.48);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d0, 2.6);
  sun.position.copy(sky.sunDir).multiplyScalar(90);
  sun.castShadow = true;
  const shadowRes = webgl ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowRes, shadowRes);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  const terrain = createTerrain();
  scene.add(terrain.group);

  const castle = createCastle(env);
  scene.add(castle.group);

  const bridge = createBridge();
  scene.add(bridge.group);

  let water;
  try {
    water = createWater();
    scene.add(water.mesh);
    if (env) water.mesh.material.envMapIntensity = 1.2;
  } catch (e) {
    console.warn('TSL water miss', e);
  }

  const trees = createTrees();
  scene.add(trees.group);

  const mario = createMario();
  scene.add(mario.group);

  const props = createProps();
  scene.add(props.group);

  const flyby = createFlyby(camera);
  let controls = null;
  if (orbitMode) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 8, -20);
    controls.maxDistance = 120;
  }

  const post = createPost(renderer, scene, camera);

  const clock = new THREE.Timer();
  clock.connect(document);
  let frames = 0;
  let fpsT = 0;

  renderer.setAnimationLoop(() => {
    clock.update();
    const t = clock.getElapsed();
    const dt = clock.getDelta();

    if (!orbitMode) flyby.apply(t);
    else controls.update();

    mario.update(t);
    trees.update(t);
    props.update(t);

    post.render();

    frames++;
    fpsT += dt;
    if (fpsEl && fpsT >= 0.5) {
      fpsEl.textContent = `${Math.round(frames / fpsT)}`;
      frames = 0;
      fpsT = 0;
    }
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  document.body.classList.add('live');
  if (debug) {
    console.info('castle-grounds loop', LOOP, 's', post.enabled ? 'bloom' : 'no-bloom', webgl ? 'webgl2' : 'webgpu');
  }
}

main().catch((e) => fail('boot failed', e));
