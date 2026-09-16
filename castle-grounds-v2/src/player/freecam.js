import { Vector3, MathUtils } from 'three';
import { createPose } from './pose.js';

const SPEED = 14, BOOST = 2.5, LOOK_SENS = 0.0025;

export function createFreecam() {
  const pose = createPose();
  const pos = new Vector3();
  let yaw = Math.PI, pitch = 0;
  const _fwd = new Vector3(), _right = new Vector3();

  return {
    pose,
    get position() { return pos; },
    adopt(camera) {
      pos.copy(camera.position);
      camera.getWorldDirection(_fwd);
      yaw = Math.atan2(_fwd.x, _fwd.z);
      pitch = Math.asin(MathUtils.clamp(_fwd.y, -1, 1));
    },
    update(dt, s) {
      yaw -= s.look.dx * LOOK_SENS;
      pitch = MathUtils.clamp(pitch - s.look.dy * LOOK_SENS, -1.5, 1.5);
      _fwd.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      _right.set(_fwd.z, 0, -_fwd.x).normalize();
      const speed = SPEED * (s.run ? BOOST : 1) * dt;
      pos.addScaledVector(_fwd, s.move.y * speed);
      pos.addScaledVector(_right, -s.move.x * speed);
      const up = (s.held.has('Space') ? 1 : 0) - (s.held.has('KeyC') ? 1 : 0);
      pos.y += up * speed;
      pose.position.copy(pos);
      pose.look.copy(pos).add(_fwd);
      pose.fov = 55;
    },
  };
}
