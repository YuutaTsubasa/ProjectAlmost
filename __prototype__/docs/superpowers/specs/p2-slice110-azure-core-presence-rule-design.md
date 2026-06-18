# P2 Slice 110: Azure Core Enemy Presence Rule

## Target Behavior

Move the "stage contains an Azure Core enemy" predicate out of `GameplayScene.getInitialStatusMessage()` and into the pure enemy domain.

The behavior must remain unchanged:

- Stages with at least one Azure Core enemy use the Azure-detected initial status.
- Stages without Azure Core enemies use the normal initial status.
- Enemies without an explicit type keep the existing default guard semantics and do not count as Azure Cores.

## Domain Boundary

Add a pure predicate in `src/domain/enemy/enemyRules.ts`.

The rule only answers whether an enemy list contains an Azure Core. It must not know about i18n keys, HUD status messages, Phaser scenes, sprites, stage instances, or rendering.

Suggested shape:

```ts
export function hasAzureCoreEnemy(input: {
  enemies: readonly EnemyRuleInput[]
}): boolean {
  return input.enemies.some((enemy) => getEnemyType(enemy.type) === 'azure-core')
}
```

## Scene Adapter

`GameplayScene.getInitialStatusMessage()` keeps the UI/i18n mapping:

```ts
return hasAzureCoreEnemy({ enemies: this.stage.enemies })
  ? 'status.azureDetected'
  : 'status.initial'
```

## Tests

Add co-located domain tests covering:

- Empty enemy list returns `false`.
- Guard-only enemy list returns `false`.
- Missing type returns `false`, preserving default guard semantics.
- Any Azure Core in the list returns `true`.

## Validation

- Focused RED/GREEN test for `src/domain/enemy/enemyRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not move translation keys into the domain.
- Do not change the initial status message values.
- Do not change enemy default type semantics.
