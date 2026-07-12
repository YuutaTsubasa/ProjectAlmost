# Gameplay Stage SFX Design

## Goal

Add Prototype-compatible stage sound effects to the rebuilt gameplay loop without copying Prototype runtime code. Gameplay should emit typed sound-effect actions for level events, and the root app should play them through the existing audio command/controller pipeline so Settings `masterVolume` and `sfxVolume` control all stage sounds.

## Prototype Reference

Use these Prototype files as references only:

- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/src/App.svelte`
- `__prototype__/src/game/assets/assetManifest.ts`

Do not import Prototype runtime code.

Prototype stage SFX behavior to preserve:

- coin pickup plays `coin`.
- checkpoint activation plays `checkpoint`.
- player damage/death-related hit feedback plays `hit` or `death`.
- enemy/boss hit feedback plays `hit`.
- stage goal completion plays `goal`.
- armor guard movement can play `armor-step`, but must not fire every frame.

## Current Rebuild State

The rebuild already has:

- `SFX_ASSETS` entries and public files for `hit`, `coin`, `death`, `checkpoint`, `armor-step`, and `goal`.
- `GameplaySfxAction` and `SfxAction` in `src/domain/audio/audioPolicy.ts`.
- `createSfxCommand(action, settings)` accepting UI and gameplay SFX actions.
- `BrowserAudioController` preloading all declared SFX.

The missing part is gameplay event wiring. `createGameplayRenderer.ts` currently updates gameplay state and HUD for coins, checkpoints, damage, enemy defeat, death, and stage clear, but it does not emit SFX actions to `GameplayScreen` or `App`.

## Architecture

### Domain

The audio domain remains the source of truth for action names:

```ts
type GameplaySfxAction =
  | 'player-hit'
  | 'coin-collected'
  | 'player-death'
  | 'checkpoint-activated'
  | 'player-footstep'
  | 'goal-opened'
```

No gameplay renderer code should know public asset paths.

### UI Renderer Boundary

`createGameplayRenderer.ts` adds an optional callback:

```ts
onSfx?: (action: GameplaySfxAction) => void
```

The renderer calls this callback at the point where the gameplay event is accepted, not every frame after the state is already true.

Expected mappings:

- `collectCoin(...)` -> `coin-collected`
- `activateCheckpoint(...)` -> `checkpoint-activated`
- successful player damage contact/projectile -> `player-hit`
- player death transition start -> `player-death`
- enemy or boss defeat/hit -> `player-hit`
- `completeStage()` accepted -> `goal-opened`
- player jump launch, landing, and grounded running footstep -> `player-footstep`

Movement SFX must be cadence-gated by a pure domain decision. It should only emit for player foot contact events, not enemy patrol updates or every update tick.

### Svelte Wiring

`GameplayScreen.svelte` accepts:

```ts
onGameplaySfx: (action: GameplaySfxAction) => void
```

It passes the callback into `createGameplayRendererConfig`.

`App.svelte` owns audio side effects:

```ts
function playGameplaySfx(action: GameplaySfxAction) {
  audio?.execute(createSfxCommand(action, settings))
}
```

Then passes `onGameplaySfx={playGameplaySfx}` to `GameplayScreen`.

### Settings Behavior

No new settings state is added. Gameplay SFX commands use current `settings` when `App.svelte` receives the action, so:

- `masterVolume = 0` suppresses gameplay SFX.
- `sfxVolume = 0` suppresses gameplay SFX.
- changing SFX volume in pause/settings affects subsequent gameplay SFX.

## Testing

Use TDD.

Renderer source/contract tests prove:

- renderer config accepts `onSfx`.
- `emitGameplaySfx` is called from coin, checkpoint, stage clear, player hit/death, enemy hit/defeat, and armor guard step paths.
- no `window.dispatchEvent(new CustomEvent('projectrun:sfx'...))` is introduced.

Svelte/App source tests prove:

- `GameplayScreen.svelte` accepts `onGameplaySfx`.
- `GameplayScreen.svelte` passes `onSfx: onGameplaySfx` into the renderer config.
- `App.svelte` imports `GameplaySfxAction`.
- `App.svelte` uses `createSfxCommand(action, settings)` for gameplay SFX.
- `App.svelte` passes `onGameplaySfx={playGameplaySfx}` to `GameplayScreen`.

Focused and full verification:

- `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
