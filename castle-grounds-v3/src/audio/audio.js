import { Vector3 } from 'three';

function pinkishNoiseBuffer(ctx, seconds = 3) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = 0.98 * last + 0.02 * w;
    d[i] = last * 8;
  }
  return buf;
}

function makeSource(ctx, buffer) {
  const s = ctx.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  return s;
}

export function createAudio() {
  let ctx = null, master = null, windGain = null, rainGain = null, waterfallPanner = null;
  let enabled = false;
  const _fwd = new Vector3();
  const _up = new Vector3(0, 1, 0);

  function enable() {
    if (enabled) return;
    enabled = true;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) { console.warn('audio: no AudioContext'); return; }
    ctx = new Ctor();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
    const now = ctx.currentTime;
    master.gain.linearRampToValueAtTime(0.6, now + 2.5);

    const noise = pinkishNoiseBuffer(ctx, 3);

    const wind = makeSource(ctx, noise);
    const windLP = ctx.createBiquadFilter();
    windLP.type = 'lowpass'; windLP.frequency.value = 480; windLP.Q.value = 0.7;
    windGain = ctx.createGain(); windGain.gain.value = 0.0;
    wind.connect(windLP).connect(windGain).connect(master);
    wind.start();

    const rain = makeSource(ctx, noise);
    const rainHP = ctx.createBiquadFilter();
    rainHP.type = 'highpass'; rainHP.frequency.value = 1400;
    rainGain = ctx.createGain(); rainGain.gain.value = 0.0;
    rain.connect(rainHP).connect(rainGain).connect(master);
    rain.start();

    const falls = makeSource(ctx, noise);
    const fallsBP = ctx.createBiquadFilter();
    fallsBP.type = 'bandpass'; fallsBP.frequency.value = 800; fallsBP.Q.value = 0.6;
    const fallsGain = ctx.createGain(); fallsGain.gain.value = 0.45;
    waterfallPanner = ctx.createPanner();
    waterfallPanner.panningModel = 'HRTF';
    waterfallPanner.distanceModel = 'inverse';
    waterfallPanner.refDistance = 6;
    waterfallPanner.maxDistance = 140;
    waterfallPanner.rolloffFactor = 1.4;
    falls.connect(fallsBP).connect(fallsGain).connect(waterfallPanner).connect(master);
    falls.start();
  }

  return {
    get enabled() { return enabled; },
    enable,
    setWaterfallPosition(x, y, z) {
      if (!waterfallPanner) return;
      if (waterfallPanner.positionX) {
        waterfallPanner.positionX.value = x;
        waterfallPanner.positionY.value = y;
        waterfallPanner.positionZ.value = z;
      } else if (waterfallPanner.setPosition) {
        waterfallPanner.setPosition(x, y, z);
      }
    },
    update(camera, world) {
      if (!enabled || !ctx) return;
      const l = ctx.listener;
      camera.getWorldDirection(_fwd);
      if (l.positionX) {
        l.positionX.value = camera.position.x;
        l.positionY.value = camera.position.y;
        l.positionZ.value = camera.position.z;
        l.forwardX.value = _fwd.x; l.forwardY.value = _fwd.y; l.forwardZ.value = _fwd.z;
        l.upX.value = _up.x; l.upY.value = _up.y; l.upZ.value = _up.z;
      } else if (l.setPosition && l.setOrientation) {
        l.setPosition(camera.position.x, camera.position.y, camera.position.z);
        l.setOrientation(_fwd.x, _fwd.y, _fwd.z, _up.x, _up.y, _up.z);
      }
      const w = world.weather;
      windGain.gain.value = 0.06 + w.windStrength * 0.11;
      rainGain.gain.value = w.rain * 0.22;
    },
  };
}
