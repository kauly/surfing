import { NoiseField } from './NoiseField';
import { WaveShape } from './WaveShape';

// Ocean blues with lifted shadows and fine dithering between shades.
const PALETTE = [
  0x102c68, 0x153978, 0x1c478d, 0x2455a4,
  0x2d65b9, 0x3975cb, 0x4b89dc, 0x69a1e8,
];

/** Dense, drifting water texture whose broad shading describes the hollow. */
export class WaterFace {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly noise = new NoiseField(2941);
  private pixels?: ImageData;
  private crest = new Float32Array(0);

  draw(target: CanvasRenderingContext2D, shape: WaveShape): void {
    const { width, height } = target.canvas;
    if (!this.pixels || this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.pixels = this.context.createImageData(width, height);
      this.crest = new Float32Array(width);
    }
    const data = this.pixels.data;
    data.fill(0);
    for (let x = 0; x < width; x++) this.crest[x] = shape.crestAt(x / width);

    for (let y = Math.floor(height * 0.25); y < height; y++) {
      const v = y / height;
      const start = Math.max(0, Math.floor((shape.breakAt(v) - shape.foamWidthAt(v)) * width));
      const flow = y - shape.time * height * 0.035;
      for (let x = start; x < width; x++) {
        if (v < this.crest[x]) continue;
        const u = x + shape.time * width * 0.018;
        const broad = this.noise.sample(u * 0.018, flow * 0.02);
        const medium = this.noise.sample(u * 0.095 + broad * 4, flow * 0.085 - broad * 2);
        const fine = this.noise.sample(u * 0.62 + 43, flow * 0.58);
        const grit = this.noise.sample(u * 1.71, flow * 1.63 + 71);

        // One broad hollow, with irregular patches of reflected light.
        const dx = (x / width - 0.71 + (broad - 0.5) * 0.035) / 0.29;
        const dy = (v - 0.56 + (medium - 0.5) * 0.03) / 0.36;
        const hollow = Math.exp(-dx * dx - dy * dy);
        const lipLight = Math.exp(-(v - this.crest[x]) * 18);
        const light = 0.66 - hollow * 0.28 + lipLight * 0.12
          + (broad - 0.5) * 0.19 + (medium - 0.5) * 0.17;
        const shade = light * 7 + (fine - 0.5) * 1.7 + (grit - 0.5) * 1.5;
        const color = PALETTE[Math.min(7, Math.max(0, Math.floor(shade)))];
        const offset = (y * width + x) * 4;
        data[offset] = color >> 16;
        data[offset + 1] = (color >> 8) & 255;
        data[offset + 2] = color & 255;
        data[offset + 3] = 255;
      }
    }
    this.context.putImageData(this.pixels, 0, 0);
    target.drawImage(this.canvas, 0, 0);
  }
}
