# Technical Plan

## Stack

- UI shell: Svelte + TypeScript + Vite.
- Game runtime: Phaser inside a Svelte-managed container.
- Packaging: Web first; evaluate desktop packaging after the playable loop is stable.
- Primary test target: Web build first, platform wrappers second.

## Architecture

- `src/App.svelte` owns page layout and mounts the game.
- `src/game/createGame.ts` creates and destroys the Phaser instance.
- `src/game/scenes/GameplayScene.ts` contains the active gameplay scene.
- `src/game/stages/*.json` contains data-driven stage layouts.
- `src/game/stages/stageRegistry.ts` validates and selects stage data.
- `src/game/assets/assetManifest.ts` defines runtime and preload asset paths.
- Character control logic should be shared between knight and princess skins.
- Character art should be selected through asset keys, not duplicated controller code.
- Stage data is JSON-driven; future stage-specific themes and bosses should extend the same model.
- Future game systems should move into `src/game/systems`.
- Future shared constants should move into `src/game/config`.

## Sequencing

1. Complete White Palace stages and enemy roster.
2. Add automated gameplay and menu smoke tests.
3. Add mobile-specific input and safe-area handling.
4. Evaluate desktop and mobile packaging after gameplay performance is acceptable.

## Phaser Boundary

Svelte should not own frame-by-frame gameplay state. Keep high-frequency gameplay inside Phaser and only emit coarse state to Svelte when needed, such as pause state, scene selection, settings, and high-level HUD values.

## Current Risks

- Mobile performance is unknown until real sprite sheets and touch controls exist.
- The Phaser bundle currently triggers Vite's large chunk warning.
