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

- `player_idle`: 4 frames.
- `player_run`: 4 frames.
- `player_jump`: 1-2 frames.
- `player_attack`: 4 frames.
- `player_hurt`: 2 frames.
- `enemy_slime_idle`: 4 frames.
- `enemy_slime_move`: 4 frames.
- `slash_fx`: 4 frames.
- `platform_tiles_basic`: simple grass/stone tile set.

## Folder Convention

- Raw generated files: `assets/source/generated/<asset-name>/`.
- Processed sheets: `public/assets/sprites/<asset-name>.png`.
- Metadata: `public/assets/sprites/<asset-name>.json`.
- Temporary QC files: `assets/source/generated/<asset-name>/qc/`.

## Integration Rule

Do not wire generated art directly into gameplay until the movement, collision, and attack loop works with placeholder rectangles. This keeps art iteration from hiding gameplay bugs.
