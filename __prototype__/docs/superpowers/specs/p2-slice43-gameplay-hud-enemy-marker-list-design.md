# P2 Slice 43: Gameplay HUD Enemy Marker List

## Target Behavior

Move the gameplay HUD enemy marker list decision out of `GameplayScene` and into the pure stage HUD map domain.

The Phaser scene still owns runtime enemy objects, sprites, visibility, activity, and collision. The domain receives structural enemy positions plus defeated state, filters out defeated enemies, and returns normalized minimap markers.

## Domain Rule

`getHudEnemyMarkers(input)` returns:

- An empty list when there are no enemies.
- An empty list when every enemy is defeated.
- A marker for each enemy with `defeated === false`.
- Marker coordinates equivalent to `getHudEnemyMarker`: `x / worldWidth` and `y / worldHeight`.
- Raw normalized values without clamping.

The input is structural and only requires `{ x: number; y: number; defeated: boolean }`. The domain must not import Phaser, Svelte, DOM APIs, or game runtime types.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change Homing Attack target filtering, which also checks sprite activity and visibility.
- Do not change enemy active state, scoring, respawn, or regeneration.
- Do not move sprite reads into the domain. `GameplayScene` should adapt runtime sprites into plain values.
- Do not clamp marker output; existing HUD projection intentionally preserves raw normalized values.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function, reusing `getHudEnemyMarker`.
3. Wire `GameplayScene` to pass structural enemy marker inputs.
4. Run the focused HUD map domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
