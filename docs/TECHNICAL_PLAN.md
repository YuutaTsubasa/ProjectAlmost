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
- Future game systems should move into `src/game/systems`.
- Future shared constants should move into `src/game/config`.

## Sequencing

1. Build Web prototype with placeholder geometry.
2. Add generated sprite sheets and animation metadata.
3. Add Playwright smoke tests for startup and basic UI shell.
4. Add Tauri v2 desktop wrapper.
5. Add mobile-specific input and safe-area handling.
6. Add Android and iOS packaging once gameplay performance is acceptable.

## Phaser Boundary

Svelte should not own frame-by-frame gameplay state. Keep high-frequency gameplay inside Phaser and only emit coarse state to Svelte when needed, such as pause state, scene selection, settings, and high-level HUD values.

## Current Prototype Risks

- Phaser version is pulled from npm and should be pinned once the prototype compiles.
- Mobile performance is unknown until real sprite sheets and touch controls exist.
- Tauri mobile targets require native toolchains and should be validated separately from Web gameplay.
