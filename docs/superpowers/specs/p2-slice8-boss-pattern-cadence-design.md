# Boss Pattern Cadence Design Spec

## Purpose

Extract the boss projectile pattern timer cadence from `GameplayScene.ts` into the pure boss domain rules.

This is P2 Slice 8 of the `GameplayScene` domain extraction effort. The slice keeps Phaser timer creation, boss pattern generation, shot indexing, and projectile spawning inside `GameplayScene`, while moving the phase-to-delay formula into `src/domain/boss/bossRules.ts`.

## Problem

`GameplayScene.startBossPattern()` currently embeds the boss pattern timer formula:

```ts
Math.max(540, 980 - this.bossPhase * 90)
```

This formula is pure boss tuning data:

- phase 0 fires every `980ms`.
- each phase subtracts `90ms`.
- the delay clamps at a minimum of `540ms`.

Keeping the formula in the scene makes it harder to test and easier to drift when boss phase logic changes.

## Design

Add to `src/domain/boss/bossRules.ts`:

```ts
export const BOSS_PATTERN_BASE_DELAY_MS = 980
export const BOSS_PATTERN_PHASE_DELAY_STEP_MS = 90
export const BOSS_PATTERN_MIN_DELAY_MS = 540

export function getBossPatternDelayMs(input: { phase: number }): number
```

Behavior:

- returns `max(minDelay, baseDelay - phase * phaseStep)`.
- preserves all current numeric values.

`GameplayScene.startBossPattern()` calls `getBossPatternDelayMs({ phase: this.bossPhase })` for the timer delay.

## Non-Goals

This slice does not:

- change boss pattern timing values.
- change boss pattern gating.
- change shot index behavior.
- change `fireBossVolley()` projectile angles, counts, or speeds.
- change Phaser timer creation or callback behavior.

## Tests

Add tests to `src/domain/boss/bossRules.test.ts`:

- phase `0`, `1`, `2`, and `3` return `980`, `890`, `800`, and `710`.
- phase `4` returns `620`, proving it has not clamped yet.
- phase `5` returns `540`, proving clamp begins.
- high phases still return `540`.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
