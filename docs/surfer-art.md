# Surfer riding sprites

The carving poses were made with built-in `image_gen` edits using the neutral
sprite as the reference and preserving transparency.

## Left-carving edit prompt

Edit the supplied neutral surfer game sprite into ONE LEFT-CARVING pose. Preserve the exact same character, pixel-art style, tan skin, short brown hair, green shorts, ivory board with yellow stripe, square canvas, transparent background, camera and subject scale. Keep the board in exactly the same location and heading as the reference: tail near normalized (0.23,0.61), nose near (0.87,0.92), board center near (0.54,0.80). Keep both feet on the board at the same locations. Change the body pose: bend knees more and shift hips, torso and head distinctly toward SCREEN LEFT, leaning into a turn; lower the left-reaching hand, raise the opposite arm for balance. Clear leftward lean readable at 64x64. Full character and board visible with padding. Do not mirror or turn the board around. No water, spray, background, text, grid, extra frames or characters. One clean transparent sprite.

## Right-carving edit prompt

Edit the supplied neutral surfer game sprite into ONE RIGHT-CARVING pose. Preserve the exact same character, pixel-art style, tan skin, short brown hair, green shorts, ivory board with yellow stripe, square canvas, transparent background, camera and subject scale. Keep the board in exactly the same location and heading as the reference: tail near normalized (0.23,0.61), nose near (0.87,0.92), board center near (0.54,0.80). Keep both feet on the board at the same locations. Change the body pose: bend knees more and shift hips, torso and head distinctly toward SCREEN RIGHT, leaning into a turn; lower the right-reaching hand toward the nose of the board, raise the opposite arm toward upper left for balance. Clear rightward lean readable at 64x64. Full character and board visible with padding. Do not mirror or turn the board around. No water, spray, background, text, grid, extra frames or characters. One clean transparent sprite.

## Up-steering edit prompt

Edit this neutral pixel-art surfer into ONE UP-STEERING / CLIMBING THE WAVE pose. Preserve the same tan male character, brown hair, green shorts, ivory surfboard with yellow stripe, exact pixel style, scale, square canvas and genuine transparency. Keep the entire board at the same size and position: tail (0.23,0.61), nose (0.87,0.92), center (0.54,0.80) in normalized canvas coordinates. Keep both bare feet planted in the same locations. Change the body into a visibly distinct rising, rear-weighted stance: torso lifted and leaning backward toward the upper-left tail, rear knee flexed, front leg more extended, chest open, both elbows bent with hands raised outward near shoulder height for balance. Character remains natural and athletic, not jumping. Readable at 64x64. Keep full head, arms, feet and board inside the canvas with padding. No extra poses, no water, spray, background, letters, grid or logos. Do not mirror the board.

## Down-steering edit prompt

Edit this neutral pixel-art surfer into ONE DOWN-STEERING / DESCENDING THE WAVE pose. Preserve the same tan male character, brown hair, green shorts, ivory surfboard with yellow stripe, exact pixel style, scale, square canvas and genuine transparency. Keep the entire board at the same size and position: tail (0.23,0.61), nose (0.87,0.92), center (0.54,0.80) in normalized canvas coordinates. Keep both bare feet planted in the same locations. Change the body into a visibly low, compact speed crouch: bend BOTH knees deeply, lower hips and head substantially, lean the chest forward toward the lower-right board nose, elbows bent with hands low near knees. Head should be around 35 percent down the canvas instead of near the top. Strong crouching silhouette that differs clearly from upright neutral, readable at 64x64. Natural anatomy and athletic balance, both hands visible, no grabbing board. Keep full character and board inside the canvas with padding. No extra poses, no water, spray, background, letters, grid or logos. Do not mirror the board.

## Asset files

- Tool: built-in `image_gen` (transparent background enabled).
- Saved assets: `src/assets/surfer-neutral.png`, `src/assets/surfer-carve-left.png`,
  `src/assets/surfer-carve-right.png`, `src/assets/surfer-up.png`,
  `src/assets/surfer-down.png`, `src/assets/surfer-idle-stand.png`, and
  `src/assets/surfer-idle-flex.png`.
- Source: 1254×1254 RGBA PNG. Phaser samples it into a 64×64 texture at runtime,
  preserving transparency and using nearest-neighbor scaling.
- All poses keep the surfer and board together. Horizontal steering selects left
  or right, including diagonals. Straight up/down input selects climbing/crouching;
  releasing all input returns to alternating straight-board standing and
  knee-flexion frames based on `docs/surf-2.jpg`. The flexed frame is sampled
  two pixels higher to align the board.
  Alternating up and down builds speed; simultaneous input cancels the stroke.
  All use the same 64×64 frame and
  board-center origin. The left frame is registered one pixel left and one pixel
  down at runtime to match the neutral board position. The down frame is registered
  one pixel left and two pixels down.
- Steering smoothly rotates the combined surfer and board around the board center:
  up targets -42 degrees, down +24 degrees, and right adds a -16-degree turn.
  Left turns counterclockwise toward -45 degrees without reverse thrust.
  Diagonals are capped between -50 and +35 degrees. Release eases back to
  neutral; the shadow and spray rotate with the board.

## Straight-board standing edit prompt

Create ONE new transparent pixel-art game sprite by editing the supplied surfer artwork. Image 1 is the existing character and art style to preserve: tan male surfer, short brown hair, bright green shorts, bare feet, ivory surfboard with narrow yellow stripe, crisp 64x64-era console pixels. Image 2 is the California Games screenshot reference for the IDLE STANCE and STRAIGHT BOARD orientation only; do not copy its background or exact copyrighted sprite. Turn the board so it is straight and nearly HORIZONTAL across the lower quarter of a square canvas, left tail near normalized (0.16,0.77), right nose near (0.88,0.77), center near (0.52,0.77), with no diagonal tilt. Show the same original character facing mostly toward the viewer, standing balanced above the board with knees only lightly bent, both feet planted around normalized x 0.40 and 0.62, arms out to either side for balance. Head near normalized (0.51,0.20). Keep ample transparent padding and exactly one full surfer plus one board. Strong pixel-art silhouette that reads at 64x64; no water, foam, shadow, scene, text, grid, second pose or extra objects. True transparent background, square image.

## Straight-board knee-flexion edit prompt

Edit Image 1 into ONE second frame for the same surfer's idle knee-flexion animation. Preserve the exact same square canvas, genuine transparent background, console pixel art style, tan male surfer, brown hair, green board shorts, face direction, skin palette, ivory surfboard with thin yellow stripe, and board outline. The board MUST remain horizontal, unchanged in size, heading and location: left tail near normalized (0.10,0.78), right nose near (0.90,0.78), center (0.50,0.78). Do not rotate, move, resize, redraw or mirror the board. Keep BOTH bare feet planted at the same screen x locations, approximately x=0.37 and x=0.65, on the same board top. Change only the surfer's pose into a visibly deeper KNEE FLEXION: bend both knees, lower hips and head by about one sixth of the canvas, torso folds slightly forward, arms remain extended for balance and lower somewhat. He is compressing to absorb the wave, not sitting, kneeling, jumping or falling. Image 2 is just the small retro screenshot cue for the pose. Strong distinct silhouette at 64x64, full character and board visible with transparent padding. No water, foam, background, shadow, letters, grid, extra poses or objects.

## Neutral generation prompt

Use case: stylized-concept. Asset type: transparent pixel-art sprite for a retro 2D arcade surfing game. Create ONE original male surfer and his surfboard together, in a neutral riding stance. Full body, tan skin, short brown hair, bright green board shorts, bare feet planted on a light ivory surfboard with a small yellow stripe. Bent knees, balanced stance, arms extended sideways. Three-quarter view from slightly above, chest visible, board pointing diagonally toward lower right. Late 1980s / early 1990s console pixel art with chunky square pixels, limited palette and crisp stepped edges, designed as a 64x64 pixel sprite shown at enlarged scale. The single character and entire board must fit within a square frame with transparent padding on every side. Board occupies lower quarter of frame; character head near upper fifth. Strong readable silhouette. No water, foam, shadow on ground, background, text, logo, borders, grid, extra poses, or extra characters. Genuine transparent background. This is the first neutral riding sprite, not a sprite sheet.
