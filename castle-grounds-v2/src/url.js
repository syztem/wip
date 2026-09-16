const NUM = /^-?\d+(?:\.\d+)?$/;

export function parseMoment(hash = location.hash) {
  const out = { shot: null, u: 0, clock: null, weather: null, play: false };
  if (!hash || hash.length < 2) return out;
  for (const part of hash.slice(1).split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const k = eq === -1 ? part : part.slice(0, eq);
    const raw = eq === -1 ? '' : part.slice(eq + 1);
    let v;
    try { v = decodeURIComponent(raw); } catch { v = raw; }
    switch (k) {
      case 'shot': if (v) out.shot = v; break;
      case 'u': if (NUM.test(v)) out.u = Math.min(1, Math.max(0, +v)); break;
      case 'clock': if (NUM.test(v)) out.clock = ((+v % 24) + 24) % 24; break;
      case 'weather': if (v) out.weather = v; break;
      case 'play': out.play = v === '1' || v === 'true'; break;
      default: break;
    }
  }
  return out;
}

export function formatMoment({ shot, u, clock, weather }) {
  const parts = [`shot=${encodeURIComponent(shot)}`, `u=${u.toFixed(3)}`];
  if (clock != null) parts.push(`clock=${clock.toFixed(2)}`);
  if (weather) parts.push(`weather=${encodeURIComponent(weather)}`);
  return '#' + parts.join('&');
}
