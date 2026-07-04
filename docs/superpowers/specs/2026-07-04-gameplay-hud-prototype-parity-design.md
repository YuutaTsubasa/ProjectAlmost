# Gameplay HUD Prototype Parity Design

## Goal

Adjust the rebuilt gameplay HUD so its visible layout, visual language, and live readouts match the playable `__prototype__/` HUD closely, while keeping the rebuild implementation clean-room and aligned with the project architecture.

Prototype code is a reference for observable behavior and appearance only. Runtime source code from `__prototype__/src` must not be imported, copied, or mechanically ported into the rebuild.

## Current Problem

The rebuilt HUD has the correct first-pass state contract, but it is visually simpler than the prototype:

- The status panel lacks the player portrait and prototype system-status composition.
- The stage banner is a simple rounded rectangle instead of the prototype clipped banner with world/stage/subtitle hierarchy.
- The bottom readouts are a plain grid and do not include the prototype controls group or rank field.
- Prototype panel details such as inner borders, corner marks, map grid treatment, and HUD entrance motion are not represented.
- Prototype status-message behavior exists as a concept in the old runtime, but the rebuild HUD currently only shows static objective text.

The desired direction is not to preserve this simplified HUD. The rebuild must converge toward prototype-equivalent HUD presentation, with any intentional differences documented in the implementation plan.

## Non-Negotiable Constraints

- Follow TDD for every behavior or UI contract change.
- Keep domain logic pure and framework-free under `src/domain/`.
- Keep Phaser runtime observation inside the renderer; expose HUD facts through typed patches/callbacks.
- Keep Svelte reactive and presentational; it must render state and emit no gameplay side effects.
- Size gameplay HUD elements against the 16:9 `.resolution-frame` container using container-query units (`cqw`/`cqh`), not viewport units (`vw`/`vh`). The app shell letterboxes the game into a fixed-aspect resolution frame; HUD proportions must follow that frame so the overlay stays visually consistent across display resolutions.
- Do not import runtime code from `__prototype__/`.
- Do not copy prototype Svelte/CSS verbatim. Rebuild equivalent structure and styling in the new project.
- Runtime assets copied from prototype must live under rebuild `public/assets/` and be referenced by rebuild paths.
- Keep changes scoped to HUD parity. Do not add StageResult, persistence, audio, pause, boss HUD, or virtual controls behavior in this slice.

## Prototype Reference Surface

Use these prototype files only as reference material:

- `__prototype__/src/App.svelte`
  - HUD structure around status, stage banner, map, objective, boss phase, bottom HUD, and result overlay.
- `__prototype__/src/app.css`
  - HUD visual language: translucent panels, clipped banners, inner borders, corner marks, map styling, bottom HUD, readout typography, and entrance animation.
- `__prototype__/src/i18n.ts`
  - HUD labels and status-message wording.
- `__prototype__/src/domain/stage/hudLabelRules.ts`
  - Observable label formatting.
- `__prototype__/src/domain/stage/hudMapRules.ts`
  - Observable map marker projection behavior.
- `__prototype__/public/assets/hud/player-portrait.webp`
- `__prototype__/public/assets/hud/ai-navigator.webp`

## Target HUD Composition

### Status Panel

The rebuilt status panel must match the prototype conceptually:

- Label: `System Status`.
- Player portrait shown on the left using a rebuild asset path.
- Player name: `Yuuta Tsubasa`.
- HP row showing `3 / 3` style numeric state.
- HP bar using the same red/pink fill language as the prototype.
- Prototype-style translucent panel shell with inner border and corner accents.

The status panel must remain passive and use `pointer-events: none` through the HUD overlay.

### Stage Banner

The stage banner must move from a simple rounded rectangle to a prototype-equivalent clipped banner:

- Shows world name and stage id together, for example `White Palace 1-1`.
- Shows stage subtitle, for example `The First Gate`.
- Uses clipped octagonal geometry, blue gradient fill, gold subtitle text, and compact decorative emblems or equivalent rebuilt decoration.
- Must not overlap status/map panels at desktop or tablet-sized 16:9 viewports.

World/stage display data can be provided through a small explicit rebuild-local mapping for the existing rebuilt stage. The mapping must be isolated so a later stage metadata source can replace it without changing HUD markup.

### Map Overview

The mini-map must keep the current rebuilt marker data but match prototype visual treatment more closely:

- Label: `Map Overview`.
- Inner mini-map frame with subtle grid background.
- Platform, checkpoint, active checkpoint, player, enemy, and goal markers.
- Smooth visual continuity for player marker updates is allowed if implemented only through CSS transitions.

### Objective Panel

The objective panel must match the prototype shell and label style:

- Label: `Objective`.
- Text for this slice remains `Reach the goal`.
- No checkpoint pop-up or respawn banner is introduced in this slice.

### Bottom HUD

The bottom HUD must use the prototype split layout:

- Left group: Controls.
  - Display static key hints matching prototype intent: Move, Jump, Crouch, Attack, Homing.
  - These are HUD hints only; this slice does not implement virtual controls or input remapping.
- Right group: Readouts.
  - Time.
  - Coins.
  - Damage.
  - Falls.
  - Enemies.
  - Checkpoints.
  - Rank.

Rank is displayed as `--` for this slice. The rank display is a parity field, not stage-result scoring.

### Status Contract

The prototype HUD state includes status-message keys even though this gameplay HUD layout does not directly render a separate navigator/status text panel. This slice must preserve that contract shape without adding a new visible navigator UI:

- Add a stable rebuild-local status key field initialized to the equivalent of the prototype initial route guidance.
- The initial rebuild-local status key is `status.initial`.
- Renderer emits the initial status key as part of the initial HUD state. Runtime status-message transitions are deferred to a later visible status-message slice.
- Svelte does not render the status key in this slice.
- Do not wire ad hoc user-facing status strings through the renderer.

## Data Model Changes

Extend the existing `GameplayHudState` with:

- `rank: string` initialized to `--`.
- `statusMessageKey` initialized to a rebuild-local initial status key.

Pass stage display data to the HUD component through explicit props or a small rebuild-local stage display helper:

- world label, for example `White Palace`.
- stage id, for example `1-1`.
- stage subtitle, for example `The First Gate`.

Any added HUD state must be covered by domain tests for initial state and patch reduction.

## Asset Handling

Copy required runtime HUD assets from prototype into rebuild `public/assets/hud/`:

- `player-portrait.webp`.

Do not reference prototype asset paths at runtime.

## Testing Strategy

### Domain Tests

Update `src/domain/gameplay/gameplayHud.test.ts` if HUD state is extended:

- Initial rank is `--`.
- Initial `statusMessageKey` is `status.initial`.
- Patch reducer applies added fields immutably.

### UI Source Tests

Update `src/ui/gameplay/gameplayHudUi.test.ts` to assert prototype-parity structure:

- Status panel includes player portrait markup and `System Status`.
- Stage banner includes world/stage and subtitle binding or display contract.
- Map panel uses `Map Overview` and mini-map marker loops.
- Objective panel remains present.
- Bottom HUD includes controls group and readouts group.
- Readouts include rank.
- Controls group includes Move, Jump, Crouch, Attack, and Homing hints.
- HUD boundary keeps `pointer-events: none`.
- Responsive rules prevent top/bottom HUD overlap at desktop and tablet 16:9 assumptions.

Source-level tests are acceptable for Svelte structure, but important visual risks must also be checked through browser geometry.

### Renderer Tests

Update `src/ui/gameplay/createGameplayRenderer.test.ts` only if renderer-emitted HUD data changes:

- Initial patch includes new fields if renderer owns them.
- Event patches update status fields if status messages are included.
- Existing clear-state freeze guarantees remain intact.

### Browser Verification

Use the in-app browser at desktop and tablet 16:9 sizes:

- HUD appears above the canvas.
- Status panel shows portrait, player name, HP text, and HP bar.
- Stage banner uses the prototype-equivalent visual hierarchy.
- Map markers render.
- Bottom controls and readouts fit without overlap.
- Rank field is visible as `--`.
- HUD overlay does not block gameplay input.
- HUD proportions remain tied to the game frame at multiple browser resolutions, including letterboxed viewports where the browser viewport and the 16:9 resolution frame are not the same size.

## Out Of Scope

- StageResult and rank scoring formula.
- Persistence of rank, best time, or save records.
- Audio/SFX.
- Pause menu.
- Virtual controls behavior.
- Boss-specific HUD variants.
- Full localization system for rebuild HUD labels.
- Importing or mechanically porting prototype Svelte/CSS source.

## Acceptance Criteria

- The rebuilt HUD visibly matches the prototype HUD composition closely enough that differences are intentional and documented.
- Runtime rebuild code and assets do not reference `__prototype__`.
- HUD implementation remains split across pure domain state, renderer patches, and reactive Svelte presentation.
- Required tests are written before implementation changes and pass.
- `npm run test`, `npm run check`, `npm run build`, `git diff --check`, and prototype-boundary scan pass before completion.
