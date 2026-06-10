# Asset Pipeline

## Sprite Generation Rules

Use `generate2dsprite` for first-pass assets. Keep the background `#FF00FF` during raw generation so the processor can chroma-key transparency.

## Initial Sprite Specs

- Player frame size: `64x64`.
- Enemy frame size: `48x48` or `64x64`.
- Tile size: `32x32`.
- FX frame size: `64x64`.
- View: side.
- Anchor: feet for actors, center for projectiles and FX.

## First Asset List

- `player_idle`: 4 frames. Reference-based knight asset generated and integrated.
- `player_run`: 4 frames. Reference-based knight asset generated and integrated.
- `player_jump`: 4 frames. Reference-based knight asset generated and integrated.
- `player_attack`: 4 frames. Reference-based knight asset generated and integrated.
- `player_hurt`: 4 frames. Reference-based knight asset generated and integrated.
- `player_death`: 4 frames. Reference-based knight asset generated and integrated.
- `player_homing_attack`: 4 frames.
- `princess_idle`: 4 frames.
- `princess_run`: 4 frames.
- `princess_jump`: 1-2 frames.
- `princess_attack`: 4 frames.
- `enemy_guard_walk`: 4 frames. White palace guard asset generated and integrated.
- `enemy_guard_death`: 4 frames. White palace guard asset generated and integrated.
- `coin`: 4 frames.
- `slash_fx`: 4 frames.
- `white_palace_platform_tiles`: 3-tile concept-derived platform strip integrated.
- `white_palace_parallax`: 3-layer scenery-only sky, far palace, and mid palace set integrated.

## Reference Policy

When character reference art is provided, replace placeholder player assets instead of keeping multiple versions with similar names. This avoids asset confusion after context compaction and keeps Phaser runtime paths stable.

Reference folders:

- Knight reference: `assets/reference/knight/player.jpeg`.
- Princess reference: `assets/reference/princess/`.

Runtime folders should keep stable names:

- Knight/player runtime sheets: `public/assets/sprites/player_<action>/`.
- Princess runtime sheets: `public/assets/sprites/princess_<action>/`.

## Folder Convention

- Raw generated files: `assets/source/generated/<asset-name>/`.
- Processed sheets: `public/assets/sprites/<asset-name>.png`.
- Metadata: `public/assets/sprites/<asset-name>.json`.
- Temporary QC files: `assets/source/generated/<asset-name>/qc/`.

## Integration Rule

Do not wire generated art directly into gameplay until the movement, collision, and attack loop works with placeholder rectangles. This keeps art iteration from hiding gameplay bugs.

## Generated Assets

### `player_idle`

- Source raw sheet: `assets/source/generated/player_idle/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_idle/processed/`.
- Runtime sheet: `public/assets/sprites/player_idle/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_idle/processed/pipeline-meta.json`.
- Status: reference-based knight asset.

### `player_run`

- Source raw sheet: `assets/source/generated/player_run/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_run/processed/`.
- Runtime sheet: `public/assets/sprites/player_run/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_run/processed/pipeline-meta.json`.
- Status: reference-based knight asset.

### `player_attack`

- Source raw sheet: `assets/source/generated/player_attack/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_attack/processed/`.
- Runtime sheet: `public/assets/sprites/player_attack/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_attack/processed/pipeline-meta.json`.
- Status: reference-based knight asset.

### `player_jump`

- Source raw sheet: `assets/source/generated/player_jump/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_jump/processed/`.
- Runtime sheet: `public/assets/sprites/player_jump/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_jump/processed/pipeline-meta.json`.
- Status: reference-based knight asset.

### `player_hurt`

- Source raw sheet: `assets/source/generated/player_hurt/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_hurt/processed/`.
- Runtime sheet: `public/assets/sprites/player_hurt/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_hurt/processed/pipeline-meta.json`.
- Status: reference-based knight asset.

### `player_death`

- Source raw sheet: `assets/source/generated/player_death/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_death/processed/`.
- Runtime sheet: `public/assets/sprites/player_death/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_death/processed/pipeline-meta.json`.
- Status: reference-based knight asset.

### `enemy_guard_walk`

- Source raw sheet: `assets/source/generated/enemy_guard_walk/raw-sheet.png`.
- Full processed output: `assets/source/generated/enemy_guard_walk/processed/`.
- Runtime sheet: `public/assets/sprites/enemy_guard_walk/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/enemy_guard_walk/processed/pipeline-meta.json`.
- Status: white palace basic enemy asset.

### `enemy_guard_death`

- Source raw sheet: `assets/source/generated/enemy_guard_death/raw-sheet.png`.
- Full processed output: `assets/source/generated/enemy_guard_death/processed/`.
- Runtime sheet: `public/assets/sprites/enemy_guard_death/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/enemy_guard_death/processed/pipeline-meta.json`.
- Status: white palace basic enemy asset.

### `white_palace_platform_tiles`

- Concept source: `assets/source/generated/white_palace_concept_platform_tiles/raw-concept.png`.
- Generated v2 source and prompt: `assets/source/generated/white_palace_platform_tiles_v2/`.
- Full processed output: `assets/source/generated/white_palace_platform_tiles_v2/processed/`.
- Runtime tileset: `public/assets/tiles/white_palace_platform_tiles.png`.
- Phaser tile size: `64x64`.
- Runtime layout: 3 columns by 1 row: left cap, seamless middle repeat, mirrored right cap.
- Collision contract: the visible walkable top edge aligns with the tile's top edge.
- Status: second-pass generated White Palace platform tiles integrated.

### `white_palace_parallax`

- Source and prompts: `assets/source/generated/white_palace_parallax/<layer>/`.
- Runtime sky: `public/assets/maps/white_palace_sky.png`.
- Runtime far palace: `public/assets/maps/white_palace_far_bg.png`.
- Runtime mid palace: `public/assets/maps/white_palace_mid_bg.png`.
- Canvas contract: all layers are `1920x1080`; far and mid layers use alpha transparency.
- Runtime contract: scenery only. Platforms, collisions, actors, pickups, goal, and HUD remain separate.
- Status: first-pass White Palace parallax background integrated.
