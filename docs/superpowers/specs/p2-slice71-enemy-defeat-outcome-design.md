# P2 Slice 71: Enemy Defeat Outcome Rule

## Target Behavior

When a non-boss enemy is defeated, gameplay should keep the existing domain decisions:

- enemies that count for score add `1` to the defeated enemy counter
- enemies that do not count for score add `0`
- enemies with `respawnPolicy: 'regenerate'` should schedule regeneration
- enemies with `respawnPolicy: 'persistent'` should not schedule regeneration

The Phaser scene must still own sprite state, sound, reticle visibility, animation, tweens, status messages, timers, and the actual regeneration scheduling.

## Boundary

Domain:

- `src/domain/enemy/enemyRules.ts`
- pure defeat outcome based on existing enemy rule input
- no Phaser, Svelte, DOM, timers, sprites, or runtime mutation

Adapter:

- `src/game/scenes/GameplayScene.ts`
- calls the domain outcome once when a non-boss enemy is defeated
- applies `scoreDelta`
- schedules regeneration only when `shouldRegenerate` is true

## Proposed API

```ts
export type EnemyDefeatOutcome = {
  scoreDelta: number
  respawnPolicy: EnemyRespawnPolicy
  shouldRegenerate: boolean
}

export function getEnemyDefeatOutcome(input: EnemyRuleInput): EnemyDefeatOutcome
```

## TDD Cases

- default guard -> score delta `1`, persistent, no regeneration
- default Azure Core -> score delta `0`, regenerate, should regenerate
- explicit `countsForScore: false` on guard -> score delta `0`
- explicit `countsForScore: true` on Azure Core -> score delta `1`
- explicit `respawnPolicy: 'persistent'` on Azure Core -> no regeneration
- explicit `respawnPolicy: 'regenerate'` on guard -> should regenerate

## Validation

- `npm run test -- src/domain/enemy/enemyRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
