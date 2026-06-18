# P2 Slice 111: Boss Support Core Reset Eligibility

## Target Behavior

Move the boss-pattern support-core reset eligibility check out of `GameplayScene.startBossPattern()` and into the pure boss domain.

The behavior must remain unchanged:

- The boss prototype itself is not reset by the support-core loop.
- Non-Azure-Core enemies are not reset by the support-core loop.
- Non-boss Azure Core enemies are reset when a boss pattern starts.

## Domain Boundary

Add a pure predicate in `src/domain/boss/bossRules.ts`.

The rule only decides whether a runtime enemy should be handled by the boss support-core reset branch. It must not know about Phaser sprites, tweens, scene instances, enemy arrays, status messages, or animation setup.

Suggested shape:

```ts
export function shouldResetBossSupportCore(input: {
  sameAsBoss: boolean
  enemyType?: string
}): boolean {
  return !input.sameAsBoss && input.enemyType === BOSS_PATTERN_ENEMY_TYPE
}
```

## Scene Adapter

`GameplayScene.startBossPattern()` keeps all side effects:

- killing tweens
- resetting `defeated`
- `configureAzureCore()`

The scene should call the domain rule inside the loop and `continue` when it returns `false`.

## Tests

Add co-located domain tests covering:

- Rejects the boss prototype even when it is an Azure Core.
- Rejects non-Azure-Core enemies.
- Rejects enemies without an explicit type.
- Allows non-boss Azure Core enemies.

## Validation

- Focused RED/GREEN test for `src/domain/boss/bossRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change boss pattern start eligibility.
- Do not change boss phase count or volley timing.
- Do not change Azure Core reset visuals or physics.
