import { Vector3 } from 'three';
import { KEEP_Z, FRONT_Z, ROSE_Y0, ROSE_H } from '../scene/layout.js';

const v = (x, y, z) => new Vector3(x, y, z);

const doorZ = KEEP_Z + FRONT_Z;
const roseMidY = ROSE_Y0 + ROSE_H * 0.5;
const innerZ = doorZ - 3.2;

/**
 * 120s closed reel. Beats borrowed from 3DMark chapter structure:
 * logo → ground approach → hero → tech close-up → interior → vertical
 * flex → weather abuse → orbital → night → return → score card.
 * Coordinates match the hollow-keep layout (KEEP_Z = -38).
 */
export const SHOTS = [
  {
    id: 'logo', duration: 8, fov: [38, 48], ease: 'easeInOut',
    path: [v(42, 18, 46), v(28, 14, 38), v(16, 10, 30), v(8, 7.2, 26)],
    look: [v(0, 16, KEEP_Z), v(0, 15, KEEP_Z + 2), v(0, 14, KEEP_Z + 4), v(0, 12, KEEP_Z + 6)],
  },
  {
    id: 'approach', duration: 10, fov: [58, 50], ease: 'smoothstep',
    path: [v(0.4, 1.7, 28), v(0.25, 1.85, 22), v(0.12, 2.05, 16), v(0.05, 2.25, 10)],
    look: [v(0, 8.5, KEEP_Z + 4), v(0, 9.2, KEEP_Z + 2), v(0, 10.4, KEEP_Z), v(0, 11.2, doorZ)],
  },
  {
    id: 'plumber', duration: 8, fov: [42, 28], ease: 'smoothstep',
    path: [v(-2.4, 1.55, 17.2), v(-1.7, 1.7, 16.4), v(-1.15, 1.82, 15.6), v(-0.7, 1.9, 14.8)],
    look: [v(0.05, 1.7, 16.0), v(0.02, 1.72, 15.4), v(0.0, 1.74, 14.6), v(0.0, 1.76, 13.6)],
  },
  {
    id: 'bridge', duration: 10, fov: [52, 36], ease: 'smoothstep',
    path: [v(-3.2, 1.55, -6), v(-0.4, 1.7, -11.2), v(2.6, 1.85, -13.4), v(2.1, 1.72, -15.6)],
    look: [v(0.4, 2.4, -12), v(1.0, 1.85, -13.6), v(1.15, 1.7, -14.2), v(1.1, 1.65, -14.8)],
  },
  {
    id: 'rose', duration: 8, fov: [48, 26], ease: 'easeInOut',
    path: [v(-6.5, 9.2, -8), v(-3.2, 11.2, -16), v(-1.2, 12.4, doorZ + 6), v(0.0, 12.55, doorZ + 2.4)],
    look: [v(0, 12.2, doorZ), v(0, 12.4, doorZ), v(0, 12.55, doorZ), v(0, 12.6, doorZ)],
  },
  {
    id: 'nave', duration: 10, fov: [62, 48], ease: 'smoothstep',
    path: [v(0.04, 2.35, doorZ + 0.6), v(0.02, 2.55, doorZ - 1.6), v(-0.5, 4.4, innerZ + 1.2), v(0.4, 6.2, KEEP_Z + 1.5)],
    look: [v(0, roseMidY, doorZ), v(0, roseMidY + 0.4, doorZ), v(0, 12.8, doorZ), v(0, 13.2, doorZ)],
  },
  {
    id: 'well', duration: 8, fov: [50, 38], ease: 'easeInOut',
    path: [v(-2.4, 3.2, KEEP_Z - 1.2), v(2.4, 4.4, KEEP_Z - 4.2), v(-1.6, 6.2, KEEP_Z - 5.4), v(0.2, 3.6, KEEP_Z - 1.6)],
    look: [v(-0.4, 2.2, KEEP_Z + 4), v(0.6, 2.4, KEEP_Z + 5), v(0, 12.4, doorZ), v(0.2, 2.1, KEEP_Z + 5)],
  },
  {
    id: 'ascent', duration: 10, fov: [54, 64], ease: 'easeInOut',
    path: [v(10, 4, KEEP_Z + 14), v(16, 12, KEEP_Z + 4), v(22, 24, KEEP_Z - 6), v(18, 38, KEEP_Z - 16), v(6, 48, KEEP_Z - 8)],
    look: [v(0, 16, KEEP_Z), v(0, 22, KEEP_Z - 1), v(0, 32, KEEP_Z - 1), v(0, 42, KEEP_Z - 1), v(0, 44, KEEP_Z)],
  },
  {
    id: 'storm', duration: 12, fov: [68, 52], ease: 'smoothstep',
    path: [v(-26, 2.4, KEEP_Z + 8), v(-14, 1.4, KEEP_Z - 8), v(0, 1.15, KEEP_Z - 16), v(16, 1.5, KEEP_Z - 6), v(24, 3.2, KEEP_Z + 10)],
    look: [v(-8, 10, KEEP_Z), v(-2, 11, KEEP_Z - 2), v(0, 12, KEEP_Z), v(6, 11, KEEP_Z + 2), v(10, 10, KEEP_Z + 6)],
  },
  {
    id: 'circuit', duration: 10, fov: [44, 44], ease: 'linear',
    path: [v(56, 30, KEEP_Z + 8), v(0, 32, KEEP_Z + 58), v(-56, 30, KEEP_Z + 8), v(0, 34, KEEP_Z - 52)],
    look: [v(0, 14, KEEP_Z), v(0, 14, KEEP_Z), v(0, 14, KEEP_Z), v(0, 16, KEEP_Z)],
  },
  {
    id: 'night', duration: 10, fov: [42, 30], ease: 'smoothstep',
    path: [v(-2.8, 1.75, 17.4), v(-0.4, 1.7, 16.2), v(2.8, 1.78, 15.4), v(3.4, 1.85, 13.6)],
    look: [v(-1.2, 1.7, 14.2), v(0.2, 1.72, 14.0), v(1.5, 1.78, 14.2), v(1.5, 1.7, 14.0)],
  },
  {
    id: 'welcome', duration: 8, fov: [48, 56], ease: 'smoothstep',
    path: [v(4.2, 3.2, 34), v(2.2, 2.3, 30), v(0.7, 1.9, 26), v(0.2, 1.72, 24)],
    look: [v(0, 12, KEEP_Z + 4), v(0, 11, KEEP_Z + 2), v(0, 10, KEEP_Z), v(0, 9.4, KEEP_Z)],
  },
  {
    id: 'endcard', duration: 8, fov: [40, 34], ease: 'easeInOut',
    path: [v(8, 7, 26), v(18, 16, 36), v(28, 24, 48), v(38, 30, 58)],
    look: [v(0, 12, KEEP_Z), v(0, 16, KEEP_Z), v(0, 20, KEEP_Z), v(0, 22, KEEP_Z + 4)],
  },
];
