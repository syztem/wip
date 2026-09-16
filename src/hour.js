export const LOOP = 30;

export function wrap(t) {
  return ((t % LOOP) + LOOP) % LOOP;
}

/** Integer cycles per 30s loop. u=0 ≡ u=1. */
export function wave(t, cycles = 1) {
  return Math.sin((wrap(t) / LOOP) * cycles * Math.PI * 2);
}
