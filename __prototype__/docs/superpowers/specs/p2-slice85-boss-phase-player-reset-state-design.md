# P2 Slice 85: Boss Phase Player Reset State Rule

## Target Behavior

When the boss is hit but not defeated, `GameplayScene.hitBossPrototype()` resets a small set of player state before sending the player back to the stage spawn and restarting the next boss pattern.

Move only the pure state values into the boss domain:

- player health becomes the configured max health
- melee attack state becomes inactive
- Homing Attack state becomes inactive
- attack readiness becomes ready

Keep all Phaser and scene-owned side effects in `GameplayScene`:

- `updateHealthText()`
- `homingTarget = undefined`
- reticle visibility
- homing collision
- visual state
- gravity direction
- player position and velocity
- camera flash/centering
- delayed boss pattern restart

## Domain Shape

Add to `src/domain/boss/bossRules.ts`:

```ts
export type BossPhasePlayerResetState = {
  health: number
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export function getBossPhasePlayerResetState(input: {
  maxHealth: number
}): BossPhasePlayerResetState
```

`maxHealth` is an input instead of importing `PLAYER_MAX_HEALTH` into boss domain, keeping the bounded contexts loosely coupled.

## Adapter Shape

In `GameplayScene.hitBossPrototype()`:

```ts
const playerResetState = getBossPhasePlayerResetState({
  maxHealth: PLAYER_MAX_HEALTH,
})
this.playerHealth = playerResetState.health
this.isAttacking = playerResetState.attacking
this.isHomingAttacking = playerResetState.homingAttacking
this.attackReady = playerResetState.attackReady
```

All surrounding side effects and ordering stay unchanged.

## Test Plan

Add co-located tests in `src/domain/boss/bossRules.test.ts`:

- default boss phase player reset state uses the supplied max health
- reset state returns a fresh object
- explicit max health values are preserved

## Validation

- RED: focused boss test fails before production implementation.
- GREEN: focused boss test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
