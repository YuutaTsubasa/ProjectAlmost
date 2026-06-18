# P2 Slice 109: Enemy Regeneration Presentation Route Decision

## Target Behavior

Move the regenerating enemy presentation route decision out of `GameplayScene.tryRegenerateEnemy()` and into the pure enemy domain.

The behavior must remain unchanged:

- Azure Cores use the Azure Core regeneration presentation.
- Guards and enemies without an explicit type use the guard regeneration presentation.

## Domain Boundary

Add a pure rule in `src/domain/enemy/enemyRules.ts`.

The rule only chooses a semantic regeneration presentation route from enemy type data. It must not know about Phaser sprites, tweens, scene theme, texture keys, animation keys, body state, status messages, or regeneration timing.

Suggested shape:

```ts
export type EnemyRegenerationPresentationRoute = 'azure-core-regeneration' | 'guard-regeneration'

export function getEnemyRegenerationPresentationRoute(input: {
  type?: EnemyType
}): EnemyRegenerationPresentationRoute {
  return getEnemyType(input.type) === 'azure-core' ? 'azure-core-regeneration' : 'guard-regeneration'
}
```

## Scene Adapter

`GameplayScene.tryRegenerateEnemy()` keeps all side effects:

- killing tweens
- resetting position
- `configureAzureCore()`
- body enable/disable
- scale and alpha setup
- regeneration tween and `onComplete`
- guard visibility/body/texture/animation reset
- status message

The scene should only call the domain rule and branch on the returned route.

## Tests

Add co-located domain tests covering:

- Azure Core returns `'azure-core-regeneration'`.
- Guard returns `'guard-regeneration'`.
- Missing type defaults to `'guard-regeneration'`, preserving default guard semantics.

## Validation

- Focused RED/GREEN test for `src/domain/enemy/enemyRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change regeneration delay or safe-distance rules.
- Do not change Azure Core regeneration tween values.
- Do not change guard texture/animation or stage-theme branches.
- Do not combine this with defeat presentation routing; regeneration and defeat are separate semantic decisions.
