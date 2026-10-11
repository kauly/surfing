import Phaser from 'phaser';
import { WaveShape } from './WaveShape';
import { Foam } from './Foam';
import { WaterFace } from './WaterFace';
import { NoiseField } from './NoiseField';
import type { Difficulty } from '../game/Difficulty';

type Grain = { x: number; y: number; size: number; shade: number };
const WATER_COLORS = ['#1649b0', '#3b75cf', '#77a5e2', '#aacde9'];
const FOAM_COLORS = ['#a4c8ef', '#c7e1f6', '#e8f4ff', '#ffffff'];
const TEXTURE_KEY = 'surf-wave';

/** Low-resolution animated canvas uploaded to a single Phaser texture at 30fps. */
export class Wave {
  readonly shape: WaveShape;
  paused = false;
  private readonly scene: Phaser.Scene;
  private readonly texture: Phaser.Textures.CanvasTexture;
  private readonly image: Phaser.GameObjects.Image;
  private readonly grains: Grain[] = [];
  private readonly foam = new Foam();
  private readonly waterFace = new WaterFace();
  private readonly crestNoise = new NoiseField(1947);
  private frameTime = 0;

  constructor(scene: Phaser.Scene, difficulty: Difficulty) {
    this.scene = scene;
    this.shape = new WaveShape(difficulty);
    this.texture = scene.textures.createCanvas(TEXTURE_KEY, 1, 1)!;
    this.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.image = scene.add.image(0, 0, TEXTURE_KEY).setOrigin(0);

    // Stable grain avoids random flicker and is reused for every frame.
    const random = new Phaser.Math.RandomDataGenerator(['california-surf-wave']);
    for (let index = 0; index < 4800; index++) {
      this.grains.push({
        x: random.frac(), y: random.frac(),
        size: random.between(1, 3), shade: random.between(0, 3),
      });
    }
    this.resize();
  }

  resize(): void {
    const { width, height } = this.scene.scale;
    // Bound texture work on large displays; keep pixels square at every aspect ratio.
    const ratio = Math.min(512 / width, 360 / height);
    this.texture.setSize(Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio)));
    this.image.setDisplaySize(width, height);
    this.draw();
  }

  update(delta: number): void {
    if (this.paused) return;
    this.shape.advance(delta / 1000, this.scene.scale.width, this.scene.scale.height);
    this.frameTime += delta;
    if (this.frameTime < 1000 / 30) return;
    this.frameTime %= 1000 / 30;
    this.draw();
  }

  destroy(): void {
    this.image.destroy();
    this.scene.textures.remove(TEXTURE_KEY);
  }

  private draw(): void {
    const ctx = this.texture.getContext();
    const { width: w, height: h } = ctx.canvas;
    const time = this.shape.time;

    const sky = ['#293d8c', '#3c51a3', '#536bb7', '#7089c6', '#97b0da'];
    sky.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, Math.floor(index * h * 0.14 / sky.length), w, Math.ceil(h * 0.14 / sky.length) + 1);
    });
    ctx.fillStyle = '#16569a';
    ctx.fillRect(0, Math.floor(h * this.shape.horizon), w, h);

    // Small, horizontally drifting ripples establish the distant ocean.
    for (let index = 0; index < 350; index++) {
      const grain = this.grains[index];
      ctx.fillStyle = WATER_COLORS[grain.shade];
      ctx.fillRect(Math.floor(((grain.x + time * 0.012) % 1) * w),
        Math.floor((0.145 + grain.y * 0.15) * h), grain.size + 2, 1);
    }

    ctx.fillStyle = '#3568b9';
    const surface = new Path2D();
    surface.moveTo(0, this.shape.crestAt(0) * h);
    for (let x = 0; x <= w; x += 2) surface.lineTo(x, this.shape.crestAt(x / w) * h);
    surface.lineTo(w, h);
    surface.lineTo(0, h);
    surface.closePath();
    ctx.fill(surface);

    this.waterFace.draw(ctx, this.shape);

    const whitewater = ctx.createLinearGradient(0, h * 0.3, w * 0.5, h);
    whitewater.addColorStop(0, '#3f6acb');
    whitewater.addColorStop(0.45, '#244f9e');
    whitewater.addColorStop(1, '#5a82ca');
    ctx.fillStyle = whitewater;
    ctx.beginPath();
    ctx.moveTo(0, this.shape.crestAt(0) * h);
    ctx.lineTo(this.shape.breakAt(0.28) * w, h * 0.28);
    for (let y = 0.28; y <= 1.02; y += 0.01) ctx.lineTo(this.shape.breakAt(y) * w, y * h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Small glints drift through the broken water behind the foam.
    for (const grain of this.grains) {
      const x = (grain.x - time * 0.022 % 1 + 1) % 1;
      const speed = x < this.shape.breakAt(0.6) ? 0.11 : 0.035;
      const y = 0.3 + ((grain.y + time * speed) % 1) * 0.75;
      const region = this.shape.regionAt(x, y);
      if (region !== 'whitewater' && region !== 'foam') continue;
      ctx.fillStyle = WATER_COLORS[grain.shade];
      ctx.globalAlpha = 0.35;
      ctx.fillRect(Math.floor(x * w), Math.floor(y * h), grain.size, 1);
    }
    ctx.globalAlpha = 1;

    // Connected, shaded foam replaces the uniform painted bands.
    const lip = this.shape.crestAt(0.7);
    this.foam.draw(ctx, this.shape);

    // Spray arcs away from the lip, separates into droplets, and falls back down.
    for (let index = 0; index < 170; index++) {
      const grain = this.grains[index];
      const age = (grain.x + time * (0.3 + grain.y * 0.2)) % 1;
      const sourceY = lip + grain.y * (1 - lip);
      const sourceX = this.shape.breakAt(sourceY) + this.shape.foamWidthAt(sourceY) * 0.6;
      const x = sourceX + age * (0.025 + grain.y * 0.025);
      const y = sourceY - Math.sin(age * Math.PI) * 0.035 + age * age * 0.045;
      ctx.globalAlpha = Math.sin(age * Math.PI) * 0.65;
      ctx.fillStyle = FOAM_COLORS[grain.shade];
      ctx.fillRect(Math.floor(x * w), Math.floor(y * h), 1, grain.size === 3 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // Decorative froth begins at the breaking lip and follows only the open
    // wave crest. The whitewater side keeps its existing spray and foam.
    const depth = Math.max(3, Math.round(h * 0.018));
    const lipX = Math.round(this.shape.breakAt(lip) * w);
    for (let x = lipX; x < w; x++) {
      const flow = x - time * 5;
      const swell = this.crestNoise.sample(flow * 0.09, time * 0.3);
      const crest = Math.round(this.shape.crestAt(x / w) * h);
      const fadeIn = Math.min(1, (x - lipX + 1) / Math.max(1, depth));
      const top = -Math.round((1 + swell * depth * 0.55) * fadeIn);
      const bottom = Math.round((1 + swell * depth) * fadeIn);
      for (let offset = top; offset <= bottom; offset++) {
        const grain = this.crestNoise.sample(flow * 0.48, offset * 0.6 + time * 0.5);
        const fringe = offset === top || offset === bottom;
        if (grain < (fringe ? 0.48 : 0.26)) continue;
        const shade = offset > bottom * 0.5 ? (grain > 0.6 ? 1 : 0)
          : grain > 0.57 ? 3 : 2;
        ctx.fillStyle = FOAM_COLORS[shade];
        ctx.fillRect(x, crest + offset, 1, 1);
      }
    }
    this.texture.refresh();
  }
}
