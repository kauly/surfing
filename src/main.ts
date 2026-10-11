import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { SurfScene } from './scenes/SurfScene';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#082c46',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [MenuScene, SurfScene],
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
    document.querySelector('#ui')?.replaceChildren();
  });
}
