import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createSea } from './sea.js';
import { createLens } from './lens.js';
import { createRing } from './ring.js';
import { createSparks } from './sparks.js';
import { createPost } from './post.js';
import { Quality } from './quality.js';

const proof = /(?:\?|&)(?:proof|p0)=1(?:&|$)/.test(location.search);
const debug = /(?:\?|&)debug=1(?:&|$)/.test(location.search);
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

/** Pages-safe: import.meta.url survives missing trailing slash on /<repo>. */
function asset(relFromThisModule) {
  return new URL(relFromThisModule, import.meta.url).href;
}

async function loadEnv() {
  const loader = new HDRLoader();
  const tex = await loader.loadAsync(asset('../public/hdr/env.hdr'));
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

async function main() {
  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x020304, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.shadowMap.enabled = !proof;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);

  try {
    await renderer.init();
  } catch (e) {
    fail('WebGPU init failed. Need a GPU + current Chrome / Edge / Safari.', e);
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020304);

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0.35, 3.15, 6.4);
  scene.add(camera);

  try {
    const env = await loadEnv();
    scene.environment = env;
    scene.environmentIntensity = 0.42;
  } catch (e) {
    console.warn('HDR miss — unlit-ish IBL', e);
  }

  const hemi = new THREE.HemisphereLight(0x6a7a88, 0x080604, 0.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8d2, 2.1);
  sun.position.set(3.4, 7.2, 2.2);
  sun.castShadow = !proof;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 22;
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const sea = createSea({ segments: proof ? 64 : 192, size: 8 });
  scene.add(sea.mesh);

  const lens = createLens();
  scene.add(lens.group);
  if (scene.environment) {
    lens.glass.material.envMap = scene.environment;
    lens.glass.material.envMapIntensity = 1;
  }

  const ring = createRing();
  scene.add(ring.root);

  let sparks = null;
  if (!proof) {
    try {
      sparks = createSparks({
        renderer,
        scene,
        attractor: lens.group.position,
        count: 4096,
      });
    } catch (e) {
      console.warn('sparks compute skipped', e);
      sparks = null;
    }
  }

  let post = null;
  let bloomOn = !proof;
  if (bloomOn) post = createPost(renderer, scene, camera);
  if (post && !post.enabled) bloomOn = false;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.target.set(0, 0.85, 0);
  controls.minDistance = 2.2;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.49;
  if (matchMedia('(pointer: coarse)').matches) {
    controls.enablePan = false;
    controls.rotateSpeed = 0.55;
  }
  const stopIdle = () => { controls.autoRotate = false; };
  renderer.domElement.addEventListener('pointerdown', stopIdle, { once: true });
  renderer.domElement.addEventListener('wheel', stopIdle, { once: true, passive: true });

  const clock = new THREE.Clock();
  const quality = new Quality({ el: debug ? fpsEl : null });
  if (!debug && fpsEl) fpsEl.textContent = '';

  const applyLevel = (level) => {
    if (sparks) {
      if (level === 0) sparks.setCount(4096);
      else if (level === 1) sparks.setCount(1024);
      else sparks.setCount(0);
    }
    if (level >= 2) renderer.setPixelRatio(1);
    else renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    bloomOn = !proof && post?.enabled && level < 3;
  };

  if (debug) {
    const gui = new GUI({ title: 'signal-well' });
    gui.add(renderer, 'toneMappingExposure', 0.2, 1.6, 0.01);
    if (post?.bloomPass) {
      gui.add(post.bloomPass.threshold, 'value', 0, 1, 0.01).name('bloom thr');
      gui.add(post.bloomPass.strength, 'value', 0, 2, 0.01).name('bloom str');
      gui.add(post.bloomPass.radius, 'value', 0, 1, 0.01).name('bloom rad');
    }
  }

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  let unveiled = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    controls.update();
    lens.update(t);
    sparks?.update(lens.group.position);
    quality.tick(dt, { onLevel: applyLevel });
    if (bloomOn && post) post.render();
    else renderer.render(scene, camera);
    if (!unveiled) {
      unveiled = true;
      document.body.classList.add('live');
    }
  });
}

main().catch((e) => fail('boot failed', e));
