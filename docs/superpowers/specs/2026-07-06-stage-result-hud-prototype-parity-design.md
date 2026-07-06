# Stage Result HUD Prototype Parity Design

## Goal

Adjust the rebuilt Stage Result HUD so its visible composition matches the playable `__prototype__/` more closely, while keeping the current clean-room implementation and data flow.

This is a visual parity slice only. It does not change scoring, result snapshot generation, retry flow, stage select flow, next-stage availability, save data, progression, or unlock behavior.

## Approved Direction

The approved target is the bright prototype-style result HUD direction shown in the visual companion on July 6, 2026:

- pale blue-white veil over the gameplay scene instead of the current dark overlay,
- left Yuuta standee masked into the scene with a bottom blue gradient,
- clipped blue result banner with gold star ornaments,
- horizontal stage name row with a small blue diamond divider,
- bright translucent result board rather than a dark glass combat panel,
- stat rows separated by soft HUD lines rather than individual dark row blocks,
- rank area as a right-side column containing a circular rank badge,
- action buttons spanning the result content width in the prototype style,
- locked Next Stage includes an explicit locked sublabel.

## Prototype Reference

Use these files as visual reference only:

- `__prototype__/src/StageResult.svelte`
- `__prototype__/src/app.css`, especially `.stage-result`, `.result-veil`, `.result-hero`, `.result-banner`, `.result-stage-name`, `.result-board`, `.result-stats`, `.result-rank`, and `.result-actions`.

Do not copy prototype Svelte or CSS verbatim. Rebuild equivalent structure and styling in `src/ui/gameplay/StageResult.svelte`.

## Scope

Modify:

- `src/ui/gameplay/StageResult.svelte`
- `src/ui/gameplay/stageResultUi.test.ts`

Optional only if needed for localized copy isolation:

- the local `stageResultCopy` map inside `StageResult.svelte`

Do not modify:

- domain scoring or rank calculation,
- renderer result snapshot logic,
- gameplay input routing,
- app navigation helpers,
- runtime prototype files under `__prototype__/`.

## UI Contract Changes

Update the Stage Result component contract tests before changing the component so they fail on the current dark layout.

Tests should assert the presence of the rebuilt prototype parity markers:

- result banner renders decorative star spans around the title,
- stage name renders a separator element between stage title and subtitle,
- result board keeps the prototype two-column stat/rank layout,
- stat values that include targets render the target count in a nested `<em>` element,
- rank renders a label, circular rank badge, and final-evaluation sublabel as separate elements,
- locked Next Stage renders a locked sublabel from isolated copy,
- CSS uses bright HUD panel tokens/values and no dark board background matching the current implementation.

These are source-level UI contract tests because the current project already uses source tests for Svelte component parity in this slice.

## Implementation Notes

Keep the existing props, domain helpers, and callbacks:

- `result`
- `stageDisplay`
- `selectedAction`
- `nextStageAvailable`
- `onSelectAction`
- `onAction`

Keep the existing keyboard/gamepad-style result action wiring in `GameplayScreen.svelte`.

The component should keep `cqw`/`cqh` sizing so the result HUD scales with the established 16:9 resolution frame. Avoid `vw`/`vh` for the overlay internals.

## Acceptance Criteria

- Clearing a stage shows a bright prototype-style Stage Result HUD, not the current dark overlay panel.
- The board, row typography, rank badge, and action buttons visually match the prototype proportions more closely.
- `Next Stage` remains disabled when unavailable and shows a locked sublabel.
- No runtime source imports from `__prototype__`.
- Tests are written first and fail against the current implementation before the visual parity changes.
- Focused UI tests pass after implementation.
- Required verification passes:
  - `npm run test -- src/ui/gameplay/stageResultUi.test.ts`
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `git diff --check`

## Out Of Scope

- Pixel-perfect screenshot diffing.
- Changing the actual gameplay clear timing or score.
- Adding save records, unlock progression, or next-stage navigation.
- Full localization file extraction.
