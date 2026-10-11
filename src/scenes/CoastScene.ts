import Phaser from 'phaser';

/** Shared, code-drawn backdrop until the game's art is ready. */
export abstract class CoastScene extends Phaser.Scene {
  protected mountScreen(screen: HTMLElement): void {
    const ui = document.querySelector<HTMLDivElement>('#ui')!;
    ui.replaceChildren(screen);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => screen.remove());
  }

  protected createCoast(): void {
    const graphics = this.add.graphics();
    const draw = () => {
      const { width, height } = this.scale;
      const horizon = Math.round(height * 0.55);
      graphics.clear();

      // Stepped bands and a striped sunset give the menu a retro coastal feel.
      const sky = [0x082c46, 0x123d57, 0x235065, 0x476572, 0x827b7e, 0xc39687];
      sky.forEach((color, index) => {
        const top = Math.floor((index / sky.length) * horizon);
        graphics.fillStyle(color).fillRect(0, top, width, Math.ceil(horizon / sky.length) + 1);
      });

      const sunX = width * 0.78;
      const sunY = horizon - 60;
      graphics.fillStyle(0xffd19b).fillCircle(sunX, sunY, 56);
      graphics.fillStyle(0xc39687);
      for (let stripe = 0; stripe < 5; stripe++) {
        graphics.fillRect(sunX - 58, sunY + 8 + stripe * 9, 116, 3 + stripe);
      }

      graphics.fillStyle(0x176d83).fillRect(0, horizon, width, height - horizon);
      graphics.fillStyle(0x105669).fillRect(0, horizon + 35, width, height - horizon);
      graphics.fillStyle(0x0a4054).fillRect(0, height * 0.8, width, height * 0.2);

      for (let row = 0; row < 10; row++) {
        const y = horizon + 10 + row * row * 3;
        graphics.lineStyle(row > 5 ? 3 : 2, 0x7eb6b1, 0.18);
        for (let column = -1; column < width / 110; column++) {
          const x = column * 110 + (row % 3) * 32;
          graphics.lineBetween(x, y, x + 45 + row * 3, y);
        }
      }

      graphics.fillStyle(0x061f34, 0.25).fillRect(0, 0, width, height);
    };

    draw();
    this.scale.on(Phaser.Scale.Events.RESIZE, draw);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, draw);
    });
  }
}
