import { CoastScene } from './CoastScene';
import Phaser from 'phaser';
import { Wave } from '../wave/Wave';
import { Surfer, SURFER_ART } from '../player/Surfer';
import { resolveDifficulty } from '../game/Difficulty';

export class SurfScene extends CoastScene {
  private wave?: Wave;
  private surfer?: Surfer;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private letters?: Record<string, Phaser.Input.Keyboard.Key>;
  private gapDisplay?: HTMLOutputElement;
  private readonly heldDirections = new Set<string>();

  constructor() {
    super('Surf');
  }

  preload(): void {
    for (const art of Object.values(SURFER_ART)) {
      if (!this.textures.exists(art.source)) this.load.image(art.source, art.url);
    }
  }

  create(): void {
    const difficulty = resolveDifficulty(this.registry.get('difficulty'));
    const wave = new Wave(this, difficulty);
    this.wave = wave;
    wave.paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const surfer = new Surfer(this, wave.shape);
    this.surfer = surfer;
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.letters = this.input.keyboard?.addKeys('W,A,S,D', false) as Record<string, Phaser.Input.Keyboard.Key> | undefined;

    const screen = document.createElement('section');
    screen.className = 'surf-screen';
    screen.setAttribute('aria-labelledby', 'session-title');
    screen.innerHTML = `
      <header class="surf-header">
        <div class="surf-player"><span class="eyebrow">CALIFORNIA SURF</span><span id="player-display"></span></div>
        <button class="surf-button" id="back-button" type="button">Back to menu</button>
      </header>
      <output class="foam-gap" id="foam-gap" aria-label="Distance ahead of foam"></output>
      <div class="steer-pad" role="group" aria-label="Surf steering">
        <button type="button" data-direction="up" aria-label="Steer up">↑</button>
        <button type="button" data-direction="left" aria-label="Steer left">←</button>
        <button type="button" data-direction="down" aria-label="Steer down">↓</button>
        <button type="button" data-direction="right" aria-label="Steer right">→</button>
      </div>
      <footer class="surf-footer">
        <div><h1 id="session-title" tabindex="-1">Free surf</h1><p><span class="keyboard-hint">Build speed, climb to the lip, then spin 180° with Left or Right to land an aerial.</span><span class="touch-hint">Climb with ↑ to launch. Spin 180° with ← or → to land.</span></p></div>
        <button class="surf-button" id="pause-button" type="button" aria-pressed="false">Pause</button>
      </footer>
    `;
    const title = screen.querySelector<HTMLHeadingElement>('h1')!;
    this.gapDisplay = screen.querySelector<HTMLOutputElement>('#foam-gap')!;
    screen.querySelector('#player-display')!.textContent = this.registry.get('playerName');
    screen.querySelector('.surf-player .eyebrow')!.textContent = `CALIFORNIA SURF · ${difficulty.toUpperCase()}`;
    screen.querySelector('#back-button')!.addEventListener('click', () => {
      this.scene.start('Menu');
    });
    const pauseButton = screen.querySelector<HTMLButtonElement>('#pause-button')!;
    const updatePauseButton = () => {
      pauseButton.textContent = wave.paused ? 'Resume' : 'Pause';
      pauseButton.setAttribute('aria-pressed', String(wave.paused));
    };
    pauseButton.addEventListener('click', () => {
      wave.paused = !wave.paused;
      this.heldDirections.clear();
      surfer.cancelStroke();
      updatePauseButton();
    });
    updatePauseButton();

    for (const button of screen.querySelectorAll<HTMLButtonElement>('[data-direction]')) {
      const direction = button.dataset.direction!;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.heldDirections.add(direction);
      });
      const release = () => this.heldDirections.delete(direction);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'Enter') this.heldDirections.add(direction);
      });
      button.addEventListener('keyup', release);
      button.addEventListener('blur', release);
    }
    const clearInput = () => {
      this.heldDirections.clear();
      surfer.cancelStroke();
    };
    window.addEventListener('blur', clearInput);

    const resize = () => {
      wave.resize();
      surfer.resize(wave.shape);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resize);
      window.removeEventListener('blur', clearInput);
      this.heldDirections.clear();
      this.gapDisplay = undefined;
      this.input.keyboard?.removeAllKeys(true);
      this.input.keyboard?.removeCapture([
        Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.RIGHT,
      ]);
      surfer.destroy();
      this.surfer = undefined;
      wave.destroy();
      this.wave = undefined;
    });

    this.mountScreen(screen);
    title.focus();
  }

  update(_time: number, delta: number): void {
    if (!this.wave || this.wave.paused) return;
    const down = (direction: string, cursor?: Phaser.Input.Keyboard.Key, letter?: Phaser.Input.Keyboard.Key) =>
      Number(this.heldDirections.has(direction) || cursor?.isDown || letter?.isDown || false);
    const x = down('right', this.cursors?.right, this.letters?.D) - down('left', this.cursors?.left, this.letters?.A);
    const up = down('up', this.cursors?.up, this.letters?.W);
    const downInput = down('down', this.cursors?.down, this.letters?.S);
    this.surfer?.update(delta, x, downInput - up, Boolean(up && downInput), this.wave.shape);
    this.wave.update(delta);
    if (this.surfer && this.gapDisplay) {
      const gap = this.wave.shape.gapAheadOfFoam(this.surfer.physics.x,
        this.surfer.physics.y, this.scale.width);
      const room = gap > this.surfer.physics.bodyHeight * 3.5;
      const status = this.surfer.physics.state === 'wipedOut' ? 'WIPEOUT'
        : this.surfer.physics.state === 'airborne' ? 'AERIAL · TURN 180°'
          : this.surfer.physics.landedAerialTime > 0 ? 'AERIAL LANDED'
            : gap < this.surfer.physics.bodyHeight * 1.4 ? 'FOAM CLOSE'
          : room ? 'ROOM TO MANEUVER' : 'BUILD SPEED';
      const label = `FOAM ${Math.round(gap / 10) * 10} PX · ${status}`;
      if (this.gapDisplay.textContent !== label) this.gapDisplay.textContent = label;
      this.gapDisplay.dataset.state = this.surfer.physics.state === 'wipedOut'
        ? 'danger' : gap < this.surfer.physics.bodyHeight * 1.4 ? 'danger'
          : room ? 'clear' : 'chase';
    }
  }
}
