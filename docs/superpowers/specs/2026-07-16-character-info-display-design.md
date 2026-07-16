# Character Info Display Design

## Goal

Implement selected-character information display in the rebuild while matching the playable prototype's visual intent and keeping the new project architecture testable.

This covers:

- Stage Select active character information.
- Gameplay player status character information.
- Stage Result hero character information.

The implementation must reference prototype behavior and assets only. Runtime source code must not import from `__prototype__/`.

## Prototype Reference

The prototype shows a single selected playable character:

- Stage Select detail panel: a square portrait, `Active Character`, and `Yuuta Tsubasa`.
- Gameplay HUD status panel: the same portrait and character name above HP.
- Stage Result: full-body standee, character name, and role label.

The prototype assets already exist in the rebuild-owned runtime asset tree:

- `/assets/hud/player-portrait.webp`
- `/assets/results/yuuta-stage-result-standee.webp`

## Architecture

### Domain

Add a pure domain character profile module under `src/domain/character/`.

The domain model owns selected-character identity and presentation metadata:

- stable character id
- display name
- role label
- HUD portrait asset reference
- result standee asset reference
- portrait alt text

The initial catalog contains the prototype-equivalent selected character, `yuuta`.

Domain constraints:

- no Svelte, DOM, Phaser, browser storage, timers, or runtime side effects
- no `__prototype__` asset references
- deterministic lookup for selected-character profile

### Application/UI Boundary

Add a small application-level presenter or view model that projects a selected character profile into screen-specific data:

- Stage Select character card
- Gameplay HUD character status identity
- Stage Result hero identity

This keeps UI components reactive and dumb: they render provided data rather than resolving global character data themselves.

### UI Wiring

Stage Select:

- Replace hard-coded `Yuuta Tsubasa` and CSS-only portrait with passed character info.
- Keep prototype shape: portrait + active label + name.

Gameplay HUD:

- Replace hard-coded portrait/name/alt with passed character info.
- Remove the extra status objective sentence from under the character status. The gameplay objective remains in the existing objective panel.

Stage Result:

- Replace hard-coded hero name/role/standee with passed character info.
- Keep existing prototype-equivalent result layout and animations.

## Tests

Use TDD:

1. Domain profile tests prove the selected character resolves to rebuild-owned assets and prototype-equivalent name/role metadata.
2. Application presenter tests prove screen-specific view models are derived from the selected profile.
3. UI contract tests prove Stage Select, Gameplay HUD, and Stage Result consume character props instead of hard-coding name/asset values.
4. Gameplay HUD tests prove the status panel no longer renders the objective/status message under the character info.

## Verification

Required checks:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

Browser QA should verify:

- Stage Select shows the portrait and active character label/name.
- Gameplay HUD shows portrait/name/HP only in the character status panel; objective text only appears in the objective panel.
- Stage Result shows the standee/name/role with the existing animation and layout.

