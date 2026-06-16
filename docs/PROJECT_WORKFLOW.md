# Project Workflow

This project should be developed with a lightweight "skill" workflow: understand the current system, state the intended change, implement narrowly, verify, and leave better handoff notes than before.

The goal is to make future sessions safer. New features have been causing regressions because state ownership, asset loading, object placement, and stage data rules were implicit. This workflow makes those rules explicit.

## Session Start Checklist

1. Run `git status --short`.
2. Read `AGENTS.md`.
3. Read the docs relevant to the task.
4. Identify the ownership boundary:
   - Svelte UI
   - Phaser gameplay
   - stage JSON
   - asset manifest/preload
   - save data
   - localization
5. Identify likely regression areas before editing.

Do not begin a broad implementation from memory. The project changes quickly, and stale assumptions are a common source of bugs.

## Feature Brief Rule

For any feature that touches more than one ownership boundary, create or state a short feature brief before editing.

Use `docs/templates/FEATURE_BRIEF.md` when the work should be preserved for handoff. A brief is recommended for:

- new mechanics
- new worlds or stages
- boss logic
- save data changes
- preload or asset pipeline changes
- input changes
- UI screens or navigation changes
- refactors in `App.svelte`, `GameplayScene.ts`, or `app.css`

Small visual nudges or one-line bug fixes do not need a separate brief, but the final response should still mention what was verified.

## Implementation Rules

### Runtime State

Avoid mutable module-level runtime state for stages, objects, enemies, hazards, bosses, timers, UI selection, and asset variants.

Correct pattern:

- Select immutable stage data by id.
- Clone or construct per-run stage data.
- Pass it into the owning scene or component instance.
- Destroy and recreate runtime objects during scene teardown/restart.

Incorrect pattern:

- Global `activeStage`-style state that is mutated before a scene starts.
- Shared arrays of platforms, hazards, bullets, or enemies across stages.
- Stage-specific asset keys selected by mutating global variables.

### Stage Data

Stage JSON describes intent. It should not compensate for sprite padding or collision quirks.

Use `surfaceY` for grounded placement. Use `objectDefinitions.ts` for:

- object origin
- collision body size and offset
- visual bottom inset
- gravity
- grounded/floating/centered placement
- score and respawn behavior

If a grounded object visually floats or sinks, fix the object definition or asset processing, not every stage JSON.

### Assets

Every runtime asset must be discoverable from `src/game/assets/assetManifest.ts`.

When adding assets:

1. Put runtime files under `public/assets/`.
2. Put source/generated files under `assets/source/generated/<asset-name>/`.
3. Register runtime files in the manifest.
4. Confirm preload covers the asset.
5. Keep old source files if they explain how the runtime asset was derived.

Do not point runtime code at `__DESIGN__/`.

### UI and Localization

Visible UI text goes through `src/i18n.ts`.

When adding a UI string, add English, Japanese, Traditional Chinese, and Korean values in the same change. If translation quality is uncertain, leave a short note in the feature brief or final response.

### Screen and Audio Flow

`App.svelte` owns high-level screen flow and music switching. `GameplayScene.ts` owns frame-by-frame gameplay and emits coarse HUD/audio events.

Do not make Phaser directly own app-level menu routing unless the architecture is intentionally changed and documented.

## Verification Matrix

Use the smallest useful set, but do not skip checks for cross-boundary work.

| Change type | Required verification |
| --- | --- |
| Docs only | `git diff --check` |
| Svelte or TypeScript | `npm run check` |
| Stage JSON | `npm run check`, playable smoke test if possible |
| Asset manifest/preload | `npm run check`, `npm run build` |
| Gameplay mechanics | `npm run check`, browser play test |
| Screen flow/audio/save | `npm run check`, browser navigation test |
| Generated assets | Inspect the image/sprite, confirm manifest/preload if runtime |

## Handoff Notes

When a task changes architecture or future workflow, update one of:

- `README.md` for broad project state
- `docs/ARCHITECTURE_MAP.md` for ownership boundaries
- `docs/ASSET_PIPELINE.md` for asset conventions
- `docs/GAME_DESIGN.md` for design rules
- `docs/PROJECT_WORKFLOW.md` for process rules

The final response should include:

- what changed
- what was verified
- what was intentionally left for later
- any dirty worktree caveat if relevant
