# P2 Slice 26: Player Animation Decision

## Target Behavior

Extract the pure branch decision from `GameplayScene.updatePlayerAnimation(isMoving, grounded)`.

The rule answers which player animation update, if any, should be applied for the current player state.

Current behavior must be preserved:

- attacking, hurting, Homing Attacking, or dead players keep the current animation
- airborne active players switch visual state to normal and play `player-jump`
- grounded crouching players play `player-crouch` without forcing visual state to normal
- grounded moving players switch visual state to normal and play `player-run`
- grounded idle players switch visual state to normal and play `player-idle`

## Files Expected To Change

- `src/domain/player/animationRules.ts`
- `src/domain/player/animationRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure animation decision.

Phaser scene keeps:

- texture/animation playback
- `setPlayerVisualState`
- attack-lock respecting animation calls
- player sprite/body mutation

## TDD Plan

1. Add a failing domain test for `getPlayerAnimationDecision`.
2. Implement the minimal pure function.
3. Replace the branching in `GameplayScene.updatePlayerAnimation` with scene adapter code.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve the existing priority order: locked state, airborne, crouching, moving, idle.
- No animation keys, visual offsets, sprite scaling, or body changes are modified in this slice.
