/** Repeatable, smoothly interpolated noise for moving water textures. */
export class NoiseField {
  private readonly values = new Float32Array(128 * 128);

  constructor(seed: number) {
    for (let index = 0; index < this.values.length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      this.values[index] = seed / 4294967296;
    }
  }

  sample(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    let fx = x - ix;
    let fy = y - iy;
    fx *= fx * (3 - 2 * fx);
    fy *= fy * (3 - 2 * fy);
    const x0 = ix & 127;
    const x1 = (ix + 1) & 127;
    const y0 = (iy & 127) * 128;
    const y1 = ((iy + 1) & 127) * 128;
    const top = this.values[y0 + x0] * (1 - fx) + this.values[y0 + x1] * fx;
    const bottom = this.values[y1 + x0] * (1 - fx) + this.values[y1 + x1] * fx;
    return top * (1 - fy) + bottom * fy;
  }
}
