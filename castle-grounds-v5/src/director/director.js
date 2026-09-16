import * as THREE from 'three/webgpu';

const EASES = {
  linear: (t) => t,
  smoothstep: (t) => t * t * (3 - 2 * t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) * 0.5),
  easeOut: (t) => 1 - (1 - t) * (1 - t),
};

export function createDirector(camera, { shots, blend = 0.55 } = {}) {
  if (!shots || shots.length === 0) throw new Error('createDirector: need at least one shot');
  const compiled = shots.map((s) => {
    if (!s.path || s.path.length < 2) throw new Error(`shot "${s.id}" needs >=2 path points`);
    if (!s.look || s.look.length < 2) throw new Error(`shot "${s.id}" needs >=2 look points`);
    const closed = !!s.closed;
    const curveType = s.curve || 'centripetal';
    const tension = s.tension ?? 0.22;
    return {
      id: s.id,
      duration: s.duration,
      fov: s.fov || null,
      ease: EASES[s.ease] || EASES.easeInOut,
      closed,
      posCurve: new THREE.CatmullRomCurve3(s.path, closed, curveType, tension),
      lookCurve: new THREE.CatmullRomCurve3(s.look, closed, curveType, tension),
    };
  });
  const starts = [];
  let acc = 0;
  for (const s of compiled) { starts.push(acc); acc += s.duration; }
  const total = acc;

  const _pose = { position: new THREE.Vector3(), look: new THREE.Vector3(), fov: 48 };
  const _prevPos = new THREE.Vector3();
  const _prevLook = new THREE.Vector3();
  const _targetQuat = new THREE.Quaternion();
  const _m = new THREE.Matrix4();
  const _up = new THREE.Vector3(0, 1, 0);
  let primed = false;
  let lastT = 0;

  function locate(t) {
    const tt = ((t % total) + total) % total;
    let i = 0;
    while (i < compiled.length - 1 && starts[i + 1] <= tt) i++;
    const shot = compiled[i];
    const local = tt - starts[i];
    const u = shot.duration > 0 ? local / shot.duration : 1;
    return { shot, u, i, local, tt };
  }

  function evalShot(shot, u, outPos, outLook) {
    const e = shot.ease(Math.min(1, Math.max(0, u)));
    shot.posCurve.getPointAt(e, outPos);
    shot.lookCurve.getPointAt(e, outLook);
    return shot.fov ? THREE.MathUtils.lerp(shot.fov[0], shot.fov[1], e) : 48;
  }

  function sample(t) {
    const { shot, u, i, local } = locate(t);
    const fov = evalShot(shot, u, _pose.position, _pose.look);

    // Crossfade the first `blend` seconds so cuts do not snap.
    const blendWin = Math.min(blend, shot.duration * 0.35);
    if (i > 0 && local < blendWin && blendWin > 1e-4) {
      const prev = compiled[i - 1];
      evalShot(prev, 1, _prevPos, _prevLook);
      const k = EASES.smoothstep(local / blendWin);
      _pose.position.lerpVectors(_prevPos, _pose.position, k);
      _pose.look.lerpVectors(_prevLook, _pose.look, k);
      const prevFov = prev.fov ? prev.fov[1] : 48;
      _pose.fov = THREE.MathUtils.lerp(prevFov, fov, k);
    } else {
      _pose.fov = fov;
    }
    return _pose;
  }

  return {
    total,
    shotAt(t) { const { shot, u } = locate(t); return { id: shot.id, u }; },
    hasShot(shotId) { return compiled.some((s) => s.id === shotId); },
    reelTimeFor(shotId, u = 0) {
      const i = compiled.findIndex((s) => s.id === shotId);
      if (i === -1) return null;
      const clamped = Math.min(1, Math.max(0, u));
      return starts[i] + compiled[i].duration * clamped;
    },
    sample,
    apply(t) {
      const p = sample(t);
      const dt = primed ? Math.min(0.08, Math.max(0, t - lastT)) : 0.016;
      lastT = t;
      camera.position.copy(p.position);
      _m.lookAt(p.position, p.look, _up);
      _targetQuat.setFromRotationMatrix(_m);
      if (!primed) {
        camera.quaternion.copy(_targetQuat);
        primed = true;
      } else {
        const k = 1 - Math.exp(-dt * 7.2);
        camera.quaternion.slerp(_targetQuat, k);
      }
      camera.up.set(0, 1, 0);
      if (Math.abs(camera.fov - p.fov) > 0.02) {
        camera.fov = p.fov;
        camera.updateProjectionMatrix();
      }
    },
  };
}
