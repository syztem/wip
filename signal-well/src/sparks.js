import * as THREE from 'three/webgpu';
import {
  float, If, PI, color, cos, instanceIndex, Loop, mix, mod, sin,
  instancedArray, Fn, uint, uniform, uniformArray, hash, vec3, vec4,
} from 'three/tsl';

/**
 * Reduced TSL N-body (card is 2^18 — do not copy that exponent onto a glass+bloom frame).
 * One attractor glued to the lens. Additive SpriteNodeMaterial, depthWrite false.
 */
export function createSparks({ renderer, scene, attractor, count = 4096 } = {}) {
  const attractorPos = attractor.clone();
  const attractorsPositions = uniformArray([attractorPos]);
  const attractorsRotationAxes = uniformArray([new THREE.Vector3(0, 1, 0)]);
  const attractorsLength = uniform(1, 'uint');
  const attractorMass = uniform(Number('1e7'));
  const particleGlobalMass = uniform(Number('1e4'));
  const timeScale = uniform(1);
  const spinningStrength = uniform(2.4);
  const maxSpeed = uniform(6);
  const gravityConstant = 6.67e-11;
  const velocityDamping = uniform(0.12);
  const scale = uniform(0.01);
  const boundHalfExtent = uniform(7);
  const colorA = uniform(color('#3a0800'));
  const colorB = uniform(color('#ff6a18'));

  const positionBuffer = instancedArray(count, 'vec3');
  const velocityBuffer = instancedArray(count, 'vec3');

  const sphericalToVec3 = Fn(([phi, theta]) => {
    const sinPhiRadius = sin(phi);
    return vec3(sinPhiRadius.mul(sin(theta)), cos(phi), sinPhiRadius.mul(cos(theta)));
  });

  const init = Fn(() => {
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);
    const basePosition = vec3(
      hash(instanceIndex.add(uint(Math.random() * 0xffffff))),
      hash(instanceIndex.add(uint(Math.random() * 0xffffff))),
      hash(instanceIndex.add(uint(Math.random() * 0xffffff))),
    ).sub(0.5).mul(vec3(4.2, 1.4, 4.2));
    position.assign(basePosition);
    const phi = hash(instanceIndex.add(uint(Math.random() * 0xffffff))).mul(PI).mul(2);
    const theta = hash(instanceIndex.add(uint(Math.random() * 0xffffff))).mul(PI);
    velocity.assign(sphericalToVec3(phi, theta).mul(0.08));
  });
  const initCompute = init().compute(count);

  const particleMassMultiplier = hash(instanceIndex.add(uint(Math.random() * 0xffffff))).remap(0.25, 1).toVar();
  const particleMass = particleMassMultiplier.mul(particleGlobalMass).toVar();

  const update = Fn(() => {
    const delta = float(1 / 60).mul(timeScale).toVar();
    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);
    const force = vec3(0).toVar();
    Loop(attractorsLength, ({ i }) => {
      const attractorPosition = attractorsPositions.element(i);
      const attractorRotationAxis = attractorsRotationAxes.element(i);
      const toAttractor = attractorPosition.sub(position);
      const distance = toAttractor.length().max(0.08);
      const direction = toAttractor.normalize();
      const gravityStrength = attractorMass.mul(particleMass).mul(gravityConstant).div(distance.pow(2)).toVar();
      force.addAssign(direction.mul(gravityStrength));
      const spinningForce = attractorRotationAxis.mul(gravityStrength).mul(spinningStrength);
      force.addAssign(spinningForce.cross(toAttractor));
    });
    velocity.addAssign(force.mul(delta));
    const speed = velocity.length();
    If(speed.greaterThan(maxSpeed), () => {
      velocity.assign(velocity.normalize().mul(maxSpeed));
    });
    velocity.mulAssign(velocityDamping.oneMinus());
    position.addAssign(velocity.mul(delta));
    const halfHalfExtent = boundHalfExtent.div(2).toVar();
    position.assign(mod(position.add(halfHalfExtent), boundHalfExtent).sub(halfHalfExtent));
  });
  const updateCompute = update().compute(count).setName('Update Sparks');

  const material = new THREE.SpriteNodeMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  material.positionNode = positionBuffer.toAttribute();
  material.colorNode = Fn(() => {
    const speed = velocityBuffer.toAttribute().length();
    const colorMix = speed.div(maxSpeed).smoothstep(0, 0.5);
    return vec4(mix(colorA, colorB, colorMix), 1);
  })();
  material.scaleNode = particleMassMultiplier.mul(scale);

  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  scene.add(mesh);

  renderer.compute(initCompute);

  let live = true;
  return {
    mesh,
    attractorPos,
    setCount(n) {
      mesh.count = Math.max(0, Math.min(count, n | 0));
    },
    update(target) {
      if (!live || mesh.count === 0) return;
      attractorPos.copy(target);
      renderer.compute(updateCompute);
    },
    dispose() {
      live = false;
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
