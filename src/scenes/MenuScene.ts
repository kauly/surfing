import { CoastScene } from './CoastScene';
import { resolveDifficulty } from '../game/Difficulty';

export class MenuScene extends CoastScene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.createCoast();

    // Native HTML controls keep name entry, keyboard navigation, and mobile
    // keyboards accessible while Phaser owns the scenes and canvas.
    const screen = document.createElement('section');
    screen.className = 'screen';
    screen.setAttribute('aria-labelledby', 'game-title');
    screen.innerHTML = `
      <div class="menu">
        <p class="eyebrow">COAST TO COAST · SURFING</p>
        <h1 id="game-title">California<span>Surf</span></h1>
        <p class="intro">A little sunshine. A perfect wave.</p>
        <form class="player-form">
          <label for="player-name">PLAYER NAME</label>
          <input id="player-name" name="playerName" type="text"
            placeholder="Enter your name" maxlength="20" required
            autocomplete="nickname" aria-describedby="name-hint" />
          <p id="name-hint" class="hint">Your next session starts here.</p>
          <label for="difficulty">DIFFICULTY</label>
          <select id="difficulty" name="difficulty" aria-describedby="difficulty-hint">
            <option value="easy">Easy · gentle foam</option>
            <option value="normal">Normal · steady chase</option>
            <option value="hard">Hard · fast foam</option>
          </select>
          <p id="difficulty-hint" class="hint">Hard keeps the current foam speed.</p>
          <button type="submit">Play <span aria-hidden="true">→</span></button>
        </form>
        <p class="footer-note">CALIFORNIA DREAMING, ONE WAVE AT A TIME</p>
      </div>
    `;

    const form = screen.querySelector<HTMLFormElement>('form')!;
    const input = screen.querySelector<HTMLInputElement>('input')!;
    const difficultySelect = screen.querySelector<HTMLSelectElement>('#difficulty')!;
    input.value = this.registry.get('playerName') ?? '';
    difficultySelect.value = resolveDifficulty(this.registry.get('difficulty'));
    input.addEventListener('input', () => input.setCustomValidity(''));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const playerName = input.value.trim();
      if (!playerName) {
        input.setCustomValidity('Please enter your player name.');
        input.reportValidity();
        return;
      }

      this.registry.set('playerName', playerName);
      this.registry.set('difficulty', resolveDifficulty(difficultySelect.value));
      this.scene.start('Surf');
    });

    this.mountScreen(screen);
  }
}
