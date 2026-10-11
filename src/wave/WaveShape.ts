import { DEFAULT_DIFFICULTY, FOAM_ADVANCE_RATE, type Difficulty } from '../game/Difficulty';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type WaveRegion = 'sky' | 'ocean' | 'whitewater' | 'foam' | 'face';

/** Geometry in normalized screen coordinates, shared by drawing and gameplay. */
export class WaveShape {
  time = 0;
  readonly horizon = 0.14;
  private frontShift = 0;

  constructor(readonly difficulty: Difficulty = DEFAULT_DIFFICULTY) {}

  advance(seconds: number, width = 1280, height = 720): void {
    // A returning background tab must not jump the wave forward by several seconds.
    const dt = Math.max(0, Math.min(seconds, 0.05));
    this.time += dt;
    // The breaker advances across the face at a real screen-space speed.
    this.frontShift += Math.min(width, height) * FOAM_ADVANCE_RATE[this.difficulty] * dt / width;
  }

  followSurfer(pixels: number, width: number): void {
    // A camera following the surfer makes a fast ride open a larger gap.
    this.frontShift = Math.max(-0.28, this.frontShift - pixels / width);
  }

  resetFront(): void {
    this.frontShift = 0;
  }

  crestAt(x: number): number {
    return 0.275 + 0.015 * Math.cos(x * Math.PI * 1.6 - this.time * 0.35)
      + 0.006 * Math.sin(x * 11 + this.time * 0.9);
  }

  breakAt(y: number): number {
    const progress = clamp((y - this.crestAt(0.7)) / (1 - this.crestAt(0.7)));
    // The lip turns over quickly, falls almost vertically, then spreads at the foot.
    return this.frontShift + 0.45 + 0.23 * Math.exp(-progress * 9) - 0.30 * progress ** 4
      + 0.018 * Math.sin(this.time * 0.6) * (1 - progress)
      + 0.008 * Math.sin(progress * 12 - this.time * 1.4);
  }

  foamWidthAt(y: number): number {
    return 0.045 + clamp(y) * 0.025;
  }

  gapAheadOfFoam(x: number, y: number, width: number): number {
    return Math.max(0, (x - this.breakAt(y) - this.foamWidthAt(y)) * width);
  }

  /** Continuous forces around the breaking edge; crest froth is visual only. */
  physicsAt(x: number, y: number, boardHalfWidth: number): { slope: number; foam: number } {
    const crest = this.crestAt(x);
    const slope = 1 - clamp((y - crest) / (0.85 - crest));
    const edge = this.breakAt(y);
    const width = this.foamWidthAt(y);
    const distance = x - edge;
    const foam = clamp((width + boardHalfWidth - distance) / (width * 1.5 + boardHalfWidth));
    return { slope, foam };
  }

  regionAt(x: number, y: number): WaveRegion {
    if (y < this.horizon) return 'sky';
    if (y < this.crestAt(x)) return 'ocean';
    const distance = x - this.breakAt(y);
    if (Math.abs(distance) < this.foamWidthAt(y)) return 'foam';
    return distance < 0 ? 'whitewater' : 'face';
  }
}
