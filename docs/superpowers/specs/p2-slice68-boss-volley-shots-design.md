# P2 Slice 68: Boss Volley Shots Rule

## Target Behavior

Boss projectile volleys should keep the existing phase-specific patterns while moving the shot decision into the pure boss domain:

- phase 0: one aimed shot at speed `330`
- phase 1: three leftward sweep shots at speed `350`
- phase 2: two biased leftward shots at speed `390`, plus an aimed shot at speed `360` on even shot indexes
- phase 3: five radial shots at speed `390`
- unknown phases: no shots

The Phaser scene must still own boss visibility checks, projectile creation, velocity application, blend mode, depth, lifetime metadata, and runtime arrays.

## Boundary

Domain:

- `src/domain/boss/bossRules.ts`
- pure shot list calculation
- no Phaser, Svelte, DOM, timers, sprites, or runtime mutation

Adapter:

- `src/game/scenes/GameplayScene.ts`
- calculates `aimedAngle` from Phaser player/boss positions
- asks domain for shots
- loops over returned shots and calls `spawnBossProjectile(...)`

## Proposed API

```ts
export type BossVolleyShot = {
  angle: number
  speed: number
}

export function getBossVolleyShots(input: {
  phase: number
  shotIndex: number
  aimedAngle: number
}): BossVolleyShot[]
```

## TDD Cases

- phase 0 returns one aimed shot at speed `330`
- phase 1 uses `Math.sin(shotIndex * 0.72) * 0.36` and offsets `[-0.2, 0, 0.2]` at speed `350`
- phase 2 even shot returns two biased shots plus an aimed shot
- phase 2 odd shot returns only two biased shots
- phase 3 returns five radial shots using `Math.PI / 2 + (Math.PI * index) / 4 + shotIndex * 0.1`
- unknown phase returns an empty array

## Validation

- `npm run test -- src/domain/boss/bossRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
