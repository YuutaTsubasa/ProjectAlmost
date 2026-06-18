# P2 Slice 72: Player Respawn State Rule

## Target Behavior

Player respawn should keep the existing reset values:

- not hurting
- not invulnerable
- not attacking
- not Homing Attacking
- not crouching
- not dead
- attack ready
- full health
- cleared jump buffer
- one remaining air jump

The Phaser scene must still own the side effects: clearing the homing target, HUD updates, blink cleanup, collision, visual state, gravity direction, position, velocity, body enable, animation, enemy freeze, status messages, camera, and boss pattern restart timers.

## Boundary

Domain:

- `src/domain/player/hurtRules.ts`
- pure respawn state values
- no Phaser, Svelte, DOM, timers, sprites, or runtime mutation

Adapter:

- `src/game/scenes/GameplayScene.ts`
- applies the returned values to scene fields
- uses `this.time.now` for `lastGroundedAt`
- keeps all Phaser side effects unchanged

## Proposed API

```ts
export const PLAYER_MAX_HEALTH = 3

export type PlayerRespawnState = {
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
  attackReady: boolean
  health: number
  jumpBufferedUntil: number
  remainingAirJumps: number
}

export function getPlayerRespawnState(input?: {
  maxHealth?: number
}): PlayerRespawnState
```

## TDD Cases

- default respawn state matches current scene reset values
- `PLAYER_MAX_HEALTH === 3`
- explicit `maxHealth` controls returned health for boundary checks

## Validation

- `npm run test -- src/domain/player/hurtRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
