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

- `player_idle`: 4 frames. Placeholder generated and integrated; replace after player reference is provided.
- `player_run`: 4 frames. Placeholder generated and integrated; replace after player reference is provided.
- `player_jump`: 1-2 frames.
- `player_attack`: 4 frames.
- `player_hurt`: 2 frames.
- `player_homing_attack`: 4 frames.
- `princess_idle`: 4 frames.
- `princess_run`: 4 frames.
- `princess_jump`: 1-2 frames.
- `princess_attack`: 4 frames.
- `enemy_slime_idle`: 4 frames.
- `enemy_slime_move`: 4 frames.
- `coin`: 4 frames.
- `slash_fx`: 4 frames.
- `platform_tiles_basic`: simple grass/stone tile set.

## Reference Policy

When character reference art is provided, replace placeholder player assets instead of keeping multiple versions with similar names. This avoids asset confusion after context compaction and keeps Phaser runtime paths stable.

Reference folders:

- Knight reference: `assets/reference/knight/`.
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
- Status: placeholder. Replace after knight reference is provided.

### `player_run`

- Source raw sheet: `assets/source/generated/player_run/raw-sheet.png`.
- Full processed output: `assets/source/generated/player_run/processed/`.
- Runtime sheet: `public/assets/sprites/player_run/sheet-transparent.png`.
- Phaser frame size: `128x128`.
- QC: no edge-touch frames reported by `assets/source/generated/player_run/processed/pipeline-meta.json`.
- Status: placeholder. Replace after knight reference is provided.
