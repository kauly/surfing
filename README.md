# California Surf

A 2D arcade surfing game scaffold built with Phaser 3, TypeScript, and Vite.

## Develop

Requires Node.js 22.12+ (or 20.19+) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Enter a player name, choose a difficulty,
and click **Play**
(or press Enter) to start free surfing. Names are trimmed, required,
and limited to 20 characters. Back to menu retains the name for the current session.
The menu defaults to Normal and remembers your choice when you return. Easy moves
the foam at about 86 px/s on a 720px-high screen, Normal at 144 px/s, and Hard
keeps the previous 202 px/s pace. Surfer controls are the same on every level.
Use **Arrow keys / WASD** to steer, or hold the on-screen arrows on touch devices.
Left / A continuously rotates the board counterclockwise and Right / D rotates
it clockwise, through full turns. The board holds its angle when released;
neither key adds speed. Up / W climbs diagonally forward and Down / S descends
diagonally forward. Both add forward drive, even during a spin.
Alternate **Up and Down** (or W and S) to build speed: ride one direction for
a moment, then switch to the other. Holding one direction gives no repeated
burst, and pressing both together cancels the stroke. With no direction held,
the surfer stays near the same height and alternates between standing and
knee flexion. The flexed frame reduces body clearance
below the crest; the board keeps its full size.
Climb into the lip with Up and enough forward speed to launch an aerial.
While airborne, use Left or Right to rotate the board about 180° from its
takeoff angle. Landing at the opposite angle succeeds; landing at another
angle causes a wipeout. Release Up before attempting another aerial.
The wave pulls the board downhill, while momentum carries through turns. The
breaking foam advances across the wave. Alternate Up and Down to open
space ahead of it; the view follows forward travel. The gap display marks when
there is room for future maneuvers. The foam slows and pushes the board away;
sustained contact causes a wipeout and an automatic reset. The thin foam along
the top of the open wave is decorative and does not affect movement.
**Pause** freezes the surfer and wave; **Resume** continues them. The session
starts paused when your system requests reduced motion.

```sh
npm run check   # TypeScript validation
npm run build   # Type-check and build to dist/
npm run preview # Preview the production build
```

## Structure

- `src/main.ts` configures Phaser and registers the scenes.
- `src/scenes/MenuScene.ts` contains player entry, difficulty choice, and the Play action.
- `src/scenes/SurfScene.ts` runs the surf scene, keyboard/touch input, and pause/menu controls.
- `src/player/Surfer.ts` renders the riding poses, board, and a fading foam trail when moving.
- `src/player/SurfPhysics.ts` runs fixed-step motion, alternating strokes,
  aerials and landing checks, foam contact, wipeouts, and recovery.
- `src/assets/surfer-*.png` contains the transparent generated source artwork, sampled
  into aligned 64×64 game textures at runtime. See `docs/surfer-art.md` for the prompts.
- `src/wave/WaveShape.ts` defines the advancing breaking edge, camera-relative
  gap, and continuous slope and foam contact values used by surf physics.
- `src/wave/Wave.ts` draws the wave face, water flow, and moving foam to a bounded
  low-resolution Phaser canvas texture, refreshed at up to 30 frames per second.
- `src/wave/Foam.ts` renders moving foam density, shaded water pockets, and
  fragmented whitewater using deterministic noise that flows with the wave.
- `src/wave/WaterFace.ts` shades the hollow with drifting ocean-blue pixel texture.
- `src/wave/NoiseField.ts` provides the repeatable noise used by water and foam.
- `src/scenes/CoastScene.ts` draws the menu's coastal background and mounts UI.
- `src/style.css` styles the native HTML UI over the Phaser canvas.
- `docs/surf-1.webp` is the original visual reference; it is not bundled as game art.

The scaffold uses responsive HTML controls for accessible name entry and buttons.
Player names live in Phaser's registry. Left/right steering selects the matching
carving pose; up uses a raised climbing stance and down uses a low crouch.
Diagonal input keeps the left/right carving pose; releasing all input returns to
the alternating idle poses at the board's current angle. Scoring, audio, and a backend
are not implemented yet.
