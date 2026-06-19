# Audio Playback System Design

## Goal

Build a rebuild-native music and sound-effect playback system for the current Title and World Select flows. The system follows the prototype's audible rules, keeps decisions testable in the domain and application layers, and connects Settings volume rows to real playback.

## Scope

This slice includes:

- Title screen music rules for `title-intro` and `title-menu`.
- World Select music rules for all six selectable worlds.
- UI sound effects for menu movement, confirmation, and back/cancel actions on Title, World Select, and Settings.
- Settings volume integration for master, music, and SFX volume changes.
- Runtime audio assets copied from `__prototype__/public/assets/audio/` into root `public/assets/audio/`.
- A browser audio adapter that owns HTML audio elements and user-interaction unlock behavior.

This slice does not include Stage Select, Gameplay, Result, boss, map, or gameplay-specific SFX rules. Those assets may be copied only when directly needed by this slice. The application API should remain extensible so later stage and gameplay slices can add tracks without changing the current boundaries.

## Prototype Reference

Use these prototype files as behavior references only:

- `__prototype__/src/App.svelte`
- `__prototype__/src/game/audio/musicController.ts`
- `__prototype__/src/game/assets/assetManifest.ts`
- `__prototype__/src/WorldSelect.svelte`
- `__prototype__/src/StageSelect.svelte`

Do not import runtime code from `__prototype__/`.

Prototype behavior to preserve:

- Base music volume multiplier is `0.42`.
- Title intro plays `titlescreen.mp3` at `35%` of the computed music volume.
- Title menu plays `titlescreen.mp3` at full computed music volume.
- World Select plays the selected world's `worldXX_bgm.mp3` at full computed music volume.
- Computed music volume is `0.42 * (masterVolume / 100) * (musicVolume / 100)`.
- Computed SFX volume is `(masterVolume / 100) * (sfxVolume / 100)`.
- UI movement uses `ui-move.wav`.
- UI confirmation uses `ui-confirm.wav`.
- UI back or cancel uses `ui-back.wav`.
- Browser audio must unlock on user interaction and then reconcile the current desired music state.

## Architecture

### Domain

Path: `src/domain/audio/`

The domain owns pure audio rules:

- `AudioAssetId` unions for this slice's music and SFX ids.
- `MUSIC_ASSETS` and `SFX_ASSETS` manifests mapping ids to root public asset paths.
- Volume calculators for music and SFX.
- Screen-to-music policy based on `AppScreen` and `GameSettings`.
- UI intent-to-SFX policy for Title, World Select, and Settings actions.

Domain code must not import Svelte, DOM, localStorage, `Audio`, timers, or prototype code.

### Application

Path: `src/application/audio/`

Application code turns domain decisions into commands for an adapter:

```ts
type AudioCommand =
  | { type: 'set-music'; track: MusicTrackId; volume: number }
  | { type: 'prepare-music'; track: MusicTrackId }
  | { type: 'play-sfx'; sound: SfxId; volume: number }
```

The application layer may expose helpers such as:

- `getMusicCommand(screen, settings)`
- `getSfxCommand(action, settings)`
- `createAudioRuntime(...)`

Command creation stays pure. Runtime execution is injected through an adapter interface.

### Browser Adapter

Path: `src/application/audio/browserAudioController.ts`

The browser adapter owns side effects:

- One looping background music `HTMLAudioElement`.
- Preloaded SFX source elements that are cloned for playback.
- User unlock through keyboard, pointer, and touch interaction.
- `attemptAutoplay` for the low-volume title intro.
- Serialized reconciliation so rapid route or volume changes do not overlap `play()`, `pause()`, and `load()`.
- Fade toward the desired music volume.
- Cleanup on Svelte component destroy.

The adapter should follow the prototype's intent, but implementation must be rebuild-native and scoped to this slice.

### UI Wiring

`src/App.svelte` remains the root browser coordinator:

- Create and destroy the audio runtime in `onMount`.
- Load settings, then sync the desired music command.
- After every screen transition, selected-world change, or relevant Settings change, sync music.
- On first user interaction, unlock the audio runtime and resync music.
- Execute SFX commands from explicit UI/application events.

Presentation components should not instantiate `Audio` directly. They emit callbacks or shared control intents; `App.svelte` decides which audio commands to execute.

## Title Rules

`title-intro`:

- Desired music: `title`.
- Volume: `0.42 * master * music * 0.35`.
- Opening the menu plays `ui-confirm` and changes desired title music volume to full.

`title-menu`:

- Desired music: `title`.
- Volume: `0.42 * master * music`.
- Moving menu selection plays `ui-move` only when the selection changes.
- Activating Start or Settings plays `ui-confirm`.
- Activating Back or pressing Escape plays `ui-back`, returns to intro, and lowers title music to intro volume.

## World Select Rules

World Select desired music is based on the selected zero-based world index:

- `0` -> `world01Bgm`
- `1` -> `world02Bgm`
- `2` -> `world03Bgm`
- `3` -> `world04Bgm`
- `4` -> `world05Bgm`
- `5` -> `world06Bgm`

Volume is always `0.42 * master * music`.

Selection movement plays `ui-move` only when the selected world changes. Confirming a world plays `ui-confirm`; because Stage Select does not exist in the rebuild yet, confirming preserves the World Select screen. Back plays `ui-back` and returns to the title menu.

## Settings Volume Rules

The existing Settings domain remains the source of truth for volume values.

- Changing `masterVolume` updates desired music volume immediately and changes future SFX volume.
- Changing `musicVolume` updates desired music volume immediately.
- Changing `sfxVolume` changes future SFX volume only.
- Reset to defaults updates desired music volume immediately and restores SFX volume to defaults for future SFX.
- Volume rows emit `ui-move` when adjusted by keyboard, gamepad, or pointer.
- Settings Back and delete confirmation cancel emit `ui-back`.
- Settings activation actions emit `ui-confirm` when they commit or open a confirmation.

If `masterVolume` or `musicVolume` is `0`, music command volume is `0`; the adapter may keep the correct track prepared at zero volume. If `masterVolume` or `sfxVolume` is `0`, SFX commands may be omitted or executed at zero volume, but no audible SFX should play.

## Assets

Copy these files from `__prototype__/public/assets/audio/` to root `public/assets/audio/`:

- `titlescreen.mp3`
- `world01_bgm.mp3`
- `world02_bgm.mp3`
- `world03_bgm.mp3`
- `world04_bgm.mp3`
- `world05_bgm.mp3`
- `world06_bgm.mp3`
- `sfx/ui-move.wav`
- `sfx/ui-confirm.wav`
- `sfx/ui-back.wav`

The root manifest must point to `/assets/audio/...` paths, matching Vite public asset serving.

## Testing

Use TDD.

Domain tests:

- Music volume calculation uses base `0.42`, master volume, music volume, and optional title-intro multiplier.
- SFX volume calculation uses master volume and SFX volume.
- Title intro maps to title music at `35%`.
- Title menu maps to title music at full volume.
- World Select index maps to the expected `worldXXBgm` track.
- Out-of-range world index falls back to a safe existing world track.
- Audio asset manifests contain the exact public paths required by this slice.

Application tests:

- Music command generation reflects current screen and settings.
- SFX command generation reflects action and settings volume.
- Zero master or SFX volume suppresses audible SFX.

App/control tests:

- Title open, title move, title confirm, and title back actions trigger the expected SFX command.
- World Select movement changes music track and triggers `ui-move`.
- Settings volume adjustment updates settings and emits a music resync.

Adapter tests may use injected fake audio elements or focus on pure command dispatch if direct `HTMLAudioElement` behavior is not reliable in Vitest. Do not make production code depend on test-only methods.

Required checks before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Risks

Browser autoplay can fail until a user gesture occurs. The adapter must tolerate this by keeping desired state in memory, unlocking on user interaction, and reconciling after unlock.

Rapid state changes can interrupt `HTMLAudioElement.play()`. The adapter must serialize reconciliation like the prototype did, so later state wins without overlapping playback calls.

The largest architecture risk is leaking audio side effects into Svelte components or domain modules. Keep rules pure, commands explicit, and browser audio inside the adapter.
