# Stage Result Design

## Goal

Rebuild the gameplay Stage Result experience after stage clear, using the playable `__prototype__/` only as a reference for observable behavior, composition, and animation.

The result screen must look and feel like the prototype result overlay, but the implementation must be clean-room and aligned with the rebuild architecture: pure domain rules, typed renderer output, and reactive Svelte presentation.

## Current Problem

The rebuilt gameplay loop can clear a stage and freeze HUD updates, but it has no Stage Result experience:

- `GameplayScreen.svelte` only renders the canvas and HUD.
- `createGameplayRenderer.ts` emits `cleared: true` without a complete result snapshot.
- `GameplayHudState.rank` is currently a placeholder string.
- Stage maps do not yet carry rank target data.
- App-level gameplay routing does not expose retry or stage-select commands to the gameplay screen.

The prototype already has the desired player-facing result experience: a veil, left-side Yuuta standee, clipped result banner, stage title, stat rows, animated final rank, and Retry / Stage Select / Next Stage actions. Those observable details guide this slice.

## Non-Negotiable Constraints

- Follow TDD for every domain, application, renderer, and UI contract change.
- Keep scoring and result derivation pure under `src/domain/`.
- Keep Phaser-specific observation inside `createGameplayRenderer.ts`; the renderer emits typed facts, not UI decisions.
- Keep Svelte reactive and presentational; Svelte renders result state and emits user intents.
- Do not import runtime code from `__prototype__/`.
- Do not copy prototype Svelte or CSS verbatim. Rebuild equivalent structure and styling in the new project.
- Runtime assets copied from prototype must live under rebuild `public/assets/`.
- Size the overlay against the existing 16:9 resolution frame using container-query units, following the HUD parity rule already established for gameplay overlays.
- Do not introduce save persistence, best-record storage, or stage unlock progression in this slice.

## Prototype Reference Surface

Use these prototype files only as reference material:

- `__prototype__/src/StageResult.svelte`
  - Result overlay structure, stats, rank display, and action semantics.
- `__prototype__/src/app.css`
  - Result veil, standee, banner, board, row, rank, and action animations.
- `__prototype__/src/domain/scoring/scoringRules.ts`
  - Observable scoring and rank behavior.
- `__prototype__/src/domain/scoring/rank.ts`
  - Rank ordering and clear-rank type shape.
- `__prototype__/src/domain/progression/progressionRules.ts`
  - Reference only for later persistence work; this slice does not implement progression.
- `__prototype__/src/game/scenes/GameplayScene.ts`
  - Clear-time snapshot facts used by the prototype HUD/result surface.
- `__prototype__/public/assets/hud/player-portrait.webp`
  - Existing rebuild HUD portrait reference.
- Any prototype result standee asset referenced by `IMAGE_ASSETS.resultStandee`, copied into rebuild `public/assets/` if it is not already present.

## Target Result Experience

When the stage is cleared, the gameplay canvas remains visible behind a translucent result overlay. The overlay must show:

- A full-screen result veil with prototype-equivalent fade/blur treatment.
- A left-side Yuuta Tsubasa standee area matching the prototype composition.
- A clipped blue result banner labeled as the stage result title.
- Stage name text in the prototype format, for example `White Palace 1-1`.
- Stage subtitle, for example `The First Gate`.
- Stat rows:
  - Clear Time, with new-record visual text present as static parity copy for this slice.
  - Coins, formatted as collected over target.
  - Damage Taken.
  - Falls.
  - Enemies Defeated, formatted as defeated over target.
  - Checkpoints, formatted as reached over target.
- Perfect labels on stat rows when the prototype would show them:
  - coins equals target,
  - damage is zero,
  - falls is zero,
  - enemies defeated equals target,
  - checkpoints reached equals target.
- A final evaluation rank circle using rank-specific styling for `S`, `A`, `B`, `C`, and `D`.
- Action buttons for Retry, Stage Select, and Next Stage.

Because the rebuild currently has only the `1-1` gameplay map, `Next Stage` is rendered in the prototype-style locked or disabled state for this slice. It must not navigate to a missing map.

## Domain Model

Add a pure scoring/result module under `src/domain/gameplay/` or a closely related domain folder.

The domain API must model:

- `RankTargets`: S/A/B/C target times in seconds.
- `StageScoreInput`: elapsed time, rank targets, collection counts, damage count, and fall count.
- `StageScoreBreakdown`: base score, time score, collection scores, penalties, and total score.
- `ClearRank`: `S | A | B | C | D`.
- `calculateStageRank(input): ClearRank`.
- `scoreStageResult(input): StageScoreBreakdown`.

The scoring behavior must match the prototype-observable rules:

- Base score is 300.
- Time score is 300 at or below S target, 240 at or below A target, 170 at or below B target, 100 at or below C target.
- After C target, time score decays by 3 points per elapsed second beyond C, floored at zero.
- Coin score is worth up to 200.
- Enemy score is worth up to 150.
- Checkpoint score is worth up to 50.
- A target count of zero grants full optional score for that category.
- Damage penalty is 80 per damage taken.
- Fall penalty is 180 per fall.
- Rank thresholds are S at 850, A at 700, B at 550, C at 400, D below 400.

Extend `GameplayStageMap` with `rankTargets`, and add explicit targets for the existing `1-1` map. The chosen targets should be documented in tests and can mirror the prototype first-stage intent where known.

## Result Snapshot Contract

The renderer must emit a complete clear snapshot when a stage is completed. The snapshot is derived from runtime facts already owned by the renderer:

- elapsed time in milliseconds and formatted display time,
- coins collected and coin target,
- damage taken,
- falls,
- enemies defeated and enemy target,
- checkpoints reached and checkpoint target,
- calculated rank.

The snapshot must be represented as typed domain/UI data rather than ad hoc partial fields. After clear, the existing HUD freeze behavior must remain: position, enemy marker, and timer patches stop advancing.

## UI And App Flow

Create a Stage Result Svelte component under `src/ui/gameplay/`.

The component must:

- Accept a typed result snapshot.
- Accept stage display data already used by the HUD display helper.
- Accept selected action index and action callbacks.
- Render the prototype-equivalent structure, labels, row states, rank styles, and disabled next-stage action.
- Avoid hard-coded gameplay strings where existing localization/reference data can be used. Any temporary display copy must be isolated so localization can replace it later.

Update `GameplayScreen.svelte` so it owns the result overlay state reactively:

- It receives callbacks from `App.svelte` for retry and stage select.
- It consumes keyboard/gamepad-style directional and confirm intents while `hudState.result` exists, updating the selected result action through pure helper logic.
- It maps resolved result actions to those callbacks inside Svelte/UI code rather than through a domain callback dispatcher.
- It exposes `Next Stage` as unavailable until a gameplay map exists for the next stage.

Update `App.svelte` only enough to support this slice:

- Remount the gameplay screen for Retry.
- Return to stage select for Stage Select.
- Do not implement save records or unlocks.
- Do not navigate to unavailable next-stage maps.

## Visual And Animation Requirements

The overlay must be visually verified against the prototype at the existing 16:9 resolution frame:

- The result veil covers the gameplay surface.
- The Yuuta standee sits on the left and does not obscure the result board.
- The result content is centered in the same approximate proportions as the prototype.
- The result banner, stage name, board, rows, rank circle, and actions animate in with prototype-equivalent timing and direction.
- Stats rows fit without overlap at desktop and smaller 16:9 frame sizes.
- Action buttons maintain a stable three-button layout; disabled `Next Stage` is visibly locked.

Exact CSS source is not copied from the prototype. Matching means the visible layout, hierarchy, animation intent, and proportions converge with the prototype.

## Testing Strategy

### Domain Tests

Add focused tests for scoring and rank behavior before implementation:

- Perfect target result produces S.
- Exact rank thresholds produce A, B, and C.
- Below C threshold produces D.
- Time score decays after C target.
- Zero optional targets grant full optional score.
- Damage and fall penalties reduce total score.

Add stage map tests:

- The first gameplay map includes finite rank targets.
- Rank targets are ordered from S through C.

### Renderer Tests

Update `src/ui/gameplay/createGameplayRenderer.test.ts` before renderer changes:

- Clear emits a complete result snapshot.
- Snapshot counts reflect current runtime facts.
- Clear snapshot rank is calculated from the pure domain scoring module.
- Existing clear-state freeze behavior remains intact.

### UI Source Tests

Add or update Svelte source-level tests for Stage Result:

- The result component renders the standee, title/banner, stage name, stat board, rank display, and three actions.
- Perfect row markers are represented through data-derived state.
- `Next Stage` has disabled/locked markup when unavailable.
- Component callbacks exist for Retry and Stage Select.
- Styling uses the resolution-frame/container-query sizing approach already required by HUD parity.

### App Flow Tests

Where existing app-flow tests support it, cover:

- Retry remounts the current gameplay stage.
- Stage Select returns to the current stage-select screen.
- Next Stage is unavailable when no gameplay map exists.

If app-flow tests need a new seam, add the smallest pure function or application helper needed to test this behavior without driving Svelte directly.

## Verification

Before completion, run:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
- A prototype-boundary scan confirming rebuild runtime source does not import from `__prototype__`.
- Browser verification in the in-app browser at desktop and smaller 16:9 frame sizes.

## Out Of Scope

- Save persistence.
- Best time, best rank, max coin records, or new-record calculation.
- Unlocking next stages.
- Implementing gameplay maps beyond `1-1`.
- Result audio/SFX.
- Localization expansion beyond isolated display references needed for this slice.
- Pause/menu behavior while the result overlay is open.

## Acceptance Criteria

- Clearing the rebuilt gameplay stage shows a prototype-equivalent Stage Result overlay.
- The overlay displays time, coins, damage, falls, enemies, checkpoints, and calculated final rank from a typed clear snapshot.
- Retry and Stage Select actions work from the result overlay.
- Next Stage is visible but unavailable while no next gameplay map exists.
- Scoring and rank behavior are covered by pure domain tests.
- Renderer and UI contracts are covered before implementation.
- Runtime rebuild code does not import from or reference `__prototype__`.
- Required checks and browser verification pass before the feature is called complete.
