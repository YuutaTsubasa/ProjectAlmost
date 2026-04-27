# Technical Plan

## Stack

- UI shell: Svelte + TypeScript + Vite.
- Game runtime: Phaser inside a Svelte-managed container.
- Packaging: Tauri v2 after the Web playable loop is stable.
- Primary test target: Web build first, platform wrappers second.

## Architecture

- `src/App.svelte` owns page layout and mounts the game.
- `src/game/createGame.ts` creates and destroys the Phaser instance.
- `src/game/scenes/PrototypeScene.ts` contains the first playable scene.
- Character control logic should be shared between knight and princess skins.
- Character art should be selected through asset keys, not duplicated controller code.
- Stage data should eventually become data-driven so each world can define scene theme, stage layout, coin placement, enemies, and boss entry.
- Future game systems should move into `src/game/systems`.
- Future shared constants should move into `src/game/config`.

## Sequencing

1. Build Web prototype with placeholder geometry.
2. Replace placeholder player art with reference-based knight sprites.
3. Add run modifier, melee attack state, homing attack targeting, and coin collection.
4. Add generated princess sprite set using the same controller.
5. Add Playwright smoke tests for startup and basic UI shell.
6. Add Tauri v2 desktop wrapper.
7. Add mobile-specific input and safe-area handling.
8. Add Android and iOS packaging once gameplay performance is acceptable.

## Phaser Boundary

Svelte should not own frame-by-frame gameplay state. Keep high-frequency gameplay inside Phaser and only emit coarse state to Svelte when needed, such as pause state, scene selection, settings, and high-level HUD values.

## Current Prototype Risks

- Phaser version is pulled from npm and should be pinned once the prototype compiles.
- Mobile performance is unknown until real sprite sheets and touch controls exist.
- Tauri mobile targets require native toolchains and should be validated separately from Web gameplay.
