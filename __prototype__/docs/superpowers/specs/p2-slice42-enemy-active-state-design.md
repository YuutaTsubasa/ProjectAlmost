# P2 Slice 42: Enemy Active State

## Target Behavior

Move the gameplay HUD `enemyActive` decision out of `GameplayScene` and into the pure enemy domain.

An active enemy means at least one runtime enemy is not defeated. The Phaser scene still owns enemy sprites, marker projection, rendering, collisions, and defeated state mutation; the domain only decides whether a list contains an active enemy.

## Domain Rule

`hasActiveEnemy(input)` returns:

- `false` when there are no enemies.
- `false` when every enemy has `defeated === true`.
- `true` when any enemy has `defeated === false`.

The input is structural and only requires `{ defeated: boolean }`. The domain must not import Phaser, Svelte, DOM APIs, or game runtime types.

## Files Expected To Change

- `src/domain/enemy/enemyRules.ts`
- `src/domain/enemy/enemyRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change how enemy markers are filtered or projected.
- Do not change scoring, respawn policy, regeneration, or `countsForScore`.
- Do not move enemy runtime state into module-level globals.
- Keep `GameplayScene` as the side-effect adapter that reads the pure decision and emits HUD state.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Wire `GameplayScene` HUD dispatch to call the domain function.
4. Run the focused enemy domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
