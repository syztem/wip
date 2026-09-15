/** Step-down ladder: sparks → pixelRatio → bloom. Hold + cooldown. */
export class Quality {
  constructor({ el } = {}) {
    this.level = 0;
    this.holdLo = 0;
    this.holdHi = 0;
    this.cool = 0;
    this.acc = 0;
    this.frames = 0;
    this.fps = 60;
    this.el = el || null;
  }

  tick(dt, { onLevel } = {}) {
    this.acc += dt;
    this.frames += 1;
    this.cool = Math.max(0, this.cool - dt);
    if (this.acc < 0.5) return this.fps;
    this.fps = this.frames / this.acc;
    this.acc = 0;
    this.frames = 0;
    if (this.el) this.el.textContent = `${this.fps.toFixed(0)} fps  q${this.level}`;

    if (this.cool > 0) return this.fps;
    if (this.fps < 28) {
      this.holdLo += 0.5;
      this.holdHi = 0;
      if (this.holdLo >= 2 && this.level < 3) {
        this.level += 1;
        this.holdLo = 0;
        this.cool = 2.5;
        onLevel?.(this.level);
      }
    } else if (this.fps > 45 && this.level > 0) {
      this.holdHi += 0.5;
      this.holdLo = 0;
      if (this.holdHi >= 3) {
        this.level -= 1;
        this.holdHi = 0;
        this.cool = 3;
        onLevel?.(this.level);
      }
    } else {
      this.holdLo = 0;
      this.holdHi = 0;
    }
    return this.fps;
  }
}
