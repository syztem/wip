import { Vector3 } from 'three';
import { KEEP_Z, FRONT_Z, ROSE_Y0, ROSE_H } from '../scene/layout.js';

const v = (x, y, z) => new Vector3(x, y, z);

const doorZ = KEEP_Z + FRONT_Z;
const roseMidY = ROSE_Y0 + ROSE_H * 0.5;

function orbit(radius, y, lookY, n = 10) {
  const path = [];
  const look = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI * 0.15;
    path.push(v(Math.cos(a) * radius, y + Math.sin(i * 0.7) * 1.2, KEEP_Z + Math.sin(a) * radius));
    look.push(v(0, lookY, KEEP_Z + 2));
  }
  return { path, look };
}

const circuit = orbit(58, 26, 13, 12);

/** 90s reel. well replaced by garden. welcome folded into endcard. */
export const SHOTS = [
  {
    id: 'logo', duration: 8, fov: [42, 46], ease: 'easeInOut', tension: 0.25,
    path: [v(54, 28, 52), v(40, 22, 40), v(28, 16, 32), v(18, 12, 26)],
    look: [v(0, 14, KEEP_Z + 4), v(0, 13, KEEP_Z + 6), v(0, 12, KEEP_Z + 8), v(0, 11, KEEP_Z + 10)],
  },
  {
    id: 'approach', duration: 8, fov: [48, 46], ease: 'easeInOut', tension: 0.28,
    path: [v(7.5, 3.6, 26), v(5.4, 3.4, 20), v(3.8, 3.2, 14), v(2.6, 3.1, 8)],
    look: [v(0, 6.5, KEEP_Z + 8), v(0, 7.2, KEEP_Z + 6), v(0, 8.0, KEEP_Z + 4), v(0, 8.6, doorZ)],
  },
  {
    id: 'plumber', duration: 7, fov: [40, 36], ease: 'easeInOut', tension: 0.26,
    path: [v(-5.4, 2.4, 20.5), v(-4.2, 2.35, 18.6), v(-3.2, 2.3, 17.0), v(-2.6, 2.35, 15.6)],
    look: [v(0.4, 1.55, 15.6), v(0.3, 1.58, 15.0), v(0.2, 1.6, 14.4), v(0.1, 1.62, 13.6)],
  },
  {
    id: 'bridge', duration: 8, fov: [46, 42], ease: 'easeInOut', tension: 0.24,
    path: [v(-10, 4.2, 2), v(-7.2, 3.6, -6), v(-3.4, 3.4, -12), v(1.2, 3.8, -16)],
    look: [v(0, 3.2, -8), v(0.4, 2.4, -12), v(0.8, 1.8, -14), v(0.6, 2.6, doorZ)],
  },
  {
    id: 'rose', duration: 7, fov: [44, 38], ease: 'easeInOut', tension: 0.28,
    path: [v(-14, 8.5, 4), v(-10, 11, -8), v(-6, 12.2, -16), v(-3.2, 12.4, doorZ + 8)],
    look: [v(0, 10, doorZ), v(0, 11.2, doorZ), v(0, 12.0, doorZ), v(0, 12.2, doorZ)],
  },
  {
    id: 'nave', duration: 8, fov: [50, 44], ease: 'easeInOut', tension: 0.26,
    path: [v(0.2, 3.2, doorZ + 6.5), v(0.1, 3.4, doorZ + 1.8), v(-1.6, 4.2, doorZ - 3.4), v(1.4, 5.4, KEEP_Z + 4)],
    look: [v(0, 4.5, doorZ - 2), v(0, 6.5, doorZ - 1), v(0, roseMidY - 1, doorZ), v(0, 8.5, doorZ)],
  },
  {
    id: 'garden', duration: 8, fov: [42, 36], ease: 'easeInOut', tension: 0.28,
    path: [v(11.4, 2.6, 16.5), v(10.2, 2.2, 13.8), v(9.0, 1.85, 12.0), v(8.4, 1.7, 10.6)],
    look: [v(8.4, 0.7, 12.4), v(8.2, 0.55, 11.8), v(8.0, 0.45, 11.4), v(7.8, 0.4, 11.0)],
  },
  {
    id: 'ascent', duration: 7, fov: [48, 52], ease: 'easeInOut', tension: 0.24,
    path: [v(14, 6, KEEP_Z + 18), v(22, 16, KEEP_Z + 6), v(20, 28, KEEP_Z - 10), v(8, 40, KEEP_Z - 18)],
    look: [v(0, 14, KEEP_Z), v(0, 20, KEEP_Z), v(0, 28, KEEP_Z), v(0, 36, KEEP_Z)],
  },
  {
    id: 'storm', duration: 8, fov: [52, 46], ease: 'easeInOut', tension: 0.22,
    path: [v(-32, 6.5, KEEP_Z + 16), v(-18, 4.8, KEEP_Z - 6), v(0, 5.2, KEEP_Z - 22), v(20, 5.5, KEEP_Z - 4), v(30, 7.0, KEEP_Z + 18)],
    look: [v(-6, 10, KEEP_Z + 2), v(0, 11, KEEP_Z), v(2, 12, KEEP_Z + 2), v(6, 11, KEEP_Z + 4), v(8, 10, KEEP_Z + 8)],
  },
  {
    id: 'circuit', duration: 7, fov: [44, 44], ease: 'linear', tension: 0.2, closed: true,
    path: circuit.path,
    look: circuit.look,
  },
  {
    id: 'night', duration: 7, fov: [42, 40], ease: 'easeInOut', tension: 0.28,
    path: [v(-9, 3.4, 22), v(-4.5, 3.1, 18), v(2.0, 3.0, 16), v(7.5, 3.6, 12)],
    look: [v(-1.2, 1.8, 14.5), v(0.2, 1.7, 14.2), v(1.2, 1.7, 14.0), v(0.4, 3.4, KEEP_Z + 18)],
  },
  {
    id: 'endcard', duration: 7, fov: [44, 40], ease: 'easeInOut', tension: 0.25,
    path: [v(12, 10, 28), v(22, 18, 38), v(34, 26, 50), v(46, 32, 62)],
    look: [v(0, 12, KEEP_Z + 2), v(0, 14, KEEP_Z), v(0, 16, KEEP_Z), v(0, 18, KEEP_Z + 4)],
  },
];
