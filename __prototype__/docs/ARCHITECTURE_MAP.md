# Architecture Map

This document describes where responsibilities currently live. Use it to avoid adding new behavior in the wrong layer.

## Top-Level Flow

```text
main.ts
  -> App.svelte
       -> Svelte screens and menus
       -> createGame(stageId, ...)
            -> Phaser.Game
                 -> GameplayScene(stageData)
```

`App.svelte` owns app-level state. `GameplayScene.ts` owns active gameplay simulation.

## Domain Ownership

Pure domain code lives under `src/domain/`.

It owns tested rules for progression, placement, validation, ranking, and future player intent state machines. Domain files must not import Svelte, Phaser, DOM APIs, or `localStorage`.

## Svelte Ownership

Svelte components own:

- screen routing
- title, world select, stage select, result, settings, pause UI
- language and settings presentation
- responsive layout and safe-area presentation
- high-level gamepad/menu routing
- creating and destroying the Phaser game instance

Key files:

- `src/App.svelte`
- `src/TitleScreen.svelte`
- `src/WorldSelect.svelte`
- `src/StageSelect.svelte`
- `src/StageResult.svelte`
- `src/SettingsPanel.svelte`
- `src/VirtualControls.svelte`
- `src/app.css`

Avoid putting frame-by-frame gameplay behavior in Svelte. Svelte should receive summarized gameplay state through events.

## Phaser Ownership

Phaser owns:

- player physics and animation
- enemies, hazards, bullets, pickups, checkpoints, and goals
- homing attack targeting and trail collection
- stage camera and parallax
- gameplay timers and rank-relevant counters
- per-stage boss arena behavior

Key files:

- `src/game/createGame.ts`
- `src/game/scenes/GameplayScene.ts`

`GameplayScene.ts` is currently large and high risk. Prefer extracting new cohesive systems into `src/game/systems/` before adding much more behavior.

## Stage Data Ownership

Stage JSON owns:

- platform layout
- spawn and checkpoint locations
- coin, enemy, hazard, and goal placements
- stage rank targets
- world/stage theme references
- boss arena references

Key files:

- `src/game/stages/stageTypes.ts`
- `src/game/stages/stageRegistry.ts`
- `src/game/stages/*.json`
- `src/game/stages/bossArenaTypes.ts`
- `src/game/stages/bossArenaRegistry.ts`

Stage data must remain declarative. Do not encode per-stage collision hacks in JSON.

## Object Definitions

`src/game/objects/objectDefinitions.ts` owns the contract between visual assets, stage JSON, and collision behavior.

Use it for:

- bottom alignment
- origin
- body size and offset
- grounded/floating/center placement
- gravity
- hazard/collectible/enemy behavior metadata

If object placement is wrong in multiple stages, fix the definition here.

## Assets and Preload

`src/game/assets/assetManifest.ts` is the runtime asset source of truth.

`src/game/assets/preloader.ts` turns the manifest into preload work.

Runtime files live under:

- `public/assets/audio/`
- `public/assets/fonts/`
- `public/assets/hud/`
- `public/assets/maps/`
- `public/assets/props/`
- `public/assets/results/`
- `public/assets/sprites/`
- `public/assets/tiles/`
- `public/assets/title/`

Source or generated working files live under:

- `assets/source/generated/`
- `assets/reference/`
- `__DESIGN__/`

Only `public/assets/` is runtime.

## Save Data

`src/game/save/saveData.ts` owns local save data, settings storage keys, stage unlocking, best records, and debug unlock behavior.

Any schema change needs an explicit migration decision.

## Localization

`src/i18n.ts` owns visible text dictionaries.

Supported languages:

- English
- Japanese
- Traditional Chinese
- Korean

Do not add user-facing text directly to Svelte components unless it is temporary debug-only text.

## Current Risk Hotspots

- `src/App.svelte`: many responsibilities and audio/screen transitions.
- `src/game/scenes/GameplayScene.ts`: gameplay, HUD events, camera, scene state, and many object systems in one file.
- `src/app.css`: all screen styling and responsive behavior.
- `src/game/assets/assetManifest.ts`: missing entries cause late loads and first-view lag.
- Stage JSON plus object definitions: misalignment occurs if asset padding is fixed in the wrong layer.

Treat these as shared infrastructure. Keep edits narrow and document architecture changes.
