# P2 Slice 86: Boss Hit Eligibility Rule

## Target Behavior

Move the first guard in `GameplayScene.hitBossPrototype()` into a pure boss-domain rule.

The current behavior is:

- A boss hit is ignored when the boss prototype does not exist.
- A boss hit is ignored after the boss is already defeated.
- A boss hit is allowed only when the boss exists and is not defeated.

All side effects stay in `GameplayScene`: stopping the boss pattern, dispatching sound, clearing projectiles, advancing phases, disabling the sprite body, playing animations, revealing the goal, resetting the player, and restarting the next pattern.

## Domain Shape

Add to `src/domain/boss/bossRules.ts`:

```ts
export function canHitBossPrototype(input: {
  bossExists: boolean
  bossDefeated: boolean
}): boolean
```

The rule returns `true` only when `bossExists === true` and `bossDefeated === false`.

## Adapter Shape

In `GameplayScene.hitBossPrototype()`:

```ts
const boss = this.bossPrototype
if (!canHitBossPrototype({
  bossExists: Boolean(boss),
  bossDefeated: boss?.defeated ?? false,
})) {
  return
}
```

The scene keeps the `boss` local variable for all Phaser-side operations after the guard.

## Test Plan

Add co-located tests in `src/domain/boss/bossRules.test.ts`:

- missing boss -> `false`
- existing undefeated boss -> `true`
- existing defeated boss -> `false`

## Validation

- RED: focused boss test fails before production implementation.
- GREEN: focused boss test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
