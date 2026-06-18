# Next Steps

## Current State

ProjectAlmost is a Web-first Svelte + Phaser game. The current flow includes Title Screen, Stage Select, two playable stages, pause/settings menus, Stage Result, save progression, keyboard/gamepad input, BGM, and SFX.

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

Known build note: Vite warns that the Phaser bundle is larger than 500 kB. This does not block development.

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

Create final art and behavior for Azure Core, then continue building White Palace stages from the JSON stage format.

## Recommended Task Order

1. Replace Azure Core graybox art with final animation assets.
2. Add more enemy behaviors and White Palace stages.
3. Add automated smoke tests for navigation, save progression, and stage completion.
4. Add mobile touch virtual buttons.
5. Evaluate desktop and mobile packaging after Web gameplay is stable.

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
- Avoid keeping obsolete placeholder sprite folders. They create confusion for future handoff.

## Current Main Files

- `src/App.svelte`: Svelte shell and Phaser mount.
- `src/game/createGame.ts`: Phaser game configuration.
- `src/game/scenes/GameplayScene.ts`: current gameplay scene.
- `src/game/stages/`: stage JSON, types, and registry.
- `src/game/save/saveData.ts`: local save progression.
- `docs/GAME_DESIGN.md`: story, worlds, mechanics, vertical slice.
- `docs/TECHNICAL_PLAN.md`: architecture and implementation sequence.
- `docs/ASSET_PIPELINE.md`: sprite generation and asset inventory.
