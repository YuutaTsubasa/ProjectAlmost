# P2 Slice 45: Gameplay HUD Checkpoint Marker List

## Target Behavior

Move the gameplay HUD checkpoint marker list construction out of `GameplayScene` and into the pure stage HUD map domain.

The Phaser scene still owns selected stage data, checkpoint progression state, and HUD event dispatch. The domain receives structural checkpoint positions and returns normalized minimap checkpoint markers.

## Domain Rule

`getHudCheckpointMarkers(input)` returns:

- An empty list when there are no checkpoints.
- One marker for each checkpoint, preserving input order.
- Marker coordinates equivalent to `getHudCheckpointMarker`.
- Raw normalized values without clamping.

The input is structural and only requires checkpoint `{ x: number; surfaceY: number }` plus `worldWidth` and `worldHeight`. The domain must not import Phaser, Svelte, DOM APIs, stage runtime objects, or game scene types.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change active checkpoint index, reached checkpoint count, or checkpoint trigger logic.
- Do not clamp marker output; existing HUD projection intentionally preserves raw normalized values.
- Do not move stage runtime state into module-level globals.
- Keep `GameplayScene` as the adapter that passes stage checkpoint data and dimensions into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function, reusing `getHudCheckpointMarker`.
3. Wire `GameplayScene` HUD dispatch to call the domain list rule.
4. Run the focused HUD map domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
