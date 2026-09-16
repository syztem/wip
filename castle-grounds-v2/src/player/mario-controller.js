import { Vector3, MathUtils } from 'three';
import { createPose } from './pose.js';

const WALK = 4.5, RUN = 8.0, ACCEL = 26, DECEL = 20;
const GRAVITY = 22, JUMP_V = 10.5, STEP_UP = 0.55, DROP_FALL = 0.45;
const CAM_DIST = 5.5, CAM_HEAD = 1.4, LOOK_SENS = 0.0025;
const PITCH_MIN = -0.25, PITCH_MAX = 1.25;

export function createMarioController({ mario, terrain }) {
  const pose = createPose();
  const pos = new Vector3();
  const vel = new Vector3();
  let vy = 0, onGround = true;
  let camYaw = Math.PI, camPitch = 0.34;

  const _fwd = new Vector3(), _right = new Vector3(), _want = new Vector3(), _delta = new Vector3();

  function writeMario() {
    mario.group.position.copy(pos);
    if (vel.lengthSq() > 0.04) mario.group.rotation.y = Math.atan2(vel.x, vel.z);
  }

  return {
    pose,
    get position() { return pos; },
    get onGround() { return onGround; },
    resetAt(position, yaw) {
      pos.copy(position); vel.set(0, 0, 0); vy = 0; onGround = true;
      camYaw = yaw ?? Math.PI; camPitch = 0.34;
      writeMario();
    },
    adoptCamera(camera) {
      camera.getWorldDirection(_fwd);
      camYaw = Math.atan2(_fwd.x, _fwd.z);
      camPitch = MathUtils.clamp(Math.asin(_fwd.y), PITCH_MIN, PITCH_MAX);
    },
    update(dt, s) {
      camYaw -= s.look.dx * LOOK_SENS;
      camPitch = MathUtils.clamp(camPitch - s.look.dy * LOOK_SENS, PITCH_MIN, PITCH_MAX);

      _fwd.set(Math.sin(camYaw), 0, Math.cos(camYaw));
      _right.set(_fwd.z, 0, -_fwd.x);
      _want.set(0, 0, 0);
      _want.addScaledVector(_fwd, s.move.y);
      _want.addScaledVector(_right, -s.move.x);
      const mag = _want.length();

      const target = s.run ? RUN : WALK;
      if (mag > 0.01) {
        _want.multiplyScalar(target / mag);
        _delta.copy(_want).sub(vel);
        const dl = _delta.length();
        const max = ACCEL * dt;
        if (dl > max) _delta.multiplyScalar(max / dl);
        vel.add(_delta);
      } else {
        const vl = vel.length();
        const max = DECEL * dt;
        if (vl < max) vel.set(0, 0, 0);
        else vel.multiplyScalar(1 - max / vl);
      }

      const nx = pos.x + vel.x * dt;
      const nz = pos.z + vel.z * dt;
      const ng = terrain(nx, nz);
      if (ng - pos.y > STEP_UP) { vel.x = 0; vel.z = 0; }
      else { pos.x = nx; pos.z = nz; }

      const ground = terrain(pos.x, pos.z);
      if (onGround) {
        const dy = ground - pos.y;
        if (dy >= -DROP_FALL) pos.y = ground;
        else { onGround = false; vy = 0; }
      }
      if (!onGround) {
        vy -= GRAVITY * dt;
        pos.y += vy * dt;
        if (pos.y <= ground) { pos.y = ground; vy = 0; onGround = true; }
      }
      if (onGround && s.jump) { vy = JUMP_V; onGround = false; }

      writeMario();

      const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
      pose.position.set(
        pos.x - Math.sin(camYaw) * cp * CAM_DIST,
        pos.y + sp * CAM_DIST + CAM_HEAD,
        pos.z - Math.cos(camYaw) * cp * CAM_DIST,
      );
      const cg = terrain(pose.position.x, pose.position.z);
      if (pose.position.y < cg + 0.7) pose.position.y = cg + 0.7;
      pose.look.set(pos.x, pos.y + 0.9, pos.z);
      pose.fov = 58;
    },
  };
}
