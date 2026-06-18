# P2 Slice 74: Player Hurt Recovery State Rule

## Target Behavior

After the short hurt recovery delay, gameplay should keep the existing state transition:

- player is no longer hurting
- attack input is ready again

The Phaser scene must still own the timer, damage application, invulnerability timer, blink cleanup, status messages, and all animation/physics side effects.

## Boundary

Domain:

- `src/domain/player/hurtRules.ts`
- pure recovery state values
- no Phaser, Svelte, DOM, timers, sprites, or runtime mutation

Adapter:

- `src/game/scenes/GameplayScene.ts`
- applies the returned values inside the existing delayed callback
- keeps the delay duration and callback ownership unchanged

## Proposed API

```ts
export type PlayerHurtRecoveryState = {
  hurting: boolean
  attackReady: boolean
}

export function getPlayerHurtRecoveryState(): PlayerHurtRecoveryState
```

## TDD Cases

- returns `hurting: false`
- returns `attackReady: true`
- returns a fresh state object so callers cannot mutate a shared singleton

## Validation

- `npm run test -- src/domain/player/hurtRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
