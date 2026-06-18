# P2 Slice 67: Homing Target Lost Rule

## Target Behavior

During an active Homing Attack, the attack should finish as a miss when the current target can no longer be used:

- the enemy runtime already marks the target defeated
- the target sprite is no longer active
- the target sprite is no longer visible

The behavior must remain identical to the existing `GameplayScene.updateHomingAttack()` guard.

## Boundary

Domain:

- `src/domain/player/homingRules.ts`
- pure boolean predicate only
- no Phaser, Svelte, DOM, timers, or sprite imports

Adapter:

- `src/game/scenes/GameplayScene.ts`
- still reads Phaser sprite state and `isEnemyDefeated(...)`
- still calls `finishHomingAttack(false)` as the side effect

## Proposed API

```ts
export function isHomingTargetLost(input: {
  defeated: boolean
  active: boolean
  visible: boolean
}): boolean
```

Return `true` when `defeated || !active || !visible`.

## TDD Cases

- defeated target -> lost
- inactive target -> lost
- invisible target -> lost
- undefeated active visible target -> not lost

## Validation

- `npm run test -- src/domain/player/homingRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
