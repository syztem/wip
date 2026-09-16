import { createPose, copyPose, blendPose, applyPose } from './pose.js';
import { createMarioController } from './mario-controller.js';
import { createFreecam } from './freecam.js';

const IDLE_MS = 20000;
const _tmp = createPose();

export function createPlayer({
  camera, director, mario, terrain, input, reel,
  startInPlayer = false,
  autoResume = true,
  fadeMs = 1500,
} = {}) {
  let state = 'director';
  let mode = 'mario';
  let blend = 0;
  let fDown = false;

  const marioCtrl = createMarioController({ mario, terrain });
  const freecam = createFreecam();
  const frozen = createPose();
  const lastPlayer = createPose();

  const spawn = {
    position: mario.group.position.clone(),
    yaw: mario.group.rotation.y,
  };
  marioCtrl.resetAt(spawn.position, spawn.yaw);

  const currentPose = () => (mode === 'mario' ? marioCtrl.pose : freecam.pose);

  function updateActiveController(dt, s) {
    if (mode === 'mario') marioCtrl.update(dt, s);
    else freecam.update(dt, s);
  }

  function switchMode(next) {
    if (next === mode) return;
    if (next === 'mario') {
      marioCtrl.resetAt(mario.group.position, mario.group.rotation.y);
      marioCtrl.adoptCamera(camera);
    } else {
      freecam.adopt(camera);
    }
    mode = next;
    fDown = false;
  }

  function beginLeaving() {
    copyPose(lastPlayer, currentPose());
    state = 'leaving';
    blend = 1;
  }

  function onInputIntent(s) {
    if (s.held.has('KeyF')) {
      if (!fDown) { fDown = true; switchMode(mode === 'mario' ? 'freecam' : 'mario'); }
    } else fDown = false;
  }

  function update(dt) {
    const s = input.sample();
    if (state !== 'director') onInputIntent(s);

    switch (state) {
      case 'director': {
        copyPose(frozen, director.sample(reel.t));
        applyPose(camera, frozen);
        if (s.engaged) {
          if (mode === 'mario') marioCtrl.resetAt(spawn.position, spawn.yaw);
          if (mode === 'freecam') freecam.adopt(camera);
          state = 'entering';
          blend = 0;
        }
        break;
      }
      case 'entering': {
        updateActiveController(dt, s);
        blend = Math.min(1, blend + (dt * 1000) / fadeMs);
        blendPose(_tmp, frozen, currentPose(), blend);
        applyPose(camera, _tmp);
        if (blend >= 1) { blend = 1; state = 'player'; }
        break;
      }
      case 'player': {
        updateActiveController(dt, s);
        applyPose(camera, currentPose());
        if (autoResume && !s.engaged && performance.now() - s.lastActivity > IDLE_MS) beginLeaving();
        break;
      }
      case 'leaving': {
        if (s.engaged) { state = 'entering'; break; }
        blend = Math.max(0, blend - (dt * 1000) / fadeMs);
        if (blend <= 0) {
          blend = 0;
          state = 'director';
          reel.paused = false;
          mario.group.position.copy(spawn.position);
          mario.group.rotation.y = spawn.yaw;
          break;
        }
        blendPose(_tmp, frozen, lastPlayer, blend);
        applyPose(camera, _tmp);
        break;
      }
    }
  }

  if (startInPlayer) {
    copyPose(frozen, director.sample(reel.t));
    state = 'entering';
    blend = 0;
  }

  return {
    update,
    get state() { return state; },
    get mode() { return mode; },
    get ownsMario() { return state !== 'director'; },
    toggle() { switchMode(mode === 'mario' ? 'freecam' : 'mario'); },
  };
}
