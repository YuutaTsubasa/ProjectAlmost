# Preloading Assets Design

## Goal

Add a rebuild-native preloading system so players do not enter Title, World Select, Stage Select, or Gameplay while required runtime assets are still loading. The implementation must follow the rebuild architecture, use the preserved prototype only as a behavior reference, and avoid importing prototype runtime code.

## Prototype Reference

The prototype preloader uses a runtime asset catalog, groups assets into boot/shared/world buckets, loads with limited concurrency, reports progress, caches completed and pending sources, and does not permanently block the game when an individual preload fails. The rebuild should preserve those behavioral ideas while implementing its own typed domain/application boundaries.

## Scope

This slice covers:

- A typed asset manifest and preload planner for rebuild-owned runtime assets under `/assets/`.
- A browser preload adapter for image, font, and audio files.
- A Loading screen shown before the Title flow becomes interactive.
- A gameplay-entry loading gate that waits for the selected stage's required assets before mounting the Phaser gameplay screen.
- Background preloading for nearby/world assets when the user is browsing World Select and Stage Select.
- Source-contract tests that ensure screen-changing gameplay entry routes pass through the preloading boundary.

This slice does not cover:

- AVG-specific asset groups.
- Remote CDN asset hosting.
- Changing Phaser's internal loader implementation.
- Blocking forever on failed assets.
- Copying prototype source code.

## Layer Ownership

### Domain

Add a pure asset catalog/planning module under `src/domain/assets/`.

It owns:

- asset source records with stable ids, source path, kind, and preload group
- boot assets required before Title
- shared gameplay assets required by most stages
- world/stage specific assets derived from stage maps, world data, audio metadata, character metadata, actor definitions, and visual profiles
- deterministic de-duplication and sorting

Domain modules must not import Svelte, Phaser, DOM, browser storage, timers, or `__prototype__`.

### Application

Add browser-facing preload coordination under `src/application/assets/`.

It owns:

- loading state shape: `idle`, `loading`, `ready`, and `ready-with-errors`
- progress calculations
- concurrency and timeout constants
- cache of loaded and pending asset sources
- policy for non-fatal preload errors

The adapter may use `Image`, `fetch`, `document.fonts`, and `Audio`/fetch where appropriate, but those APIs stay outside the pure domain layer.

### UI

Add a presentation-only `LoadingScreen.svelte`.

It receives:

- product name
- progress summary
- current phase label from localized application text
- optional non-fatal warning count

It emits no navigation decisions. `App.svelte` coordinates when Loading appears and when the next screen becomes interactive.

### Visual Parity

The Loading screen must match the current rebuild art direction instead of introducing a separate dark sci-fi system style.

Use the approved HUD overlay direction:

- bright blue-white overlay treatment, closer to Stage Select and Gameplay HUD than the previous dark navy gradient
- no large `PROJECT ALMOST` logo or Title-like hero layout, because that reads as returning to the title screen
- HUD/Stage Select style translucent white-blue panel with blue linework, inset border, and soft backdrop blur
- gold status accent that matches existing HUD dots, stars, and result highlights
- blue-to-gold progress treatment that fits the HUD palette
- warning display as a restrained gold HUD notice, not a red error surface

The screen should still be sparse and transitional. It must not become a marketing-style splash page or a separate menu surface.

## Asset Groups

`boot`:

- font files
- title background
- title music
- UI SFX
- world select backgrounds needed by shell/title-to-world navigation

`shared-gameplay`:

- player sprites
- common enemy sprites
- props, hazards, checkpoint, goal
- tilesets
- HUD/result assets
- gameplay SFX and result music

`stage`:

- selected stage background layers
- selected stage terrain tileset
- boss assets when the stage is a boss stage
- world BGM or boss BGM for the selected stage's world

The planner must return unique asset sources only. Runtime paths must start with `/assets/` and must not include `__prototype__`.

## Runtime Flow

### Initial Boot

1. `App.svelte` starts in an application-local loading state.
2. The preload coordinator loads the `boot` plan.
3. While loading, `ResolutionFrame` renders `LoadingScreen`.
4. After loading completes, the existing Title intro renders and existing title music unlock behavior continues.
5. If any boot asset failed, the app continues as `ready-with-errors` and the warning count is available to the Loading screen before it leaves.

### Gameplay Entry

1. User confirms a stage from Stage Select.
2. App derives the target gameplay screen and selected stage map.
3. App loads `shared-gameplay + stage` assets for that stage before mutating `appState.screen` to gameplay.
4. During this wait, `LoadingScreen` is shown inside the frame instead of mounting `GameplayScreen`.
5. Existing scene transition timing may still wrap the final screen mutation, but the gameplay Phaser scene should mount only after the preload plan has completed.
6. Once the gameplay transition is fully covered, the screen swap must hide `LoadingScreen` before reveal starts so players fade into gameplay, not back into the completed Loading screen.
7. Retry and Next Stage flows also use the same stage preload gate.

### Background Preload

When the user is on World Select or Stage Select, App may call non-blocking background preload for the highlighted world/stage. Background preloading must use the same cache so gameplay entry does not reload completed sources.

## Error Handling

Asset preload errors are non-fatal. Each failed source records:

- source
- kind
- message

The loader still advances progress and resolves the plan. Fatal JavaScript errors in the preload coordinator are test failures, not expected runtime behavior.

## Localization

Visible Loading screen text must be routed through the existing localization data system. Add only the minimum keys needed for:

- loading title
- boot phase
- gameplay phase
- warning count label

## Testing Strategy

Use TDD for implementation.

Required tests:

- asset manifest contains only rebuild-owned `/assets/` paths
- boot plan includes fonts, title background, title music, UI SFX, and world select backgrounds
- shared gameplay plan includes player sprites, common sprites, props, HUD/result assets, tiles, gameplay SFX, and result music
- stage plan includes selected stage background layers, terrain tileset, boss assets for boss stages, and world music
- plan builder de-duplicates repeated sources
- progress presenter reports completed, total, percent, and warning count deterministically
- browser loader reports progress for successful and failed sources
- browser loader reuses pending and completed sources
- App source contract proves stage confirm, retry, and next-stage flows route gameplay entry through the preload gate
- Loading screen source contract proves it receives progress data and has no app-flow mutation logic
- Loading screen source contract proves the visual styling uses the approved HUD overlay classes, avoids Title-logo structure, and no longer uses the previous dark-tech mark/progress structure

Before finishing, run:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

Also verify in browser:

- initial app render shows Loading before Title
- after boot preload, Title intro appears
- confirming a stage shows Loading before Gameplay mounts
- re-entering an already loaded stage either skips quickly or shows completed progress without missing textures

## Acceptance Criteria

- No runtime source imports from `__prototype__`.
- Runtime assets needed by boot and gameplay are discoverable from the rebuild asset manifest/planner.
- Title is not interactive until boot assets finish preloading.
- Gameplay screen is not mounted until selected stage gameplay assets finish preloading.
- Failed individual assets do not permanently block the app.
- The implementation preserves TDD, DDD, FP, and Reactive boundaries.
- Loading screen visuals are consistent with the Title, Stage Select, and Gameplay HUD visual language.
- Work remains on feature branch `codex/preloading-assets` until the user explicitly approves merging.
