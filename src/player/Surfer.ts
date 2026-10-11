import Phaser from 'phaser';
import { WaveShape } from '../wave/WaveShape';
import { SurfPhysics } from './SurfPhysics';
import neutralUrl from '../assets/surfer-neutral.png';
import leftUrl from '../assets/surfer-carve-left.png';
import rightUrl from '../assets/surfer-carve-right.png';
import upUrl from '../assets/surfer-up.png';
import downUrl from '../assets/surfer-down.png';
import idleStandUrl from '../assets/surfer-idle-stand.png';
import idleFlexUrl from '../assets/surfer-idle-flex.png';

export const SURFER_ART = {
  neutral: { source: 'surfer-source', texture: 'surfer-neutral', url: neutralUrl, offsetX: 0, offsetY: 0 },
  left: { source: 'surfer-left-source', texture: 'surfer-carve-left', url: leftUrl, offsetX: -1, offsetY: 1 },
  right: { source: 'surfer-right-source', texture: 'surfer-carve-right', url: rightUrl, offsetX: 0, offsetY: 0 },
  up: { source: 'surfer-up-source', texture: 'surfer-up', url: upUrl, offsetX: 0, offsetY: 0 },
  down: { source: 'surfer-down-source', texture: 'surfer-down', url: downUrl, offsetX: -1, offsetY: 2 },
  idleStand: { source: 'surfer-idle-stand-source', texture: 'surfer-idle-stand', url: idleStandUrl, offsetX: 0, offsetY: 0 },
  idleFlex: { source: 'surfer-idle-flex-source', texture: 'surfer-idle-flex', url: idleFlexUrl, offsetX: 0, offsetY: -2 },
} as const;
type RidingPose = keyof typeof SURFER_ART;
type FoamFleck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  duration: number;
  size: number;
  color: number;
};

/** Pixel-art presentation for the surfer's physical board-center position. */
export class Surfer {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly wake: Phaser.GameObjects.Graphics;
  private readonly trail: Phaser.GameObjects.Graphics;
  private readonly flecks: FoamFleck[] = [];
  readonly physics = new SurfPhysics();
  private elapsed = 0;
  private foamEmission = 0;
  private foamSeed = 0;
  private size = 0;
  private pose: RidingPose = 'idleStand';

  constructor(scene: Phaser.Scene, shape: WaveShape) {
    this.scene = scene;
    for (const art of Object.values(SURFER_ART)) {
      if (scene.textures.exists(art.texture)) continue;
      // Sample aligned 64px game textures while preserving generated originals.
      const texture = scene.textures.createCanvas(art.texture, 64, 64)!;
      const context = texture.getContext();
      context.imageSmoothingEnabled = false;
      context.drawImage(scene.textures.get(art.source).getSourceImage() as HTMLImageElement,
        art.offsetX, art.offsetY, 64, 64);
      texture.refresh();
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.trail = scene.add.graphics().setDepth(0.9);
    this.wake = scene.add.graphics().setDepth(1);
    this.sprite = scene.add.image(0, 0, SURFER_ART.idleStand.texture).setOrigin(0.54, 0.80).setDepth(2);
    this.resize(shape);
  }

  resize(shape: WaveShape): void {
    const { width, height } = this.scene.scale;
    this.size = Math.max(64, Math.min(190, width * 0.23, height * 0.28));
    this.sprite.setDisplaySize(this.size, this.size);
    this.physics.resize(shape, width, height, this.size);
    this.flecks.length = 0;
    this.foamEmission = 0;
    this.trail.clear();
    this.render();
  }

  update(delta: number, inputX: number, inputY: number,
    verticalConflict: boolean, shape: WaveShape): void {
    const { width, height } = this.scene.scale;
    this.physics.update(delta, { x: inputX, y: inputY, verticalConflict }, shape,
      width, height, this.size);
    this.elapsed += Math.min(delta / 1000, 0.1);
    this.updateTrail(Math.min(delta / 1000, 0.05));
    // Keep carving poses for diagonals; straight climbs and descents have their own stance.
    const pose: RidingPose = this.physics.state === 'wipedOut' ? 'down'
      : this.physics.state === 'airborne'
        ? inputX < 0 ? 'left' : inputX > 0 ? 'right' : 'up'
      : inputX === 0 && inputY === 0 && !verticalConflict
        ? this.physics.idleFlex ? 'idleFlex' : 'idleStand'
      : inputX < 0 ? 'left' : inputX > 0 ? 'right'
      : inputY < 0 ? 'up' : inputY > 0 ? 'down' : 'neutral';
    if (pose !== this.pose) {
      this.pose = pose;
      this.sprite.setTexture(SURFER_ART[pose].texture);
    }
    this.sprite.angle = this.physics.state === 'wipedOut'
      ? this.physics.angle + 70 : this.physics.angle;
    this.sprite.setAlpha(this.physics.state === 'wipedOut' ? 0.7 : 1);
    this.render();
  }

  cancelStroke(): void {
    this.physics.cancelStroke();
  }

  private updateTrail(dt: number): void {
    const { width, height } = this.scene.scale;
    const shift = this.physics.cameraShift;
    for (let index = this.flecks.length - 1; index >= 0; index--) {
      const fleck = this.flecks[index];
      fleck.x += fleck.vx * dt - shift;
      fleck.y += fleck.vy * dt;
      fleck.life -= dt;
      if (fleck.life <= 0 || fleck.x < -8) this.flecks.splice(index, 1);
    }

    const speed = Math.hypot(this.physics.vx, this.physics.vy);
    if (this.physics.state === 'riding' && speed > 85) {
      // Emit from the board's tail. Flecks stay in screen space after emission,
      // apart from the same camera shift applied to the wave beneath them.
      const angle = (25 + this.physics.angle) * Math.PI / 180;
      const forwardX = Math.cos(angle);
      const forwardY = Math.sin(angle);
      const tailX = this.physics.x * width - forwardX * this.size * 0.29;
      const tailY = this.physics.y * height - forwardY * this.size * 0.29;
      this.foamEmission = Math.min(8, this.foamEmission + speed * dt * 0.32);
      while (this.foamEmission >= 1) {
        this.foamEmission--;
        const seed = ++this.foamSeed;
        const across = Math.sin(seed * 19.37) * this.size * 0.07;
        const behind = (seed % 4) * this.size * 0.012;
        const duration = 0.6 + (seed % 5) * 0.1;
        this.flecks.push({
          x: tailX - forwardX * behind - forwardY * across,
          y: tailY - forwardY * behind + forwardX * across,
          vx: -forwardX * (14 + seed % 17),
          vy: -forwardY * 12 + 10 + seed % 9,
          life: duration,
          duration,
          size: seed % 4 === 0 ? 6 : 4,
          color: seed % 4 === 0 ? 0xffffff : seed % 3 === 0 ? 0xd8efff : 0xbddff4,
        });
      }
    } else {
      this.foamEmission = 0;
    }

    this.trail.clear();
    for (const fleck of this.flecks) {
      this.trail.fillStyle(fleck.color, Math.min(0.95, fleck.life / fleck.duration * 1.4));
      this.trail.fillRect(Math.round(fleck.x), Math.round(fleck.y), fleck.size, 2);
    }
  }

  private render(): void {
    const { width, height } = this.scene.scale;
    const x = this.physics.x * width;
    const y = this.physics.y * height;
    const airHeight = this.physics.airHeight;
    const bob = this.physics.state === 'airborne' ? 0
      : Math.sin(this.elapsed * 3.5) * this.size * 0.008;
    this.sprite.setPosition(Math.round(x), Math.round(y - airHeight + bob));
    this.wake.clear();
    // Keep only the board shadow attached; foam flecks remain on the water.
    this.wake.setPosition(x, y).setRotation(this.physics.state === 'airborne' ? 0 : this.sprite.rotation);
    this.wake.fillStyle(0x082f62, 0.22 * (1 - Math.min(0.6, airHeight / 140)));
    this.wake.fillEllipse(0, this.size * 0.035, this.size * 0.64, this.size * 0.11);
  }

  destroy(): void {
    this.sprite.destroy();
    this.wake.destroy();
    this.trail.destroy();
  }
}
