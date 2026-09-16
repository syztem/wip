const PRESETS = {
  clear:    { cloudCoverage: 0.12, cloudDensity: 0.22, windStrength: 0.30, rain: 0.00, fogBias: 0.00 },
  overcast: { cloudCoverage: 0.72, cloudDensity: 0.45, windStrength: 0.60, rain: 0.00, fogBias: 0.35 },
  rain:     { cloudCoverage: 0.86, cloudDensity: 0.55, windStrength: 0.85, rain: 0.75, fogBias: 0.55 },
  storm:    { cloudCoverage: 0.96, cloudDensity: 0.72, windStrength: 1.40, rain: 1.00, fogBias: 0.90 },
};

const FIELDS = ['cloudCoverage', 'cloudDensity', 'windStrength', 'rain', 'fogBias'];

export function createWeather({ preset = 'clear' } = {}) {
  if (!PRESETS[preset]) throw new Error(`createWeather: unknown preset "${preset}"`);
  const live = { ...PRESETS[preset] };
  let target = PRESETS[preset];
  let current = preset;
  let windAngle = Math.PI * 0.25;
  let t = 0;

  return {
    get preset() { return current; },
    get cloudCoverage() { return live.cloudCoverage; },
    get cloudDensity()  { return live.cloudDensity; },
    get rain()          { return live.rain; },
    get fogBias()       { return live.fogBias; },
    get windX() { return Math.cos(windAngle) * this.windStrength; },
    get windZ() { return Math.sin(windAngle) * this.windStrength; },
    get windStrength() {
      const gust = 1 + 0.22 * Math.sin(t * 0.41) + 0.11 * Math.sin(t * 1.17);
      return live.windStrength * gust;
    },
    set(p) {
      if (!PRESETS[p]) throw new Error(`weather.set: unknown preset "${p}"`);
      current = p;
      target = PRESETS[p];
    },
    advance(dt) {
      t += dt;
      const k = Math.min(1, dt * 0.15);
      for (const f of FIELDS) live[f] += (target[f] - live[f]) * k;
      windAngle += dt * 0.03 + Math.sin(t * 0.07) * dt * 0.02;
    },
  };
}
