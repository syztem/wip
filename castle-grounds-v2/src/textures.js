import * as THREE from 'three/webgpu';
import { CanvasTexture } from 'three';
import { mulberry32, hashSeed } from './rand.js';

function canvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}
function toMap(c, repeatX, repeatY, srgb = true) {
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}
function rngFor(name) { return mulberry32(hashSeed(name.length * 7 + name.charCodeAt(0))); }

export function grassMap() {
  const [c, ctx] = canvas(256);
  const rng = rngFor('grass');
  ctx.fillStyle = '#2a7d34'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5200; i++) {
    const h = 108 + rng() * 28;
    const l = 26 + rng() * 24;
    ctx.fillStyle = `hsl(${h} 58% ${l}%)`;
    ctx.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2, 2 + rng() * 4);
  }
  return toMap(c, 48, 48);
}
export function dirtMap() {
  const [c, ctx] = canvas(256);
  const rng = rngFor('dirt');
  ctx.fillStyle = '#b08958'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `hsl(${28 + rng() * 16} 38% ${38 + rng() * 22}%)`;
    ctx.fillRect(rng() * 256, rng() * 256, 2, 2);
  }
  return toMap(c, 8, 22);
}
export function stoneMap() {
  const [c, ctx] = canvas(256);
  const rng = rngFor('stone');
  ctx.fillStyle = '#e8d4b0'; ctx.fillRect(0, 0, 256, 256);
  const bw = 32, bh = 16;
  for (let y = 0; y < 256; y += bh) {
    const off = (y / bh) % 2 === 0 ? 0 : bw * 0.5;
    for (let x = -bw; x < 256; x += bw) {
      ctx.fillStyle = `hsl(38 ${28 + rng() * 12}% ${68 + rng() * 14}%)`;
      ctx.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
      ctx.strokeStyle = 'rgba(90,70,40,0.28)';
      ctx.strokeRect(x + off + 0.5, y + 0.5, bw - 1, bh - 1);
    }
  }
  return toMap(c, 6, 8);
}
export function roofMap() {
  const [c, ctx] = canvas(128);
  const rng = rngFor('roof');
  ctx.fillStyle = '#b42020'; ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    ctx.strokeStyle = `rgba(60,8,8,${0.25 + rng() * 0.2})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
  }
  return toMap(c, 4, 4);
}
export function barkMap() {
  const [c, ctx] = canvas(128);
  const rng = rngFor('bark');
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(30,16,8,${0.3 + rng() * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(8 + rng() * 112, 0);
    ctx.lineTo(8 + rng() * 112, 128);
    ctx.stroke();
  }
  return toMap(c, 1, 3);
}
export function leafMap() {
  const [c, ctx] = canvas(128);
  const rng = rngFor('leaf');
  ctx.fillStyle = '#1f6b28'; ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `hsl(${118 + rng() * 22} 62% ${22 + rng() * 20}%)`;
    ctx.beginPath();
    ctx.ellipse(rng() * 128, rng() * 128, 3, 5, rng() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return toMap(c, 3, 3);
}
export function glassMap() {
  const [c, ctx] = canvas(256);
  ctx.fillStyle = '#1a2040'; ctx.fillRect(0, 0, 256, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6ec8ff'); g.addColorStop(0.45, '#f7b3d2'); g.addColorStop(1, '#c45aa0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(28, 250); ctx.lineTo(28, 90);
  ctx.quadraticCurveTo(128, -10, 228, 90);
  ctx.lineTo(228, 250); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.moveTo(128, 52); ctx.lineTo(148, 78); ctx.lineTo(128, 70); ctx.lineTo(108, 78); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(128, 96, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4dce8';
  ctx.beginPath();
  ctx.moveTo(128, 112);
  ctx.bezierCurveTo(168, 130, 188, 210, 128, 236);
  ctx.bezierCurveTo(68, 210, 88, 130, 128, 112);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,10,0.55)'; ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 220, 220);
  ctx.beginPath();
  ctx.moveTo(128, 18); ctx.lineTo(128, 238);
  ctx.moveTo(18, 128); ctx.lineTo(238, 128);
  ctx.stroke();
  return toMap(c, 1, 1);
}
