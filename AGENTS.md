# ProjectAlmost Agent Guide

Read this file before changing code in a new session. It is the project-level workflow entry point for Codex, Claude Code, and other coding agents.

## Required Reading

Before implementation, read the relevant files in this order:

1. `README.md` for the current product state and broad architecture.
2. `docs/PROJECT_WORKFLOW.md` for the implementation workflow and required handoff notes.
3. `docs/ARCHITECTURE_MAP.md` for ownership boundaries and risk areas.
4. `docs/ARCHITECTURE_REVIEW_TDD_DDD.md` when planning new systems, refactors, or TDD-driven work.
5. `docs/ASSET_PIPELINE.md` when adding or replacing runtime art, audio, fonts, or generated assets.
6. `docs/GAME_DESIGN.md` when changing stage design, mechanics, controls, scoring, or world identity.

For stage work, also read:

- `src/game/stages/stageTypes.ts`
- `src/game/stages/stageRegistry.ts`
- `src/game/objects/objectDefinitions.ts`
- The specific stage JSON file being changed.

## Working Rules

- Start by checking `git status --short`. Assume unrelated dirty files belong to another human or agent.
- Keep feature changes scoped. Do not opportunistically refactor `App.svelte`, `GameplayScene.ts`, or `app.css`.
- Do not put stage-specific or object-specific runtime state in module-level mutable globals.
- Stage data must be selected, cloned, and passed into the gameplay scene instance. A later stage must not inherit platforms, hazards, enemies, assets, timers, or boss state from a previous stage.
- Use object definitions for placement, origins, collision bodies, visual bottom insets, and object behavior. Do not fix sprite padding by hand in individual stage JSON files.
- Runtime assets belong in `public/assets/` and must be registered in `src/game/assets/assetManifest.ts`.
- Visible UI strings must go through `src/i18n.ts` for English, Japanese, Traditional Chinese, and Korean.
- Verify frontend changes in the running app when possible, especially after UI, input, stage, or Phaser changes.
- Prefer TDD on pure domain rules before wiring Svelte or Phaser adapters. See `docs/ARCHITECTURE_REVIEW_TDD_DDD.md`.

## Before Editing

Write down the intended change in the conversation or in a short feature brief when the task is bigger than a small bug fix.

Use `docs/templates/FEATURE_BRIEF.md` as the structure for larger work:

- target behavior
- files expected to change
- architecture risks
- asset or localization impact
- validation plan

## Before Finishing

Run the smallest checks that match the change:

- Documentation-only: `git diff --check`
- Svelte, TypeScript, gameplay, or data changes: `npm run check`
- Asset manifest, preload, build, or routing changes: `npm run build`
- Visual/UI changes: inspect in the browser and report what was verified.

Update docs when the implementation changes an architecture rule, stage data convention, asset convention, or workflow expectation.
