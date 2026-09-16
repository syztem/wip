import { LOOP } from './hour.js';
import { chapterFor } from './director/script.js';

export function createHud() {
  const root = document.createElement('div');
  root.id = 'hud';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="bars"><i></i><i></i></div>
    <div class="chrome top">
      <div class="brand">
        <span class="mark">PP</span>
        <span class="prod">PROPERTY PLUMBERS</span>
      </div>
      <div class="listing" data-listing>1 KEEP · 4 SPIRES · MOAT INCL.</div>
      <div class="clock">
        <span data-clock>00:00</span>
        <span class="sep">·</span>
        <span data-weather>CLEAR</span>
      </div>
    </div>
    <div class="nametag mario" data-tag-mario>
      <b>MARIO</b>
      <span>Demo &amp; Design</span>
    </div>
    <div class="nametag luigi" data-tag-luigi>
      <b>LUIGI</b>
      <span>Structure &amp; Panic</span>
    </div>
    <div class="stamp" data-stamp>NEW LISTING</div>
    <div class="card">
      <div class="kicker"><span data-n>00</span> · <span data-kicker>HGTV ADJACENT</span></div>
      <div class="title" data-title>PROPERTY PLUMBERS</div>
      <div class="line" data-line></div>
    </div>
    <div class="chrome bot">
      <div class="ticker" data-ticker></div>
      <div class="meter"><b data-bar></b></div>
    </div>
  `;
  document.body.appendChild(root);

  const el = {
    n: root.querySelector('[data-n]'),
    kicker: root.querySelector('[data-kicker]'),
    title: root.querySelector('[data-title]'),
    line: root.querySelector('[data-line]'),
    clock: root.querySelector('[data-clock]'),
    weather: root.querySelector('[data-weather]'),
    ticker: root.querySelector('[data-ticker]'),
    bar: root.querySelector('[data-bar]'),
    card: root.querySelector('.card'),
    stamp: root.querySelector('[data-stamp]'),
    tagM: root.querySelector('[data-tag-mario]'),
    tagL: root.querySelector('[data-tag-luigi]'),
  };

  let lastId = '';
  let cardAt = 0;
  let frames = 0;
  let fpsAt = performance.now();
  let fps = 0;

  function paintChapter(id) {
    const c = chapterFor(id);
    el.n.textContent = c.n;
    el.kicker.textContent = c.kicker;
    el.title.textContent = c.title;
    el.line.textContent = c.line;
    el.stamp.textContent = c.tag || '';
    el.stamp.classList.remove('pop');
    void el.stamp.offsetWidth;
    el.stamp.classList.add('pop');
    el.stamp.classList.toggle('sold', c.tag === 'SOLD');

    const feat = c.featured || 'both';
    el.tagM.classList.toggle('on', feat === 'mario' || feat === 'both');
    el.tagL.classList.toggle('on', feat === 'luigi' || feat === 'both');

    el.card.classList.remove('in');
    void el.card.offsetWidth;
    el.card.classList.add('in');
    root.dataset.shot = id;
  }

  return {
    tick({ dt, reelT, shotId, hours, weather, backend, bloom, flash }) {
      frames++;
      const now = performance.now();
      if (now - fpsAt >= 400) {
        fps = Math.round((frames * 1000) / (now - fpsAt));
        frames = 0;
        fpsAt = now;
      }
      if (shotId !== lastId) {
        lastId = shotId;
        cardAt = 0;
        paintChapter(shotId);
      }
      cardAt += dt;
      el.card.classList.add('hold');
      el.card.classList.toggle('dim', cardAt > 5.6);

      const hh = String(Math.floor(hours) % 24).padStart(2, '0');
      const mm = String(Math.floor((hours % 1) * 60)).padStart(2, '0');
      el.clock.textContent = `${hh}:${mm}`;
      el.weather.textContent = String(weather || 'clear').toUpperCase();

      const u = ((reelT % LOOP) + LOOP) % LOOP;
      el.bar.style.transform = `scaleX(${(u / LOOP).toFixed(4)})`;
      el.ticker.textContent =
        `EP 07 · THE KEEP  ·  ${fps} FPS  ·  ${backend}  ·  ${bloom ? 'BLOOM ON' : 'RAW'}  ·  ${u.toFixed(1)} / ${LOOP}.0`;

      root.classList.toggle('flash', !!flash);
    },
  };
}
