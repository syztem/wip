import * as THREE from 'three/webgpu';

const EASES = {
  linear: (t) => t,
  smoothstep: (t) => t * t * (3 - 2 * t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) * 0.5),
};

export function createDirector(camera, { shots } = {}) {
  if (!shots || shots.length === 0) throw new Error('createDirector: need at least one shot');
  const compiled = shots.map((s) => {
    if (!s.path || s.path.length < 2) throw new Error(`shot "${s.id}" needs >=2 path points`);
    if (!s.look || s.look.length < 2) throw new Error(`shot "${s.id}" needs >=2 look points`);
    return {
      id: s.id, duration: s.duration, fov: s.fov || null,
      ease: EASES[s.ease] || EASES.smoothstep,
      posCurve: new THREE.CatmullRomCurve3(s.path, false, 'catmullrom', s.tension ?? 0.14),
      lookCurve: new THREE.CatmullRomCurve3(s.look, false, 'catmullrom', s.tension ?? 0.14),
    };
  });
  const starts = [];
  let acc = 0;
  for (const s of compiled) { starts.push(acc); acc += s.duration; }
  const total = acc;

  const _pose = { position: new THREE.Vector3(), look: new THREE.Vector3(), fov: 50 };

  function locate(t) {
    const tt = ((t % total) + total) % total;
    let i = 0;
    while (i < compiled.length - 1 && starts[i + 1] <= tt) i++;
    const shot = compiled[i];
    const local = tt - starts[i];
    const u = shot.duration > 0 ? local / shot.duration : 1;
    return { shot, u };
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
    sample(t) {
      const { shot, u } = locate(t);
      const e = shot.ease(u);
      shot.posCurve.getPoint(e, _pose.position);
      shot.lookCurve.getPoint(e, _pose.look);
      _pose.fov = shot.fov ? THREE.MathUtils.lerp(shot.fov[0], shot.fov[1], e) : 50;
      return _pose;
    },
    apply(t) {
      const p = this.sample(t);
      camera.position.copy(p.position);
      camera.up.set(0, 1, 0);
      camera.lookAt(p.look);
      if (Math.abs(camera.fov - p.fov) > 0.01) {
        camera.fov = p.fov;
        camera.updateProjectionMatrix();
      }
    },
  };
}
