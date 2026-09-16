import * as THREE from 'three/webgpu';
import {
  float, mx_noise_float, Loop, color, positionLocal, sin, vec2, vec3,
  mul, time, uniform, Fn, transformNormalToView,
} from 'three/tsl';

/** Calmer Journey-sea contract. Speeds chosen for ~integer cycles per 30s. */
export function createWater() {
  const material = new THREE.MeshStandardNodeMaterial({
    color: '#1a6f88',
    roughness: 0.12,
    metalness: 0.08,
  });

  const foamColor = uniform(color('#d8f4ff'));
  const foamLow = uniform(-0.02);
  const foamHigh = uniform(0.045);
  const largeWavesFrequency = uniform(vec2(1.15, 0.72));
  const largeWavesSpeed = uniform(0.419); // 2 cycles / 30s
  const largeWavesMultiplier = uniform(0.055);
  const smallWavesIterations = uniform(3);
  const smallWavesFrequency = uniform(1.6);
  const smallWavesSpeed = uniform(0.209);
  const smallWavesMultiplier = uniform(0.06);
  const normalComputeShift = uniform(0.02);

  const wavesElevation = Fn(([position]) => {
    const elevation = mul(
      sin(position.x.mul(largeWavesFrequency.x).add(time.mul(largeWavesSpeed))),
      sin(position.z.mul(largeWavesFrequency.y).add(time.mul(largeWavesSpeed))),
      largeWavesMultiplier,
    ).toVar();
    Loop({ start: float(1), end: smallWavesIterations.add(1) }, ({ i }) => {
      const noiseInput = vec3(
        position.xz.add(2).mul(smallWavesFrequency).mul(i),
        time.mul(smallWavesSpeed),
      );
      const wave = mx_noise_float(noiseInput, 1, 0).mul(smallWavesMultiplier).div(i).abs();
      elevation.subAssign(wave);
    });
    return elevation;
  });

  const elevation = wavesElevation(positionLocal);
  const position = positionLocal.add(vec3(0, elevation, 0));
  material.positionNode = position;

  let positionA = positionLocal.add(vec3(normalComputeShift, 0, 0));
  let positionB = positionLocal.add(vec3(0, 0, normalComputeShift.negate()));
  positionA = positionA.add(vec3(0, wavesElevation(positionA), 0));
  positionB = positionB.add(vec3(0, wavesElevation(positionB), 0));
  const toA = positionA.sub(position).normalize();
  const toB = positionB.sub(position).normalize();
  material.normalNode = transformNormalToView(toA.cross(toB));
  material.emissiveNode = foamColor.mul(elevation.remap(foamLow, foamHigh).clamp(0, 1).pow(3));

  const geometry = new THREE.PlaneGeometry(64, 64, 128, 128);
  geometry.rotateX(-Math.PI * 0.5);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -1.08, -38);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return { mesh };
}
