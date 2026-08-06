# AVG System Design

## Goal

Rebuild the prototype AVG dialogue system in the new project architecture and implement the first chapter boss intro AVG for stage `1-6`.

The first slice covers only the stage `1-6` intro sequence. It plays every time the player enters or retries `1-6`, matching the prototype behavior. This slice does not add persistent "seen" tracking and does not add post-boss-clear AVG.

## Prototype Reference

Use the prototype only as behavior and visual reference:

- `__prototype__/src/game/avg/avgTypes.ts`
- `__prototype__/src/game/avg/avgRegistry.ts`
- `__prototype__/src/AvgOverlay.svelte`
- `__prototype__/src/app.css` AVG overlay styles
- `__prototype__/public/assets/avg/yuuta-dialogue.webp`
- `__prototype__/public/assets/avg/white-priestess-dialogue.webp`

Do not import prototype runtime code.

The prototype behavior to preserve:

- `1-6` has one intro AVG sequence.
- The sequence has Yuuta on the left and White Priestess on the right.
- The sequence has six localized dialogue lines.
- Confirm advances one line.
- Skip immediately finishes the AVG.
- Gameplay is paused while AVG is active.
- Gameplay timing resumes cleanly after AVG finishes.

## Scope

Included:

- AVG domain types and pure playback functions.
- AVG registry for stage intro sequences.
- `1-6` intro script, speaker metadata, and portrait assets.
- Presentation-only Svelte AVG overlay.
- Gameplay screen integration that pauses/resumes the Phaser renderer while AVG is active.
- Preload manifest coverage for AVG portrait assets.
- Localization keys for AVG UI and `1-6` lines.

Excluded:

- Save data for one-time playback.
- Post-boss-clear or chapter-ending AVG.
- Branching dialogue choices.
- Auto-advance, typewriter effects, backlog, voice, or cutscene camera scripting.
- Moving AVG state into Phaser or using global window events.

## Architecture

### Domain

Add `src/domain/avg/`.

`avgTypes.ts` defines immutable data types:

- `AvgSpeakerId`
- `AvgCharacter`
- `AvgLine`
- `AvgSequence`
- `AvgPlaybackState`
- `AvgPlaybackStatus`

`avgRegistry.ts` owns rebuild-native AVG content:

- `getStageIntroSequence(stageId: StageId): AvgSequence | null`
- `stageIntroSequences` keyed by stage id.
- `1-6` sequence with id `1-6-intro`.
- Portrait paths under `/assets/avg/`.
- Localization keys for speaker names and line text.

`avgPlayback.ts` owns pure playback decisions:

- `createAvgPlayback(sequence): AvgPlaybackState`
- `advanceAvgPlayback(state): AvgPlaybackState`
- `skipAvgPlayback(state): AvgPlaybackState`
- `getActiveAvgLineView(state): { line, speaker } | null`
- `isAvgPlaybackActive(state): boolean`

The playback state is explicit and immutable. It should not use booleans that can produce invalid combinations such as "completed with an active line".

Domain modules must not import Svelte, Phaser, DOM APIs, browser storage, timers, or prototype code.

### Application / Gameplay Integration

`GameplayScreen.svelte` coordinates AVG as local reactive UI state because the AVG overlays gameplay and only exists while a gameplay screen is mounted.

On mount:

1. Look up `getStageIntroSequence(stage.id)`.
2. If no sequence exists, gameplay starts as it does today.
3. If a sequence exists, create AVG playback state.
4. Once the renderer exists, pause it while AVG is active.

While AVG is active:

- Keyboard/gamepad confirm advances the AVG.
- Keyboard/gamepad back skips the AVG.
- Pointer/click/tap on the overlay advances the AVG.
- The skip button skips without advancing.
- Virtual gameplay controls are hidden.
- Pause menu cannot open.
- Stage result controls are not relevant because this is an intro overlay before the run starts.

When AVG finishes:

1. Clear AVG playback state or mark it completed.
2. Resume the renderer.
3. Call `renderer.resetTiming()` so the pause duration is not counted into gameplay elapsed time.

Do not use `window.dispatchEvent` or a global `projectrun:avg-state` event. The Svelte component owns overlay state and talks to the renderer through its existing controller methods.

### UI

Add `src/ui/avg/AvgOverlay.svelte`.

The component is presentation-only:

- Props: `sequence`, `playback`, `localizeData`, `locale`.
- Events/callbacks: `onAdvance`, `onSkip`.
- It resolves localized speaker names and dialogue lines using existing localization data.
- It renders all sequence characters, highlights the active speaker, shows progress markers, and shows a skip control.
- It must not import app flow, preloader, browser storage, or the gameplay renderer.

Visual direction:

- Match the prototype AVG layout closely: darkened gameplay veil, two large standing portraits, bottom dialogue panel, speaker name plate, progress ticks, next indicator, and top-right skip.
- Adapt spacing using container units consistent with the existing gameplay HUD.
- Keep the stage visible behind the overlay.

### Assets

Copy these prototype assets into the rebuild runtime asset directory:

- `__prototype__/public/assets/avg/yuuta-dialogue.webp` -> `public/assets/avg/yuuta-dialogue.webp`
- `__prototype__/public/assets/avg/white-priestess-dialogue.webp` -> `public/assets/avg/white-priestess-dialogue.webp`

Only runtime `.webp` assets are copied. Raw prototype PNGs remain in `__prototype__/`.

The preload manifest includes AVG portrait assets in the gameplay entry plan when a stage has an AVG intro. Runtime asset validation must continue to require `/assets/` paths and reject `__prototype__`.

### Localization

Add an AVG localization key group:

- `avg.skip`
- `avg.speaker.yuuta`
- `avg.speaker.whitePriestess`
- `avg.1-6.line1`
- `avg.1-6.line2`
- `avg.1-6.line3`
- `avg.1-6.line4`
- `avg.1-6.line5`
- `avg.1-6.line6`

Use the prototype text as the reference content for English, Japanese, Traditional Chinese, and Korean, but add it through the rebuild localization catalog and type system.

## Runtime Flow

### Entering `1-6`

1. App enters gameplay through the existing preload and transition flow.
2. `GameplayScreen` mounts and creates the Phaser renderer.
3. `GameplayScreen` creates `1-6-intro` AVG playback state.
4. Renderer is paused while the overlay is active.
5. Player advances or skips the AVG.
6. Renderer resumes and timing resets.
7. Gameplay proceeds normally.

### Retry `1-6`

Retry remounts gameplay through the existing keyed screen flow. The intro sequence plays again because this slice intentionally has no seen-state persistence.

### Other Stages

Stages without intro AVG do not create playback state, do not render the overlay, and do not pause the renderer for AVG.

## Testing Strategy

Use TDD. Each behavior change starts with a failing test.

Domain tests:

- `getStageIntroSequence('1-6')` returns the first chapter boss intro sequence.
- non-AVG stages return `null`.
- `1-6` sequence has the expected speakers, sides, portrait asset paths, and six line keys.
- `createAvgPlayback` starts at the first line and active status.
- `advanceAvgPlayback` advances line-by-line and completes after the final line.
- `skipAvgPlayback` completes immediately.
- `getActiveAvgLineView` returns the active line and speaker while active and returns `null` when completed.

Localization tests:

- Every supported locale has `avg.skip`, speaker names, and all six `1-6` line texts.

Asset/preload tests:

- AVG portrait assets are rebuild-owned `/assets/avg/...` paths.
- Runtime asset collection includes AVG portrait assets.
- Gameplay entry preload plan for `1-6` includes AVG portraits.
- Raw prototype files are not included.

UI/source-contract tests:

- `AvgOverlay.svelte` receives data and callbacks, and does not import app flow, preloader, storage, or renderer modules.
- `GameplayScreen.svelte` integrates stage intro AVG through `getStageIntroSequence`, renderer pause/resume/resetTiming, and local reactive state.
- `GameplayScreen.svelte` does not contain `projectrun:avg-state` or `window.dispatchEvent` for AVG.
- Virtual controls are gated off while AVG is active.

Verification before finishing:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Review Principles

Review this slice against:

- TDD: tests fail before implementation and pass after.
- DDD: AVG rules and content live in domain; Svelte only presents and coordinates.
- Functional-based design: immutable explicit playback state and pure transitions.
- Reactive design: overlay visibility derives from AVG playback state; no duplicated sync flags.
- The 15 code review principles, especially explicit state models, exhaustive unions, no magic strings outside registries/localization, and derived state over manual synchronization.
