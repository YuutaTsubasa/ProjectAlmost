# P2 Slice 89: Boss Volley Fire Eligibility Rule

## Target Behavior

Move the `fireBossVolley()` early-return guard into a pure boss-domain rule.

The current behavior is:

- Do not fire a boss volley when the boss sprite is missing.
- Do not fire a boss volley when the boss sprite exists but is not visible.
- Fire only when the boss sprite exists and is visible.

All Phaser work stays in `GameplayScene`: reading sprite position, calculating the aimed angle, calling `getBossVolleyShots()`, and spawning projectiles.

## Domain Shape

Add to `src/domain/boss/bossRules.ts`:

```ts
export function canFireBossVolley(input: {
  bossExists: boolean
  bossVisible: boolean
}): boolean
```

The rule returns `true` only when both inputs are true.

## Adapter Shape

In `GameplayScene.fireBossVolley()`:

```ts
const boss = this.bossPrototype?.sprite
if (!canFireBossVolley({
  bossExists: Boolean(boss),
  bossVisible: boss?.visible ?? false,
})) return
```

The scene keeps all projectile side effects.

## Test Plan

Add tests in `src/domain/boss/bossRules.test.ts`:

- missing boss -> `false`
- existing invisible boss -> `false`
- existing visible boss -> `true`

## Validation

- RED: focused boss test fails before production implementation.
- GREEN: focused boss test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
