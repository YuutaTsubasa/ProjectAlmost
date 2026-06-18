# Enemy Patrol Direction Design Spec

## Purpose

Extract enemy patrol direction decisions from `GameplayScene.ts` into the pure enemy domain.

This is P2 Slice 4 of the `GameplayScene` domain extraction effort. The slice keeps Phaser sprite reads, velocity updates, flip state, defeated checks, Azure Core skips, and animation behavior inside `GameplayScene`, while moving the repeated patrol direction rule into `src/domain/enemy/`.

## Problem

`GameplayScene.ts` currently owns two domain-level patrol decisions:

- new patrol enemies start moving left with direction `-1`.
- patrol direction changes only when the enemy moves strictly outside its authored range:
  - `x < patrolMinX` turns right with direction `1`.
  - `x > patrolMaxX` turns left with direction `-1`.
  - positions inside the range, including exact boundaries, keep the current direction.

Keeping these rules as anonymous numbers in the scene makes it easier to accidentally drift patrol behavior while editing Phaser-side effects.

## Design

Add patrol direction types and rules to `src/domain/enemy/enemyRules.ts`:

```ts
export type PatrolDirection = -1 | 1
export const INITIAL_PATROL_DIRECTION: PatrolDirection = -1

export function getNextPatrolDirection(input: {
  x: number
  patrolMinX: number
  patrolMaxX: number
  currentDirection: PatrolDirection
}): PatrolDirection
```

Behavior:

- `x < patrolMinX` returns `1`.
- `x > patrolMaxX` returns `-1`.
- otherwise returns `currentDirection`.

`GameplayScene` uses `INITIAL_PATROL_DIRECTION` when creating enemy runtime state, and `getNextPatrolDirection()` inside `updateEnemyPatrol()`.

If the type change stays local, `EnemyRuntime.direction` should narrow from `number` to `PatrolDirection`.

## Non-Goals

This slice does not:

- move Phaser sprite `x` reads into the domain.
- move `setVelocityX`, `setFlipX`, animation, or body behavior into the domain.
- change the patrol speed constant `80`.
- change pause/resume velocity restoration.
- change Azure Core or defeated-enemy skip behavior.
- change stage JSON patrol ranges.

## Tests

Add tests to `src/domain/enemy/enemyRules.test.ts`:

- `INITIAL_PATROL_DIRECTION` is `-1`.
- `x < patrolMinX` returns `1`.
- `x > patrolMaxX` returns `-1`.
- positions inside the range keep the current direction.
- exact `x === patrolMinX` and `x === patrolMaxX` keep the current direction.
- both current directions, `-1` and `1`, are represented.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
