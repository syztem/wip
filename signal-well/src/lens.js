import * as THREE from 'three/webgpu';

/** Thick volume glass — transmission 1, opacity 1, Beer–Lambert. Not opacity-as-glass. */
export function createLens() {
  const group = new THREE.Group();
  group.position.y = 1.48;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.045,
    transmission: 1,
    opacity: 1,
    transparent: true,
    ior: 1.5,
    thickness: 0.42,
    attenuationColor: new THREE.Color().setHex(0xff4a12, THREE.SRGBColorSpace),
    attenuationDistance: 0.55,
    specularIntensity: 1,
    specularColor: 0xffffff,
    side: THREE.DoubleSide,
  });

  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.18, 64, 48), glassMat);
  glass.scale.set(1, 0.22, 1);
  glass.castShadow = false;
  glass.receiveShadow = false;
  glass.renderOrder = 20;
  group.add(glass);

  const hoopMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHex(0x141618, THREE.SRGBColorSpace),
    metalness: 0.9,
    roughness: 0.28,
    emissive: new THREE.Color().setHex(0xff4a12, THREE.SRGBColorSpace),
    emissiveIntensity: 1.35,
  });
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.038, 12, 72), hoopMat);
  hoop.rotation.x = Math.PI * 0.5;
  hoop.renderOrder = 21;
  group.add(hoop);

  const core = new THREE.PointLight(0xff6a18, 18, 8, 2);
  core.position.set(0, 0, 0);
  group.add(core);

  return {
    group,
    glass,
    hoop,
    core,
    update(t) {
      group.rotation.y = t * 0.18;
      group.position.y = 1.48 + Math.sin(t * 0.7) * 0.06;
      hoop.rotation.z = t * 0.35;
    },
    dispose() {
      glass.geometry.dispose();
      hoop.geometry.dispose();
      glassMat.dispose();
      hoopMat.dispose();
    },
  };
}
