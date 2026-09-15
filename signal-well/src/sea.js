import * as THREE from 'three/webgpu';
import {
  float, mx_noise_float, Loop, color, positionLocal, sin, vec2, vec3,
  mul, time, uniform, Fn, transformNormalToView,
} from 'three/tsl';

/** TSL oil plane — Journey sea contract, visor-orange trough foam. */
export function createSea({ segments = 192, size = 8 } = {}) {
  const material = new THREE.MeshStandardNodeMaterial({
    color: '#0a0c10',
    roughness: 0.18,
    metalness: 0.35,
  });

  const emissiveColor = uniform(color('#ff4a12'));
  const emissiveLow = uniform(-0.18);
  const emissiveHigh = uniform(0.12);
  const emissivePower = uniform(6.5);
  const largeWavesFrequency = uniform(vec2(2.4, 0.85));
  const largeWavesSpeed = uniform(0.55);
  const largeWavesMultiplier = uniform(0.07);
  const smallWavesIterations = uniform(3);
  const smallWavesFrequency = uniform(2.4);
  const smallWavesSpeed = uniform(0.22);
  const smallWavesMultiplier = uniform(0.11);
  const normalComputeShift = uniform(0.01);

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

  const emissive = elevation.remap(emissiveHigh, emissiveLow).pow(emissivePower);
  material.emissiveNode = emissiveColor.mul(emissive);

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI * 0.5);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.receiveShadow = false;
  mesh.castShadow = false;

  return {
    mesh,
    uniforms: { emissiveColor, largeWavesMultiplier, largeWavesSpeed },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
