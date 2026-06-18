# P2 Slice 69: Boss Projectile Velocity Rule

## Target Behavior

Boss projectile spawn should keep the existing velocity formula while moving the pure vector calculation into the boss projectile domain:

```ts
x = Math.cos(angle) * speed
y = Math.sin(angle) * speed
```

The Phaser scene must still own sprite creation, disabling gravity, applying the velocity, depth, blend mode, lifetime metadata, and runtime array insertion.

## Boundary

Domain:

- `src/domain/boss/projectileRules.ts`
- pure angle/speed to velocity vector calculation
- no Phaser, Svelte, DOM, timers, or sprite imports

Adapter:

- `src/game/scenes/GameplayScene.ts`
- asks the domain for `{ x, y }`
- applies it with `projectile.setVelocity(...)`

## Proposed API

```ts
export type BossProjectileVelocity = {
  x: number
  y: number
}

export function getBossProjectileVelocity(input: {
  angle: number
  speed: number
}): BossProjectileVelocity
```

## TDD Cases

- angle `0` moves right at full speed
- angle `Math.PI / 2` moves down at full speed
- angle `Math.PI` moves left at full speed
- diagonal angle uses `cos/sin * speed`
- zero speed returns zero velocity

## Validation

- `npm run test -- src/domain/boss/projectileRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
