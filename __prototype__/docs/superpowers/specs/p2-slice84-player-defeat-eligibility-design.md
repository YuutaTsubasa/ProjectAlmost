# P2 Slice 84: Player Defeat Eligibility Rule

## Target Behavior

Move the first guard in `GameplayScene.defeatPlayer()` into a pure player-domain rule.

The current behavior is:

- The player can enter the defeat flow only when they are not already dead.
- The player can enter the defeat flow only before the stage has been cleared.
- Death side effects remain in `GameplayScene`: sounds, counters, boss projectile cleanup, animation, camera fade, and respawn scheduling.

## Domain Shape

Add `canEnterPlayerDefeat()` to `src/domain/player/hurtRules.ts`.

```ts
export function canEnterPlayerDefeat(input: {
  dead: boolean
  stageCleared: boolean
}): boolean
```

The rule returns `true` only when `dead === false` and `stageCleared === false`.

## Adapter Shape

`GameplayScene.defeatPlayer()` should call the domain rule for the early return:

```ts
if (!canEnterPlayerDefeat({
  dead: this.isDead,
  stageCleared: this.stageCleared,
})) {
  return
}
```

All existing defeat flow side effects stay in `GameplayScene`.

## Test Plan

Add co-located tests in `src/domain/player/hurtRules.test.ts`:

- not dead and not cleared -> `true`
- already dead -> `false`
- stage cleared -> `false`
- both dead and cleared -> `false`

## Validation

- RED: focused test fails before production implementation.
- GREEN: focused domain test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
