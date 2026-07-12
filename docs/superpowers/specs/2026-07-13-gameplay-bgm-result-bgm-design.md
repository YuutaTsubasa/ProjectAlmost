# Gameplay BGM and Result BGM Design

## Context

The rebuilt app already has a centralized browser audio controller and a pure `getMusicForScreen` policy. Gameplay currently returns no music decision, so entering a stage keeps the stage-select map music. The prototype switches music when gameplay starts and again when the stage result appears.

Prototype reference behavior:

- Title uses `title`.
- World select uses `worldNNBgm`.
- Stage select uses `worldNNMap`.
- Normal gameplay stages use `worldNNBgm`.
- Boss gameplay stages, stage `*-6`, use `worldNNBoss`.
- Stage result uses `result`.
- Paused gameplay keeps the stage music but reduces volume to 45%.

The rebuild must not import prototype runtime code. It may copy audio files from `__prototype__/public/assets/audio/` into root `public/assets/audio/`.

## Decision

Use the existing App/application audio boundary rather than letting Phaser control BGM.

### Domain

Extend the audio manifest with:

- `result`
- `world01Boss` through `world06Boss`

Keep the public paths under root `public/assets/audio/`.

Represent gameplay music with a pure policy input that includes the stage id, whether it is a boss stage, whether the gameplay result is showing, and whether gameplay is paused. The policy resolves:

- result visible -> `result`
- boss gameplay -> matching `worldNNBoss`
- normal gameplay -> matching `worldNNBgm`
- paused gameplay -> same gameplay track at `0.45` volume multiplier

The policy stays deterministic and does not know Svelte, Phaser, DOM, or audio elements.

### Application

`createMusicCommand` remains the single command factory for BGM. It should accept enough state to distinguish:

- regular app screens
- gameplay stage music
- result music
- paused gameplay ducking

The returned command remains `{ type: 'set-music', track, volume }`, so `BrowserAudioController` can keep its current fade/reconcile behavior.

### Svelte Wiring

`App.svelte` owns audio side effects.

- When entering gameplay, App passes the active stage metadata to the music command and switches to stage BGM.
- When `GameplayScreen` exposes `hudState.result`, App switches to result BGM.
- When gameplay pause state changes, App switches between full gameplay volume and the 45% ducked volume.
- Retry, next stage, stage select, settings, and world select continue to use the same App-level screen transitions to resync music.

`GameplayScreen.svelte` should expose a small reactive callback boundary for music state rather than executing audio directly.

### Assets

Copy these prototype audio files if they are missing:

- `game_result.mp3`
- `world01_boss.mp3`
- `world02_boss.mp3`
- `world03_boss.mp3`
- `world04_boss.mp3`
- `world05_boss.mp3`
- `world06_boss.mp3`

Existing world BGM and map tracks stay in place.

## Acceptance Criteria

- Root `public/assets/audio/` contains all declared music files.
- Audio manifest declares result and boss music tracks.
- Normal gameplay stage `1-1` resolves to `world01Bgm`.
- Boss gameplay stage `1-6` resolves to `world01Boss`.
- Result-visible gameplay resolves to `result`.
- Paused gameplay resolves to the same stage track at 45% of normal gameplay volume.
- App wiring routes gameplay/result/pause music through `createMusicCommand` and `audio.execute(...)`.
- Phaser renderer never imports or directly controls music.
- Tests cover the pure policy and App/GamePlayScreen wiring.
