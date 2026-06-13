// =============================================================================
// Deterministic RNG.
// The season is seeded from (gameId + fixtureId) so re-running a match always
// yields the same score. This makes results reproducible across reconnects and
// server restarts — outcomes are driven by ratings + a fixed seed, never by a
// fresh Math.random() each time.
// =============================================================================

// Mulberry32 — small, fast, deterministic 32-bit PRNG.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turn an arbitrary string (e.g. gameId+fixtureId) into a 32-bit integer seed.
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private next: () => number;
  constructor(seed: string | number) {
    this.next = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed);
  }
  // [0,1)
  float(): number {
    return this.next();
  }
  // integer in [min, max]
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  // Knuth's algorithm for sampling from a Poisson distribution with mean lambda.
  poisson(lambda: number): number {
    if (lambda <= 0) return 0;
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > L);
    return k - 1;
  }
  // Weighted choice: returns an index into `weights` proportional to its value.
  weightedIndex(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return this.int(0, weights.length - 1);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
}
