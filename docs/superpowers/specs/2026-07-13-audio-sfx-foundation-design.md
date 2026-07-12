# Audio SFX Foundation Design

## Goal

Extend the rebuild-native audio system so Settings can control all sound effects through one typed command path, including future UI and gameplay SFX. The rebuild may reference Prototype behavior and assets, but must not import Prototype runtime code.

## Current State

The rebuild already has:

- `src/domain/audio/audioAssets.ts` for music and UI SFX manifests.
- `src/domain/audio/audioPolicy.ts` for music and SFX volume rules.
- `src/application/audio/audioCommands.ts` for pure audio commands.
- `src/application/audio/browserAudioController.ts` for browser playback.
- `App.svelte` wiring that loads settings, syncs music, and plays UI SFX.

This foundation covers title, world select, stage select BGM, and UI SFX. It does not yet expose gameplay SFX ids or typed gameplay sound actions.

## Prototype Reference

Use these Prototype files only as references:

- `__prototype__/src/App.svelte`
- `__prototype__/src/game/audio/musicController.ts`
- `__prototype__/src/game/assets/assetManifest.ts`
- `__prototype__/public/assets/audio/sfx/`

Runtime code must stay in the rebuild. Do not import from `__prototype__/src`.

## Scope

This slice adds the missing baseline SFX catalog and typed action mapping:

- Add gameplay SFX asset ids for `hit`, `coin`, `death`, `checkpoint`, `armor-step`, and `goal`.
- Copy those runtime audio files from `__prototype__/public/assets/audio/sfx/` to `public/assets/audio/sfx/`.
- Keep existing UI SFX ids and behavior unchanged.
- Add a gameplay SFX action type so future gameplay code can request semantic sound effects without knowing asset paths.
- Keep all SFX volume calculations under the existing Settings rule: `(masterVolume / 100) * (sfxVolume / 100)`.
- Ensure the browser adapter preloads every declared SFX asset, so later UI/game events can play without changing adapter setup.

This slice does not yet wire gameplay events to sound playback. It creates the shared foundation those future slices will use.

## Architecture

### Domain

`src/domain/audio/audioAssets.ts` owns public asset manifests and typed ids.

`src/domain/audio/audioPolicy.ts` owns pure policy:

- `UiSfxAction`
- `GameplaySfxAction`
- `SfxAction = UiSfxAction | GameplaySfxAction`
- `computeSfxVolume(settings)`
- `getSfxForAction(action)`

Domain code must not depend on Svelte, DOM, browser storage, timers, `Audio`, or Prototype runtime modules.

### Application

`src/application/audio/audioCommands.ts` keeps creating explicit commands:

```ts
type PlaySfxCommand = { type: 'play-sfx'; sound: SfxId; volume: number }
```

`createSfxCommand(action, settings)` accepts the shared `SfxAction` and returns `null` when master or SFX volume makes the sound inaudible.

### Browser Adapter

`src/application/audio/browserAudioController.ts` preloads every `SFX_ASSETS` entry and clones the preloaded source when playing. It must not know whether a sound came from UI or gameplay.

## Settings Behavior

Settings remains the source of truth for volume values:

- `masterVolume` affects music and all SFX.
- `musicVolume` affects music only.
- `sfxVolume` affects all SFX, including UI and future gameplay sounds.
- Adjusting `sfxVolume` changes future `play-sfx` command volume immediately because commands are created from current settings.

## Required Assets

Copy these files to root `public/assets/audio/sfx/`:

- `hit.wav`
- `coin.wav`
- `death.wav`
- `checkpoint.wav`
- `armor-step.wav`
- `goal.wav`

Existing UI SFX assets remain:

- `ui-move.wav`
- `ui-confirm.wav`
- `ui-back.wav`

## Testing

Use TDD.

Domain tests prove:

- `SFX_ASSETS` contains every UI and gameplay SFX path.
- gameplay semantic actions map to the intended asset ids.
- `computeSfxVolume` continues to use master and SFX volume.

Application tests prove:

- `createSfxCommand` accepts gameplay actions and applies current Settings volume.
- zero master or SFX volume suppresses gameplay SFX commands.

Adapter tests prove:

- the browser controller preloads all declared SFX assets.

Asset tests prove:

- every declared SFX public asset exists under `public/assets/audio/sfx/`.

Required checks before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
