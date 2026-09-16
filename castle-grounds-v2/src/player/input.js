const STICK_RADIUS = 60;
const TAP_MS = 220;
const ENGAGE_MS = 400;

export function createInput(element) {
  const keys = new Set();
  const look = { dx: 0, dy: 0 };
  let jumpEdge = false;
  let lastActivity = performance.now();

  let mouseDown = false, mouseLastX = 0, mouseLastY = 0;
  let moveId = null, moveOX = 0, moveOY = 0, moveCX = 0, moveCY = 0;
  let lookId = null, lookLastX = 0, lookLastY = 0, lookStartT = 0, lookMoved = false;

  const mark = () => { lastActivity = performance.now(); };

  function onKey(e, down) {
    const c = e.code;
    if (c === 'Space' || c.startsWith('Arrow')) e.preventDefault();
    if (down) {
      if (c === 'Space' && !keys.has('Space')) jumpEdge = true;
      keys.add(c);
    } else keys.delete(c);
    mark();
  }
  const onKeyDown = (e) => onKey(e, true);
  const onKeyUp = (e) => onKey(e, false);

  function onPointerDown(e) {
    mark();
    if (e.pointerType === 'touch') {
      if (e.clientX < innerWidth * 0.5 && moveId === null) {
        moveId = e.pointerId;
        moveOX = moveCX = e.clientX;
        moveOY = moveCY = e.clientY;
      } else if (lookId === null) {
        lookId = e.pointerId;
        lookLastX = e.clientX;
        lookLastY = e.clientY;
        lookStartT = performance.now();
        lookMoved = false;
      }
      return;
    }
    if (document.pointerLockElement !== element) {
      mouseDown = true;
      mouseLastX = e.clientX;
      mouseLastY = e.clientY;
      const p = element.requestPointerLock?.();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }

  function onPointerMove(e) {
    if (e.pointerId === moveId) { moveCX = e.clientX; moveCY = e.clientY; mark(); return; }
    if (e.pointerId === lookId) {
      const dx = e.clientX - lookLastX;
      const dy = e.clientY - lookLastY;
      lookLastX = e.clientX; lookLastY = e.clientY;
      look.dx += dx * 0.6; look.dy += dy * 0.6;
      if (Math.abs(dx) + Math.abs(dy) > 3) lookMoved = true;
      mark(); return;
    }
    if (document.pointerLockElement === element) {
      look.dx += e.movementX; look.dy += e.movementY; mark(); return;
    }
    if (mouseDown) {
      const dx = e.clientX - mouseLastX;
      const dy = e.clientY - mouseLastY;
      mouseLastX = e.clientX; mouseLastY = e.clientY;
      look.dx += dx; look.dy += dy;
      mark();
    }
  }

  function onPointerUp(e) {
    if (e.pointerId === moveId) { moveId = null; return; }
    if (e.pointerId === lookId) {
      if (!lookMoved && performance.now() - lookStartT < TAP_MS) jumpEdge = true;
      lookId = null;
      return;
    }
    if (e.pointerType !== 'touch') mouseDown = false;
  }

  function onLockChange() { mouseDown = false; }
  function onBlur() { keys.clear(); mouseDown = false; moveId = null; lookId = null; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  element.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  document.addEventListener('pointerlockchange', onLockChange);
  window.addEventListener('blur', onBlur);

  return {
    sample() {
      let mx = 0, my = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp'))    my += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown'))  my -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
      if (moveId !== null) {
        mx += (moveCX - moveOX) / STICK_RADIUS;
        my += -(moveCY - moveOY) / STICK_RADIUS;
      }
      const m = Math.hypot(mx, my);
      if (m > 1) { mx /= m; my /= m; }
      const now = performance.now();
      const engaged = keys.size > 0 || moveId !== null || lookId !== null || now - lastActivity < ENGAGE_MS;
      const out = {
        move: { x: mx, y: my },
        look: { dx: look.dx, dy: look.dy },
        jump: jumpEdge,
        run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
        held: keys, engaged, lastActivity,
      };
      look.dx = 0; look.dy = 0;
      jumpEdge = false;
      return out;
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      window.removeEventListener('blur', onBlur);
    },
  };
}
