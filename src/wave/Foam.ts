import { WaveShape } from './WaveShape';
import { NoiseField } from './NoiseField';

const PALETTE = [
  [31, 65, 140], [63, 103, 177], [104, 144, 205],
  [151, 184, 224], [195, 217, 238], [228, 240, 249], [251, 252, 248],
];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Advected, coherent foam density: connected froth with pockets of water inside. */
export class Foam {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly noise = new NoiseField(8137);
  private pixels?: ImageData;

  draw(target: CanvasRenderingContext2D, shape: WaveShape): void {
    const { width, height } = target.canvas;
    if (!this.pixels || this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.pixels = this.context.createImageData(width, height);
    }
    const data = this.pixels.data;
    data.fill(0);
    const time = shape.time;
    const lip = shape.crestAt(0.7) * height;

    for (let y = Math.max(0, Math.floor(lip - height * 0.025)); y < height; y++) {
      const v = y / height;
      const edge = shape.breakAt(v) * width;
      const halfWidth = shape.foamWidthAt(v) * width;
      const flow = y - time * height * 0.13;
      const surge = Math.sin(v * 27 - time * 2.2) * 0.15;
      const head = clamp((y - lip + height * 0.025) / (height * 0.055));
      const end = Math.min(width, Math.ceil(edge + halfWidth * 1.8));

      for (let x = 0; x < end; x++) {
        const distance = (x - edge) / halfWidth;
        // Sample in screen space so the roll contains round pockets; sampling
        // relative to the curved edge shears every pocket into the same long streak.
        const u = x + time * width * 0.055 + Math.sin(v * 24 - time) * 2;
        const large = this.noise.sample(u * 0.065 + time * 0.22, flow * 0.055);
        const medium = this.noise.sample(u * 0.22 - time * 0.18 + 31, flow * 0.19);
        const core = 1.05 - Math.abs(distance + 0.15 + surge)
          + (large - 0.5) * 1.35 + (medium - 0.5) * 0.6;
        // Older foam tears away into isolated patches behind the moving breaker.
        const wake = (large - 0.55) * 1.6 + (medium - 0.5) * 0.6
          - 0.1 - Math.max(0, -distance - 0.7) * 0.09;
        let density = Math.max(core, distance < -0.7 ? wake : -1) - (1 - head);
        if (density < -0.14) continue;
        const fine = this.noise.sample(u * 0.72 + 73, flow * 0.65 + time * 0.3);
        density += (fine - 0.5) * 0.28;
        if (density <= 0) continue;
        const above = this.noise.sample(u * 0.22 - time * 0.18 + 31, (flow - 2) * 0.19);
        const mottle = medium * 0.55 + fine * 0.3 + large * 0.15;
        const freshness = clamp(1 - Math.max(0, -distance - 0.6) / 3);
        let light = 0.48 + mottle * 0.55 + (above - medium) * 0.65;
        // Blue cavities stay visible within the white mass, giving it volume.
        if (mottle < 0.39) light -= (0.39 - mottle) * 2.6;
        light -= (1 - clamp(density * 4)) * 0.16 + (1 - freshness) * 0.25;
        const color = PALETTE[Math.min(6, Math.max(0, Math.floor(light * 7)))];
        const offset = (y * width + x) * 4;
        data[offset] = color[0];
        data[offset + 1] = color[1];
        data[offset + 2] = color[2];
        data[offset + 3] = Math.round(clamp(density * 7) * (0.65 + freshness * 0.35) * 255);
      }
    }
    this.context.putImageData(this.pixels, 0, 0);
    target.drawImage(this.canvas, 0, 0);
  }
}
