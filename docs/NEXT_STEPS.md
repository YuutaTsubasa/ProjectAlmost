# Next Steps

## Current State

ProjectAlmost is currently a Web-first Svelte + Phaser prototype. The playable loop already supports player movement, jumping, melee attack, hurt reaction, knockback, brief invulnerability, one patrolling enemy, enemy defeat, camera follow, and fall respawn.

The project has not added Tauri yet. Keep gameplay iteration in the Web target until the core loop is stable.

## How To Run

```bash
npm install
npm run dev
```

Validation:

```bash
npm run check
npm run build
```

Known build note: Vite warns that the Phaser bundle is larger than 500 kB. This is expected for the current prototype and does not block development.

## Done

- Svelte + Vite + TypeScript project setup.
- Phaser scene mounted inside Svelte.
- Knight reference art stored at `assets/reference/knight/player.jpeg`.
- Generated and integrated knight animations:
  - `player_idle`
  - `player_run`
  - `player_attack`
  - `player_jump`
  - `player_hurt`
- Generated and integrated white palace guard animations:
  - `enemy_guard_walk`
  - `enemy_guard_death`
- Basic melee hitbox and enemy defeat flow.
- Player hurt, knockback, invulnerability, and blink feedback.
- Design, technical, and asset pipeline docs.
- Remote GitHub repo: `https://github.com/YuutaTsubasa/ProjectAlmost.git`.

## Immediate Next Task

Add a stage goal / exit point.

Acceptance criteria:

- Place a visible goal object near the end of the current prototype level.
- Detect player overlap with the goal.
- Show a clear state such as `Stage Clear`.
- Stop or pause player control after clear, or make the clear state explicit in the HUD.
- Keep this simple and data-free for the first pass.

Reason: this turns the current loop into `move -> jump platforms -> fight enemy -> reach goal`.

## Recommended Task Order

1. Add stage goal / exit point.
2. Extract prototype constants into simple stage data: platforms, enemy spawn, player spawn, goal position.
3. Add enemy hurt flash or hit pause before death.
4. Add Homing Attack targeting and dash behavior.
5. Add a first-pass level reset / restart input.
6. Add gamepad support.
7. Add mobile touch virtual buttons.
8. Add Tauri v2 desktop wrapper.
9. Add Tauri mobile targets after Web gameplay is stable.
10. Add collectible coins later; they are secondary to combat, platforming, and stage completion.

## Asset Workflow

Use generated assets in two locations:

- Source and QC output: `assets/source/generated/<asset-name>/`.
- Runtime sheet: `public/assets/sprites/<asset-name>/sheet-transparent.png`.

Keep stable runtime names. Do not create `v2` folders for replacement assets unless there is a strong reason. If an asset is replaced, overwrite the existing asset path and commit the replacement clearly.

Each generated asset should include:

- `raw-sheet.png`
- `processed/pipeline-meta.json`
- `processed/sheet-transparent.png`
- frame PNGs
- `processed/animation.gif`
- runtime `public/assets/sprites/<asset-name>/sheet-transparent.png`

Before committing new generated assets:

```bash
npm run check
npm run build
```

## Important Constraints

- Keep Svelte responsible for page shell, HUD, settings, and menus.
- Keep frame-by-frame gameplay inside Phaser.
- Do not add Tauri until the Web prototype has stage completion and stable combat/platforming.
- Do not add coin collection before the combat/platforming/goal loop is solid.
- Avoid keeping obsolete placeholder sprite folders. They create confusion for future handoff.

## Current Main Files

- `src/App.svelte`: Svelte shell and Phaser mount.
- `src/game/createGame.ts`: Phaser game configuration.
- `src/game/scenes/PrototypeScene.ts`: current gameplay prototype.
- `docs/GAME_DESIGN.md`: story, worlds, mechanics, vertical slice.
- `docs/TECHNICAL_PLAN.md`: architecture and implementation sequence.
- `docs/ASSET_PIPELINE.md`: sprite generation and asset inventory.
