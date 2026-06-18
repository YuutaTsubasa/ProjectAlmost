# P2 Slice 73: Stage Clear State Rule

## Target Behavior

When a stage is completed for the first time, gameplay should keep the existing state transition:

- `stageCleared` becomes `true`
- player attack state stops
- Homing Attack state stops
- attack input is no longer ready

The Phaser scene must still own all side effects: sound, homing target clearing, reticle visibility, blink cleanup, player velocity/acceleration, enemy velocity, goal tint, HUD dispatch, status messages, visual state, and animation.

## Boundary

Domain:

- `src/domain/stage/stageClearRules.ts`
- pure state transition values
- no Phaser, Svelte, DOM, timers, sprites, HUD events, or i18n imports

Adapter:

- `src/game/scenes/GameplayScene.ts`
- applies the returned state values
- keeps all existing side effects and early return behavior

## Proposed API

```ts
export type StageClearState = {
  stageCleared: boolean
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export function getStageClearState(): StageClearState
```

## TDD Cases

- returns the current clear-state transition values
- returned object is a fresh value so callers cannot mutate a shared singleton

## Validation

- `npm run test -- src/domain/stage/stageClearRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
