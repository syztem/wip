import { Vector3 } from 'three';

export function createPose() {
  return { position: new Vector3(), look: new Vector3(), fov: 50 };
}
export function copyPose(dst, src) {
  dst.position.copy(src.position);
  dst.look.copy(src.look);
  dst.fov = src.fov;
  return dst;
}
export function blendPose(dst, a, b, t) {
  dst.position.lerpVectors(a.position, b.position, t);
  dst.look.lerpVectors(a.look, b.look, t);
  dst.fov = a.fov + (b.fov - a.fov) * t;
  return dst;
}
export function applyPose(camera, pose) {
  camera.position.copy(pose.position);
  camera.up.set(0, 1, 0);
  camera.lookAt(pose.look);
  if (Math.abs(camera.fov - pose.fov) > 0.01) {
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
  }
}
