import * as THREE from 'three/webgpu';
import { FogExp2, Clock } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createFlyby } from './flyby.js';
import { createTerrain } from './scene/terrain.js';
import { createCastle } from './scene/castle.js';
import { createSky } from './scene/sky.js';
import { createWater } from './scene/water.js';
import { createTrees } from './scene/trees.js';
import { createProps } from './scene/props.js';
import { createMario } from './scene/mario.js';
import { createPost } from './post.js';

const CLEAR = 0x7eb7e8;
const debug = /(?:\?|&)debug=1(?:&|$)/.test(location.search);
const orbit = /(?:\?|&)orbit=1(?:&|$)/.test(location.search);
const forceGLQuery = /(?:\?|&)webgl=1(?:&|$)/.test(location.search);
const wantGPUQuery = /(?:\?|&)webgpu=1(?:&|$)/.test(location.search);
const bloomQuery = /(?:\?|&)bloom=1(?:&|$)/.test(location.search);
const errEl = document.getElementById('err');
const fpsEl = document.getElementById('fps');

function fail(msg, err) {
  console.error(msg, err);
  document.body.classList.add('dead');
  document.body.classList.remove('live');
  if (errEl) {
    errEl.style.display = 'grid';
    errEl.textContent = msg;
  }
}

function asset(path) {
  return new URL(path, import.meta.url).href;
}

function uaFlags() {
  const ua = navigator.userAgent;
  const firefox = /\bFirefox\b/.test(ua);
  const safari = /\bSafari\b/.test(ua) && !/\b(?:Chrome|Chromium|CriOS|Edg|OPR|Firefox)\b/.test(ua);
  return { safari, firefox };
}

function withTimeout(promise, ms, label) {
  let id;
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
}

function applyRenderer(renderer, webgl) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, webgl ? 1.25 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  if (typeof renderer.setClearColor === 'function') renderer.setClearColor(CLEAR, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.background = '#7eb7e8';
  document.body.appendChild(renderer.domElement);
}

async function bootRenderer() {
  const common = { antialias: true, powerPreference: 'high-performance' };
  const { safari, firefox } = uaFlags();
  // Safari/Firefox: WebGPU init hangs or presents black. Chrome still tries GPU.
  const wantGL = forceGLQuery
    || (!wantGPUQuery && (safari || firefox || typeof navigator.gpu === 'undefined'));

  const make = async (forceWebGL) => {
    const renderer = new THREE.WebGPURenderer({ ...common, forceWebGL });
    await withTimeout(
      renderer.init(),
      forceWebGL ? 6000 : 2000,
      forceWebGL ? 'WebGL2 init' : 'WebGPU init',
    );
    applyRenderer(renderer, forceWebGL);
    return renderer;
  };

  try {
    return { renderer: await make(wantGL), webgl: wantGL };
  } catch (e) {
    console.warn('renderer init failed, WebGL2', e);
    document.querySelectorAll('canvas').forEach((c) => c.remove());
    return { renderer: await make(true), webgl: true };
  }
}

async function main() {
  const { renderer, webgl } = await bootRenderer();
  if (debug) console.info('boot', { webgl, gpu: !!navigator.gpu, ua: navigator.userAgent });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CLEAR);
  scene.fog = new FogExp2(CLEAR, 0.0038);

  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.15, 2000000);
  scene.add(camera);

  try {
    const env = await new HDRLoader().loadAsync(asset('../public/hdr/env.hdr'));
    env.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
  } catch (e) {
    console.warn('HDR miss', e);
  }

  const hemi = new THREE.HemisphereLight(0xc8dff5, 0x3a5a28, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d0, 2.35);
  sun.position.set(28, 42, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const sky = createSky({ useMesh: !webgl });
  scene.add(sky.mesh);
  sun.position.copy(sky.sunDir).multiplyScalar(60);

  const terrain = createTerrain();
  scene.add(terrain.mesh);
  if (terrain.path) scene.add(terrain.path);

  const castle = createCastle(scene.environment);
  scene.add(castle.group);

  const water = createWater({ nodes: !webgl });
  scene.add(water.mesh);

  const trees = createTrees();
  scene.add(trees.group);

  const props = createProps();
  scene.add(props.group);

  const mario = createMario();
  scene.add(mario.group);

  const flyby = createFlyby(camera);
  flyby.apply(0);

  let controls = null;
  if (orbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 8, -36);
  }

  const post = createPost(renderer, scene, camera, {
    bloomEnabled: bloomQuery && !webgl,
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new Clock();
  let frames = 0;
  let fpsT = 0;
  let shown = false;

  renderer.setAnimationLoop(() => {
    try {
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();
      if (!orbit) flyby.apply(t);
      else controls.update();
      mario.update(t);
      trees.update(t);
      props.update(t);
      post.render();
      if (!shown) {
        shown = true;
        document.body.classList.add('live');
      }
      if (debug && fpsEl) {
        frames++;
        fpsT += dt;
        if (fpsT >= 0.5) {
          fpsEl.textContent = `${Math.round(frames / fpsT)} fps · ${webgl ? 'webgl2' : 'webgpu'}${post.enabled ? ' · bloom' : ''}`;
          frames = 0;
          fpsT = 0;
        }
      }
    } catch (e) {
      renderer.setAnimationLoop(null);
      fail('render failed', e);
    }
  });
}

main().catch((e) => fail('boot failed', e));
