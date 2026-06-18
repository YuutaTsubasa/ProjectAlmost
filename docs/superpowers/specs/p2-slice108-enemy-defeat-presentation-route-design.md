# P2 Slice 108: Enemy Defeat Presentation Route Decision

## Target Behavior

Move the defeated enemy presentation route decision out of `GameplayScene.defeatEnemy()` and into the pure enemy domain.

The behavior must remain unchanged:

- Azure Cores use the burst/fade defeat presentation.
- Guards and enemies without an explicit type use the guard death presentation.

## Domain Boundary

Add a pure rule in `src/domain/enemy/enemyRules.ts`.

The rule only chooses a semantic presentation route from enemy type data. It must not know about Phaser tweens, textures, animation keys, scene theme, sprite bodies, score, SFX, timers, or regeneration.

Suggested shape:

```ts
export type EnemyDefeatPresentationRoute = 'azure-core-burst' | 'guard-death'

export function getEnemyDefeatPresentationRoute(input: {
  type?: EnemyType
}): EnemyDefeatPresentationRoute {
  return getEnemyType(input.type) === 'azure-core' ? 'azure-core-burst' : 'guard-death'
}
```

## Scene Adapter

`GameplayScene.defeatEnemy()` keeps all side effects:

- stopping velocity
- disabling body
- Azure Core tween setup
- guard death texture/animation selection
- stage-theme-specific texture branch
- delayed hide
- regeneration scheduling

The scene should only call the domain rule and branch on the returned route.

## Tests

Add co-located domain tests covering:

- Azure Core returns `'azure-core-burst'`.
- Guard returns `'guard-death'`.
- Missing type defaults to `'guard-death'`, preserving the current default guard semantics.

## Validation

- Focused RED/GREEN test for `src/domain/enemy/enemyRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change death animation timing, tween values, texture keys, or stage-theme branches.
- Do not change score or respawn behavior.
- Do not extract status messages or delayed visibility in this slice.
