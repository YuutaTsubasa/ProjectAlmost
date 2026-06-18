# P2 Slice 107: Enemy Defeat Route Decision

## Target Behavior

Move the boss-prototype versus normal-enemy routing decision out of `GameplayScene.defeatEnemy()` and into the pure enemy domain.

The behavior must remain unchanged:

- A defeated runtime enemy that is the current boss prototype routes to boss-hit handling.
- Every other defeated runtime enemy routes to normal enemy defeat handling.

## Domain Boundary

Add a pure rule in `src/domain/enemy/enemyRules.ts`.

The rule only decides the route from a boolean identity check supplied by the Phaser adapter. It must not know about Phaser sprites, scene instances, scoring, animations, SFX, timers, or regeneration.

Suggested shape:

```ts
export type EnemyDefeatRoute = 'boss-hit' | 'normal-defeat'

export function getEnemyDefeatRoute(input: {
  bossPrototype: boolean
}): EnemyDefeatRoute {
  return input.bossPrototype ? 'boss-hit' : 'normal-defeat'
}
```

## Scene Adapter

`GameplayScene.defeatEnemy()` keeps all side effects:

- `hitBossPrototype()`
- `getEnemyDefeatOutcome()`
- score updates
- SFX
- reticle visibility
- sprite velocity/body/animation/tween changes
- regeneration scheduling

The scene should only pass `enemy === this.bossPrototype` into the domain rule and branch on the returned route.

## Tests

Add co-located domain tests covering:

- `bossPrototype: true` returns `'boss-hit'`.
- `bossPrototype: false` returns `'normal-defeat'`.

## Validation

- Focused RED/GREEN test for `src/domain/enemy/enemyRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change boss hit timing, phase logic, or projectile cleanup.
- Do not change enemy score, respawn, or presentation behavior.
- Do not extract the Azure Core versus guard death presentation branch in this slice.
