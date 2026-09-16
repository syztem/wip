import * as THREE from 'three/webgpu';
import { FogExp2, Clock } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createTerrain, sampleHeight } from './scene/terrain.js';
import { createCastle } from './scene/castle.js';
import { createSky } from './scene/sky.js';
import { createWater } from './scene/water.js';
import { createTrees } from './scene/trees.js';
import { createProps } from './scene/props.js';
import { createMario } from './scene/mario.js';
import { createPost } from './post.js';
import { createWorld } from './world/world.js';
import { createDirector } from './director/director.js';
import { SHOTS } from './director/shots.js';
import { createParticles } from './world/particles.js';
import { createAudio } from './audio/audio.js';
import { parseMoment, formatMoment } from './url.js';
import { createInput } from './player/input.js';
import { createPlayer } from './player/player.js';

const CLEAR = 0x7eb7e8;
const debug = /(?:\?|&)debug=1(?:&|$)/.test(location.search);
const debug2 = /(?:\?|&)debug=2(?:&|$)/.test(location.search);
const orbit = /(?:\?|&)orbit=1(?:&|$)/.test(location.search);
const forceGLQuery = /(?:\?|&)webgl=1(?:&|$)/.test(location.search);
const wantGPUQuery = /(?:\?|&)webgpu=1(?:&|$)/.test(location.search);
const bloomQuery = /(?:\?|&)bloom=1(?:&|$)/.test(location.search);
const dofQuery = /(?:\?|&)dof=1(?:&|$)/.test(location.search);
const aoQuery = /(?:\?|&)ao=1(?:&|$)/.test(location.search);
const nopostQuery = /(?:\?|&)nopost=1(?:&|$)/.test(location.search);
const muteQuery = /(?:\?|&)mute=1(?:&|$)/.test(location.search);
const playerQuery = /(?:\?|&)player=1(?:&|$)/.test(location.search);
const attractQuery = !/(?:\?|&)attract=0(?:&|$)/.test(location.search);
const helpQuery = /(?:\?|&)help=1(?:&|$)/.test(location.search);
const weatherQuery = (() => {
  const m = /(?:\?|&)weather=([a-z]+)(?:&|$)/.exec(location.search);
  return m && m[1] ? m[1] : 'clear';
})();

const errEl = document.getElementById('err');
const fpsEl = document.getElementById('fps');
const perfEl = document.getElementById('perf');
const themeColorEl = document.querySelector('meta[name="theme-color"]');
const moment = parseMoment();

const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = rmQuery.matches;
rmQuery.addEventListener?.('change', (e) => { reduceMotion = e.matches; });

if (debug2) document.body.classList.add('debug2');

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
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cap = coarse
    ? (webgl ? 1.0 : 1.5)
    : (webgl ? 1.25 : 1.75);
  renderer.setPixelRatio(Math.min(devicePixelRatio, cap));
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
  if (helpQuery) {
    document.body.classList.add('dead');
    if (errEl) {
      errEl.classList.add('help');
      errEl.style.display = 'grid';
      errEl.textContent = [
        'castle-grounds — URL reference',
        '',
        'Query (?):',
        '  ?debug=1                    fps + world hour + shot + passes',
        '  ?debug=2                    also show the perf panel',
        '  ?orbit=1                    OrbitControls around the castle',
        '  ?webgl=1                    force WebGL2',
        '  ?webgpu=1                   force WebGPU (if available)',
        '  ?bloom=1                    enable bloom (WebGPU)',
        '  ?dof=1                      enable depth-of-field (WebGPU)',
        '  ?ao=1                       enable ambient occlusion (WebGPU)',
        '  ?nopost=1                   disable post-processing',
        '  ?weather=clear|overcast|rain|storm',
        '  ?player=1                   boot in take-the-wheel mode',
        '  ?attract=0                  disable idle auto-resume',
        '  ?mute=1                     disable audio',
        '  ?help=1                     this list',
        '',
        'Hash (#):',
        '  #shot=<id>&u=<0..1>         jump to a shot at a given fraction',
        '  #clock=<hours>              set world hour (0..24, wraps)',
        '  #weather=<preset>           override the query-string weather',
        '  #play=1                     do not pause on boot',
        '',
        'Keys:',
        '  WASD / arrows               move',
        '  Space                       jump / ascend (freecam)',
        '  C                           descend (freecam)',
        '  Shift                       run / boost',
        '  F                           toggle mario / freecam',
        '  Esc                         release pointer lock',
        '',
        'Click anywhere to take the wheel. Idle 20s to hand it back.',
      ].join('\n');
    }
    return;
  }

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

  const weatherBoot = moment.weather ?? weatherQuery;
  const world = createWorld({ startHour: 7, hoursPerSecond: 0.4, weather: weatherBoot });

  const sky = createSky({ useMesh: !webgl, world });
  scene.add(sky.mesh);

  function applyWorld() {
    const p = world.palette;
    const w = world.weather;
    sun.color.copy(p.sunColor);
    sun.intensity = p.sunIntensity * (1 - w.cloudCoverage * 0.55);
    sun.position.copy(world.lightDir).multiplyScalar(60);
    hemi.color.copy(p.skyColor);
    hemi.groundColor.copy(p.groundColor);
    hemi.intensity = p.hemiIntensity * (1 + w.cloudCoverage * 0.15);
    scene.fog.color.copy(p.fogColor);
    scene.fog.density = p.fogDensity + w.fogBias * 0.004;
    scene.background.copy(p.bgColor);
    scene.environmentIntensity = p.envIntensity;
    sky.update();
    if (themeColorEl) {
      themeColorEl.setAttribute('content', '#' + scene.background.getHexString());
    }
  }
  applyWorld();

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

  const director = createDirector(camera, { shots: SHOTS });

  const reel = { t: 0, paused: false };

  if (moment.clock != null) world.setHour(moment.clock);
  if (moment.shot) {
    const rt = director.reelTimeFor(moment.shot, moment.u);
    if (rt != null) { reel.t = rt; reel.paused = !moment.play; }
    else console.warn(`moment: unknown shot "${moment.shot}"`);
  }
  director.apply(reel.t);

  let controls = null;
  if (orbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 8, -36);
  }

  let post;
  try {
    post = await createPost(renderer, scene, camera, {
      bloom: bloomQuery && !webgl,
      dof:   dofQuery   && !webgl,
      ao:    aoQuery    && !webgl,
      grade: !nopostQuery,
    });
  } catch (e) {
    console.warn('post init failed, falling back to raw render', e);
    post = {
      enabled: false,
      passes: [],
      grade: { contrast: 1, saturation: 1, vignette: 0 },
      render() { renderer.render(scene, camera); },
    };
  }

  let particles = null;
  try {
    particles = createParticles({ rain: 600, fireflies: 40, seed: 1 });
    scene.add(particles.group);
  } catch (e) {
    console.warn('particles init failed', e);
  }

  const audio = createAudio();
  if (!muteQuery) {
    if (props.waterfall) {
      const wp = props.waterfall.position;
      audio.setWaterfallPosition(wp.x, wp.y, wp.z);
    }
    const kick = () => {
      audio.enable();
      if (!audio.enabled) return;
      removeEventListener('pointerdown', kick);
      removeEventListener('keydown', kick);
      removeEventListener('touchstart', kick);
    };
    addEventListener('pointerdown', kick, { passive: true });
    addEventListener('keydown', kick);
    addEventListener('touchstart', kick, { passive: true });
  }

  let input = null;
  let player = null;
  if (!orbit) {
    try {
      input = createInput(renderer.domElement);
      player = createPlayer({
        camera, director, mario, terrain: sampleHeight,
        input, reel,
        startInPlayer: playerQuery,
        autoResume: attractQuery,
        fadeMs: reduceMotion ? 2500 : 1500,
      });
    } catch (e) {
      console.warn('player init failed; reel-only mode', e);
      input = null;
      player = null;
    }
  }

  const shareEl = document.getElementById('share');
  let lastShareLabel = '';
  function paintShare() {
    if (!shareEl) return;
    const label = reel.paused ? 'resume' : 'share';
    if (label !== lastShareLabel) {
      shareEl.textContent = label;
      lastShareLabel = label;
    }
    document.body.classList.toggle('paused', reel.paused);
    document.body.classList.toggle('player', player ? player.state !== 'director' : false);
  }

  let copyToken = 0;
  async function onClickShare() {
    if (reel.paused) {
      reel.paused = false;
      history.replaceState(null, '', location.pathname + location.search);
      paintShare();
      return;
    }
    const { id, u } = director.shotAt(reel.t);
    const hash = formatMoment({
      shot: id, u,
      clock: world.hours,
      weather: world.weather.preset,
    });
    history.replaceState(null, '', location.pathname + location.search + hash);
    const url = new URL(location.href);
    url.hash = hash;
    let ok = false;
    try { await navigator.clipboard.writeText(url.toString()); ok = true; }
    catch { /* the URL bar already shows the moment */ }
    reel.paused = true;
    paintShare();
    if (ok) {
      const mine = ++copyToken;
      shareEl.textContent = 'copied';
      lastShareLabel = 'copied';
      setTimeout(() => { if (copyToken === mine) paintShare(); }, 1300);
    }
  }
  if (shareEl) {
    shareEl.addEventListener('click', onClickShare);
    shareEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClickShare(); }
    });
    paintShare();
  }

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

      world.advance(dt);
      applyWorld();

      if (player) {
        player.update(dt, t);
        if (player.state === 'director') mario.update(t);
      } else if (orbit) {
        controls.update();
      } else {
        if (!reel.paused) reel.t += dt * (reduceMotion ? 0.5 : 1);
        director.apply(reel.t);
        mario.update(t);
      }

      trees.update(t, world);
      props.update(t, world);
      particles?.update({ dt, t, camera, world });
      audio.update(camera, world);
      post.render();
      paintShare();

      if (!shown) {
        shown = true;
        document.body.classList.add('live');
      }

      if (debug && fpsEl) {
        frames++;
        fpsT += dt;
        if (fpsT >= 0.5) {
          const h = world.hours;
          const hh = String(Math.floor(h)).padStart(2, '0');
          const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
          const shot = director.shotAt(reel.t).id;
          const tags = post.passes.length ? ` · ${post.passes.join('+')}` : '';
          const modeTag = player && player.state !== 'director'
            ? ` · ${player.mode}${player.state === 'entering' ? '(in)' : player.state === 'leaving' ? '(out)' : ''}`
            : '';
          fpsEl.textContent =
            `${Math.round(frames / fpsT)} fps · ${webgl ? 'webgl2' : 'webgpu'} · ${hh}:${mm} · ${shot}${tags}${modeTag}${reel.paused ? ' · paused' : ''}`;

          if (debug2 && perfEl) {
            const info = renderer.info;
            const pos = camera.position;
            const st = player ? player.state : 'director';
            const md = player ? player.mode : '—';
            const g = post.grade;
            perfEl.textContent =
              `t     ${reel.t.toFixed(2)}s  ·  ${shot}\n` +
              `hour  ${hh}:${mm}  ·  ${world.weather.preset}\n` +
              `state ${st}  ·  ${md}\n` +
              `cam   ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}  ·  fov ${camera.fov.toFixed(1)}\n` +
              `draw  ${info.render.calls}  ·  tri ${info.render.triangles.toLocaleString()}\n` +
              `post  ${post.passes.join('+') || '—'}\n` +
              `grade c${g.contrast} s${g.saturation} v${g.vignette}\n` +
              `px    ${renderer.getPixelRatio().toFixed(2)}  ·  ${webgl ? 'webgl2' : 'webgpu'}`;
          }

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
