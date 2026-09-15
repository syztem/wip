import * as THREE from 'three/webgpu';

export function createRing({ count = 72, radius = 3.45 } = {}) {
  const geo = new THREE.TetrahedronGeometry(0.2);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHex(0x2a3036, THREE.SRGBColorSpace),
    metalness: 0.82,
    roughness: 0.38,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
    const r = radius + Math.random() * 0.5;
    dummy.position.set(Math.cos(a) * r, -0.42 + Math.random() * 0.85, Math.sin(a) * r);
    dummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    dummy.scale.setScalar(0.45 + Math.random() * 0.9);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(4.08, 4.08, 2.9, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHex(0x101214, THREE.SRGBColorSpace),
      metalness: 0.72,
      roughness: 0.52,
      side: THREE.BackSide,
    }),
  );
  wall.position.y = -0.55;
  wall.receiveShadow = true;

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(4.08, 0.07, 8, 64),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHex(0x1c2228, THREE.SRGBColorSpace),
      metalness: 0.8,
      roughness: 0.4,
    }),
  );
  lip.rotation.x = Math.PI * 0.5;
  lip.position.y = 0.88;
  lip.castShadow = true;

  const root = new THREE.Group();
  root.add(mesh, wall, lip);

  return {
    root,
    mesh,
    dispose() {
      geo.dispose();
      mat.dispose();
      wall.geometry.dispose();
      wall.material.dispose();
      lip.geometry.dispose();
      lip.material.dispose();
    },
  };
}
