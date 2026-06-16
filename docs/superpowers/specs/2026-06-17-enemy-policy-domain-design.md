# Enemy Policy Domain Design Spec

## Purpose

Extract enemy scoring and respawn policy decisions from `GameplayScene.ts` into pure domain code.

This is P2 Slice 2 of the `GameplayScene` domain extraction effort. The slice keeps Phaser sprite lifecycle, tweens, timers, and actual regeneration side effects inside the scene, while moving enemy policy decisions into `src/domain/enemy/`.

## Problem

Before this slice, `GameplayScene` directly encoded enemy domain rules:

- Azure Cores defaulted to `regenerate`.
- Guards defaulted to `persistent`.
- Azure Cores defaulted to not counting for score.
- Guards defaulted to counting for score.
- enemy respawn delay defaulted to `1400ms`.
- regeneration was delayed while the player was dead or closer than `140px`.

Those are gameplay rules, not rendering or physics rules. Keeping them inside the Phaser scene made future enemy types harder to add and harder to test.

## Design

Create `src/domain/enemy/enemyRules.ts`.

It owns:

- `EnemyType`
- `EnemyRespawnPolicy`
- `EnemyRegenerationDecision`
- `enemyDefinitions`
- `DEFAULT_ENEMY_REGENERATE_DELAY_MS`
- `DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE`
- `getEnemyRespawnPolicy()`
- `enemyCountsForScore()`
- `getEnemyRespawnDelayMs()`
- `getEnemyRegenerationDecision()`

The domain layer does not import `stageTypes`, Phaser, Svelte, DOM APIs, or `GameplayScene`.

The scene remains responsible for adapting `EnemyPoint` into domain inputs and applying Phaser side effects.

## Enemy Definition Defaults

Enemy defaults live in `enemyDefinitions`:

```ts
guard: {
  respawnPolicy: 'persistent',
  countsForScore: true,
}

'azure-core': {
  respawnPolicy: 'regenerate',
  countsForScore: false,
}
```

Stage data can still override:

- `respawnPolicy`
- `countsForScore`
- `respawnDelayMs`

Overrides always win over enemy defaults.

## Regeneration Decision

`getEnemyRegenerationDecision()` returns:

- `skip`
  - stage is already cleared
  - enemy is not currently defeated
- `delay`
  - player is dead
  - player is closer than the safe distance
- `regenerate`
  - enemy is defeated
  - stage is not cleared
  - player is alive
  - player distance is at least the safe distance

The domain receives `playerDistance` as a number. Phaser remains responsible for calculating distance from sprite positions.

## GameplayScene Adapter

`GameplayScene` now delegates:

- `enemyRespawnPolicy(point)` -> `getEnemyRespawnPolicy(point)`
- `enemyCountsForScore(point)` -> `enemyCountsForScore(point)`
- `scheduleEnemyRegeneration(enemy)` -> `getEnemyRespawnDelayMs(enemy.point)`
- `tryRegenerateEnemy(enemy)` -> `getEnemyRegenerationDecision(...)`

The scene still owns:

- `this.time.delayedCall(...)`
- `Phaser.Math.Distance.Between(...)`
- sprite position and body state
- Azure Core tweens
- guard texture/animation restoration
- status messages

## Tests

`src/domain/enemy/enemyRules.test.ts` covers:

- explicit stage `respawnPolicy` overrides.
- default Azure Core and guard respawn policies.
- explicit `countsForScore` overrides.
- default Azure Core and guard scoring behavior.
- explicit respawn delay override.
- default respawn delay.
- regeneration skip when stage is cleared.
- regeneration skip when enemy is not defeated.
- regeneration delay when player is dead.
- regeneration delay when player is too close.
- regeneration when the player is far enough away.

## Non-Goals

This slice does not:

- change enemy behavior.
- change stage JSON shape.
- change enemy spawn position calculation.
- extract patrol behavior.
- extract Azure Core visuals or Homing behavior.
- introduce new enemy types.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Manual gameplay smoke check is recommended when touching regeneration-heavy stages, especially World 02 routes that rely on Azure Core regeneration.
