# Gameplay HUD UI Design

## Goal

Port the first rebuilt gameplay HUD slice from `__prototype__/` into the rebuilt gameplay screen.

This slice makes these behaviors true in rebuilt gameplay:

- The gameplay screen renders a Svelte HUD overlay above the Phaser canvas.
- The HUD shows player life as the current three-HP state.
- The HUD shows live gameplay statistics: time, coins, damage taken, falls, enemies defeated, and checkpoints reached.
- The HUD shows checkpoint and respawn progress derived from rebuilt checkpoint data.
- The HUD shows a compact stage map with platform, checkpoint, player, enemy, and goal markers.
- The renderer emits deterministic HUD updates through an explicit callback boundary instead of letting Svelte inspect Phaser internals.
- Stage clear freezes the final HUD values for this slice.

## Scope

This slice is gameplay-only.

It includes:

- Pure HUD label, progress, and map-marker rules in `src/domain/gameplay/`.
- A gameplay HUD state model or view model boundary in `src/application/gameplay/` if needed to keep Svelte and Phaser decoupled.
- A Svelte gameplay HUD overlay inside `src/ui/gameplay/`.
- Renderer-to-HUD update events for:
  - initial HUD state
  - player position/progress
  - player HP
  - coin pickup
  - damage taken
  - fall count
  - enemy defeat count
  - checkpoint activation and respawn progress
  - stage clear
- A mini map that projects rebuilt stage terrain platforms, checkpoints, player position, active enemies, and the goal.
- Focused domain, renderer, and UI tests.

It intentionally does not include:

- StageResult or clear result screen.
- Save data, unlocks, persistent stage records, rank persistence, or best-time persistence.
- Audio/SFX changes.
- Pause menu or virtual controls.
- Boss-specific HUD variants.
- Localized gameplay copy beyond using stable HUD keys or short labels that can be localized later.
- A full HUD art parity pass; the visual design should be prototype-inspired and rebuild-appropriate, not a verbatim CSS import.

## Prototype Reference

Prototype behavior and presentation live mainly in:

- `__prototype__/src/App.svelte`
- `__prototype__/src/app.css`
- `__prototype__/src/domain/stage/hudLabelRules.ts`
- `__prototype__/src/domain/stage/hudLabelRules.test.ts`
- `__prototype__/src/domain/stage/hudProgressRules.ts`
- `__prototype__/src/domain/stage/hudProgressRules.test.ts`
- `__prototype__/src/domain/stage/hudMapRules.ts`
- `__prototype__/src/domain/stage/hudMapRules.test.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`

Prototype HUD fields to preserve conceptually:

```ts
type PrototypeHudState = {
  hp: number
  hpMax: number
  coins: number
  coinTarget: number
  damageTaken: number
  falls: number
  enemiesDefeated: number
  enemyTarget: number
  checkpointsReached: number
  checkpointTarget: number
  time: string
  playerProgress: number
  playerProgressY: number
  goalProgress: number
  enemyMarkers: readonly { x: number; y: number }[]
  mapPlatforms: readonly { x: number; y: number; width: number }[]
  checkpointMarkers: readonly { x: number; y: number }[]
  activeCheckpointIndex: number
  cleared: boolean
}
```

Prototype pure rules to preserve conceptually:

- Health labels use `HP current/max`.
- Coin labels use `COIN 000 / target` style padding.
- Progress is clamped to `0..1`.
- Platform mini-map markers project tile platform coordinates into normalized `0..1` map space.
- Checkpoint, enemy, player, and goal markers project world coordinates into normalized map space.

## Rebuild Architecture

### Domain Layer

Add pure gameplay HUD rules under `src/domain/gameplay/`.

The domain layer owns:

- HUD labels and number formatting.
- HUD progress clamping.
- Mini-map marker projection from rebuilt stage map data.
- Initial HUD state derivation from `GameplayStageMap` and player constants.
- HUD update reducers if they can remain pure and framework-free.

The domain layer must not import Svelte, Phaser, DOM APIs, timers, random side effects, browser storage, or `__prototype__`.

### Application Layer

Use `src/application/gameplay/` only if the HUD state reducer or event contract becomes shared enough to deserve an application boundary.

The application layer may own:

- `GameplayHudState`
- `GameplayHudPatch`
- `createInitialGameplayHudState(stage)`
- `applyGameplayHudPatch(state, patch)`

This boundary should remain deterministic and testable. It must not inspect Phaser objects.

### Renderer Boundary

Extend `createGameplayRenderer` input with an optional HUD update callback:

```ts
type GameplayHudUpdateHandler = (patch: GameplayHudPatch) => void
```

The Phaser renderer owns collecting runtime facts at event points:

- current player position
- current player HP
- collected coin count
- damage and fall counters
- defeated enemy count
- active checkpoint index
- active enemy marker positions
- cleared flag

The renderer emits HUD patches when facts change and during `update()` for position-dependent mini-map fields. Svelte owns applying patches to HUD state.

### Svelte UI Layer

`GameplayScreen.svelte` owns the reactive HUD state.

It should:

- Create initial HUD state from the stage map before creating Phaser.
- Pass `onHudUpdate` into the renderer.
- Render a `GameplayHud.svelte` overlay above the canvas.
- Keep the HUD overlay pointer-events disabled so it does not block gameplay input.

`GameplayHud.svelte` should be a presentational component. It receives state and renders:

- status panel with HP `current / max`
- stage banner or compact stage title
- mini map
- objective panel
- bottom readouts

## HUD State Requirements

Initial HUD state for rebuilt `1-1`:

- `hp` is `PLAYER_MAX_HEALTH`.
- `hpMax` is `PLAYER_MAX_HEALTH`.
- `coins` is `0`.
- `coinTarget` is `stage.coins.length`.
- `damageTaken` is `0`.
- `falls` is `0`.
- `enemiesDefeated` is `0`.
- `enemyTarget` is `stage.enemies.length`.
- `checkpointsReached` is `0`.
- `checkpointTarget` is `stage.checkpoints.length`.
- `activeCheckpointIndex` is `-1`.
- `cleared` is `false`.
- `playerProgress` and `playerProgressY` are derived from the player spawn.
- `goalProgress` is `stage.goal.x / stage.world.width`, clamped to `0..1`.
- `mapPlatforms` are derived from `stage.terrain.platforms`.
- `checkpointMarkers` are derived from `stage.checkpoints`.
- `enemyMarkers` are derived from active enemy runtime positions; initial values may be derived from stage spawn data until runtime positions are available.
- `time` starts at `00:00.00` for this slice.

Runtime HUD updates:

- Coin pickup increments `coins`.
- Non-fatal contact damage decrements HP and increments `damageTaken`.
- Damage defeat decrements HP, increments `damageTaken`, and later respawn restores HP to max.
- Fall defeat increments `falls`; fall defeat does not increment `damageTaken`.
- Respawn restores `hp` to max and keeps checkpoint progress.
- Enemy defeat increments `enemiesDefeated` once per enemy.
- Checkpoint activation updates `activeCheckpointIndex` and `checkpointsReached`.
- Stage clear sets `cleared` to `true` and freezes counters except any final patch required by the clear event itself.
- Post-clear gameplay gates should keep preventing new coin, damage, checkpoint, fall, movement, and enemy updates.

## Mini Map Requirements

The mini map is normalized and view-independent.

- Platform markers use `{ x, y, width }` where each value is in normalized `0..1` space.
- Checkpoint markers use `{ x, y }` where each value is in normalized `0..1` space.
- Player marker uses `playerProgress` and `playerProgressY`.
- Enemy markers include only active, undefeated enemies.
- Goal marker uses `goalProgress`.
- All normalized values are clamped to `0..1`.

The visual mini map should be compact and readable on the existing 16:9 resolution frame:

- Right side or top-right placement, matching the prototype's information hierarchy.
- Platform lines are subdued.
- Active checkpoints are highlighted.
- Player and goal markers are visually distinct.
- Enemy markers are small and do not dominate the map.

## Visual Direction

Use a prototype-inspired White Palace HUD style, adapted to the rebuilt UI:

- Light translucent panels.
- Blue/cyan line work and subtle gold highlights.
- Compact panel radii no larger than `8px` unless inherited project styling requires otherwise.
- Dense, readable operational layout rather than a marketing-style hero.
- No nested cards.
- No decorative gradient orbs, bokeh blobs, or unrelated illustrations.
- HUD text must fit inside containers at desktop and mobile-sized 16:9 frames.

The first screen remains gameplay, not a landing page.

## Checkpoint And Respawn Presentation

The HUD must make checkpoint progress visible:

- `checkpointsReached / checkpointTarget` appears in bottom readouts.
- The mini map shows checkpoint markers.
- Markers at or before `activeCheckpointIndex` appear active.
- Respawn does not reset active checkpoint progress.

This slice does not add separate checkpoint pop-up text or respawn banners.

## Time And Statistics

Time display starts at `00:00.00` and updates from elapsed scene time while the stage is not cleared and the player is not in a transition that should freeze HUD time.

Statistics are stage-session values:

- `coins`
- `damageTaken`
- `falls`
- `enemiesDefeated`
- `checkpointsReached`

This slice does not persist those values outside the current gameplay session.

## Testing Requirements

### Domain Tests

Add tests for:

- Health label formatting.
- Coin label formatting with zero padding.
- Progress clamping.
- Initial HUD state from the rebuilt `1-1` stage.
- Platform marker projection.
- Checkpoint marker projection.
- Goal progress projection.
- Enemy marker filtering for defeated enemies.
- HUD patch reducer behavior if a reducer is introduced.

### Renderer Tests

Extend `createGameplayRenderer.test.ts` to prove:

- Renderer emits an initial HUD patch/state.
- Player movement update emits player mini-map progress.
- Coin pickup emits coin count.
- Enemy defeat emits enemy count and removes enemy marker.
- Checkpoint activation emits active checkpoint index and reached count.
- Contact damage emits HP and damage count.
- Fall defeat emits fall count.
- Respawn emits restored HP while preserving checkpoint progress.
- Stage clear emits `cleared: true` and post-clear gates prevent further HUD-changing patches.

### Svelte/UI Tests

Add or extend UI tests to prove:

- `GameplayScreen` renders the HUD overlay above the canvas host.
- HUD shows HP `3 / 3` initially.
- HUD shows coin, damage, fall, enemy, and checkpoint readouts.
- Mini map renders platform, checkpoint, player, enemy, and goal markers from state.
- HUD overlay uses `pointer-events: none`.

### Verification

Before completion run:

```bash
npm run test
npm run check
npm run build
git diff --check
rg "__prototype__" src public --glob '!**/*.test.ts'
```

Expected:

- Tests pass.
- `npm run check` reports `0 errors` and `0 warnings`.
- Build passes. Existing Vite chunk-size warning is acceptable if no new build error appears.
- `git diff --check` has no output.
- Runtime `src` and `public` do not reference `__prototype__`.

## Acceptance Criteria

- Spec is committed before implementation planning starts.
- Pure HUD rules are implemented under rebuild source paths.
- Gameplay HUD renders as a Svelte overlay above the Phaser canvas.
- HUD shows three HP, live statistics, checkpoint progress, and mini-map markers.
- Renderer updates HUD through an explicit callback/event boundary.
- Checkpoint activation and respawn behavior are visible in HUD state and do not reset incorrectly.
- Stage clear freezes final HUD state for this slice.
- No StageResult, persistence, audio, or boss-specific HUD work is introduced.
- Required tests and verification commands pass.
