import * as THREE from 'three/webgpu';
import { createWeather } from './weather.js';

function key(h, s) {
  return {
    h,
    sunI: s.sunI, hemiI: s.hemiI, fogD: s.fogD, envI: s.envI, turb: s.turb, ray: s.ray,
    sunColor:    new THREE.Color().setHex(s.sun, THREE.SRGBColorSpace),
    skyColor:    new THREE.Color().setHex(s.sky, THREE.SRGBColorSpace),
    groundColor: new THREE.Color().setHex(s.gnd, THREE.SRGBColorSpace),
    fogColor:    new THREE.Color().setHex(s.fog, THREE.SRGBColorSpace),
    bgColor:     new THREE.Color().setHex(s.bg,  THREE.SRGBColorSpace),
  };
}

const KEYS = [
  key(0.0,  { sun: 0x101828, sunI: 0.03, sky: 0x0a1020, gnd: 0x060810, hemiI: 0.15, fog: 0x0a1420, fogD: 0.0060, bg: 0x081020, envI: 0.12, turb: 3.0, ray: 0.4 }),
  key(5.0,  { sun: 0x303050, sunI: 0.08, sky: 0x1a1e38, gnd: 0x0a0e18, hemiI: 0.20, fog: 0x1a2038, fogD: 0.0058, bg: 0x182038, envI: 0.18, turb: 3.5, ray: 0.8 }),
  key(6.0,  { sun: 0xff8050, sunI: 0.50, sky: 0x40507a, gnd: 0x28281c, hemiI: 0.32, fog: 0x506080, fogD: 0.0050, bg: 0x506080, envI: 0.30, turb: 5.0, ray: 2.2 }),
  key(7.0,  { sun: 0xffb070, sunI: 1.30, sky: 0x90a8d0, gnd: 0x3a4828, hemiI: 0.50, fog: 0xa8bcd8, fogD: 0.0045, bg: 0xa8bcd8, envI: 0.48, turb: 5.5, ray: 2.5 }),
  key(10.0, { sun: 0xfff1d0, sunI: 2.20, sky: 0xc8dff5, gnd: 0x3a5a28, hemiI: 0.55, fog: 0x7eb7e8, fogD: 0.0038, bg: 0x7eb7e8, envI: 0.55, turb: 5.5, ray: 2.35 }),
  key(12.0, { sun: 0xfff8e8, sunI: 2.50, sky: 0xd8e8f8, gnd: 0x3a5a28, hemiI: 0.60, fog: 0x8ec4ec, fogD: 0.0035, bg: 0x8ec4ec, envI: 0.60, turb: 4.5, ray: 2.6 }),
  key(16.0, { sun: 0xffe8c0, sunI: 2.10, sky: 0xc0d4ee, gnd: 0x3a5a28, hemiI: 0.55, fog: 0x84bce4, fogD: 0.0038, bg: 0x84bce4, envI: 0.55, turb: 5.0, ray: 2.4 }),
  key(18.0, { sun: 0xffa050, sunI: 1.20, sky: 0xd0a888, gnd: 0x4a3828, hemiI: 0.45, fog: 0xd0a888, fogD: 0.0045, bg: 0xd0a888, envI: 0.45, turb: 6.0, ray: 2.8 }),
  key(19.0, { sun: 0xff6040, sunI: 0.60, sky: 0x805060, gnd: 0x302018, hemiI: 0.32, fog: 0x805060, fogD: 0.0052, bg: 0x60405c, envI: 0.30, turb: 5.5, ray: 1.8 }),
  key(20.0, { sun: 0x403060, sunI: 0.15, sky: 0x302848, gnd: 0x181020, hemiI: 0.22, fog: 0x2a2440, fogD: 0.0056, bg: 0x202040, envI: 0.20, turb: 4.0, ray: 0.8 }),
  key(22.0, { sun: 0x181828, sunI: 0.05, sky: 0x101828, gnd: 0x080c14, hemiI: 0.16, fog: 0x0e1824, fogD: 0.0059, bg: 0x0c1424, envI: 0.14, turb: 3.2, ray: 0.4 }),
  key(24.0, { sun: 0x101828, sunI: 0.03, sky: 0x0a1020, gnd: 0x060810, hemiI: 0.15, fog: 0x0a1420, fogD: 0.0060, bg: 0x081020, envI: 0.12, turb: 3.0, ray: 0.4 }),
];

const lerp = (a, b, t) => a + (b - a) * t;

function samplePalette(h, out) {
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const span = b.h - a.h;
  const t = span > 0 ? Math.min(1, Math.max(0, (h - a.h) / span)) : 0;
  out.sunColor.copy(a.sunColor).lerp(b.sunColor, t);
  out.skyColor.copy(a.skyColor).lerp(b.skyColor, t);
  out.groundColor.copy(a.groundColor).lerp(b.groundColor, t);
  out.fogColor.copy(a.fogColor).lerp(b.fogColor, t);
  out.bgColor.copy(a.bgColor).lerp(b.bgColor, t);
  out.sunIntensity  = lerp(a.sunI,  b.sunI,  t);
  out.hemiIntensity = lerp(a.hemiI, b.hemiI, t);
  out.fogDensity    = lerp(a.fogD,  b.fogD,  t);
  out.envIntensity  = lerp(a.envI,  b.envI,  t);
  out.turbidity     = lerp(a.turb,  b.turb,  t);
  out.rayleigh      = lerp(a.ray,   b.ray,   t);
}

function sunDirection(hours, out) {
  const dayT = (hours - 6) / 12;
  const el = Math.sin(dayT * Math.PI);
  const elAngle = Math.asin(Math.min(1, Math.max(-1, el)));
  const az = THREE.MathUtils.lerp(Math.PI * 0.5, -Math.PI * 0.5, dayT);
  return out.setFromSphericalCoords(1, Math.PI * 0.5 - elAngle, az);
}

export function createWorld({ startHour = 7, hoursPerSecond = 0.4, wrapHours = 24, weather = 'clear' } = {}) {
  let raw = startHour;
  const sunDir = new THREE.Vector3();
  const lightDir = new THREE.Vector3();
  const weatherState = createWeather({ preset: weather });
  const palette = {
    sunColor: new THREE.Color(), skyColor: new THREE.Color(), groundColor: new THREE.Color(),
    fogColor: new THREE.Color(), bgColor: new THREE.Color(),
    sunIntensity: 0, hemiIntensity: 0, fogDensity: 0,
    envIntensity: 0, turbidity: 0, rayleigh: 0,
  };

  function recompute() {
    const h = ((raw % wrapHours) + wrapHours) % wrapHours;
    sunDirection(h, sunDir);
    samplePalette(h, palette);
    lightDir.copy(sunDir);
    if (lightDir.y < -0.05) { lightDir.y = -0.05; lightDir.normalize(); }
  }
  recompute();

  return {
    get hours() { return ((raw % wrapHours) + wrapHours) % wrapHours; },
    sunDir, lightDir, palette,
    weather: weatherState,
    advance(dt) { raw += dt * hoursPerSecond; weatherState.advance(dt); recompute(); },
    setHour(h) { raw = h; recompute(); },
  };
}
