# Audio SFX Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing audio system with a typed gameplay SFX foundation controlled by Settings SFX volume.

**Architecture:** Keep pure SFX ids, volume rules, and action mapping in `src/domain/audio/`. Keep command construction in `src/application/audio/`, and keep `HTMLAudioElement` preloading/playback in `browserAudioController`. Copy only audio assets from `__prototype__/public`; do not import Prototype runtime code.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Vite public assets, browser `HTMLAudioElement`.

---

## File Structure

- Modify `src/domain/audio/audioAssets.ts`: add gameplay SFX ids and public paths.
- Modify `src/domain/audio/audioPolicy.ts`: add gameplay SFX action types and mappings.
- Modify `src/domain/audio/audioPolicy.test.ts`: cover full SFX manifest and gameplay action mapping.
- Modify `src/application/audio/audioCommands.ts`: accept the shared SFX action union.
- Modify `src/application/audio/audioCommands.test.ts`: cover gameplay SFX command volume and suppression.
- Modify `src/application/audio/browserAudioController.test.ts`: verify all SFX assets preload.
- Create `src/domain/audio/audioAssetsPublic.test.ts`: verify declared SFX files exist in root public assets.
- Copy `hit.wav`, `coin.wav`, `death.wav`, `checkpoint.wav`, `armor-step.wav`, and `goal.wav` into `public/assets/audio/sfx/`.

## Task 1: Domain SFX Catalog And Actions

**Files:**
- Modify: `src/domain/audio/audioAssets.ts`
- Modify: `src/domain/audio/audioPolicy.ts`
- Test: `src/domain/audio/audioPolicy.test.ts`

- [ ] **Step 1: Write failing tests**

Add gameplay SFX entries to the existing manifest expectation:

```ts
expect(SFX_ASSETS).toEqual({
  'ui-move': '/assets/audio/sfx/ui-move.wav',
  'ui-confirm': '/assets/audio/sfx/ui-confirm.wav',
  'ui-back': '/assets/audio/sfx/ui-back.wav',
  hit: '/assets/audio/sfx/hit.wav',
  coin: '/assets/audio/sfx/coin.wav',
  death: '/assets/audio/sfx/death.wav',
  checkpoint: '/assets/audio/sfx/checkpoint.wav',
  'armor-step': '/assets/audio/sfx/armor-step.wav',
  goal: '/assets/audio/sfx/goal.wav',
})
```

Add gameplay action mapping assertions:

```ts
expect(getSfxForAction('player-hit')).toBe('hit')
expect(getSfxForAction('coin-collected')).toBe('coin')
expect(getSfxForAction('player-death')).toBe('death')
expect(getSfxForAction('checkpoint-activated')).toBe('checkpoint')
expect(getSfxForAction('player-footstep')).toBe('armor-step')
expect(getSfxForAction('goal-opened')).toBe('goal')
```

- [ ] **Step 2: Run red test**

Run: `npm run test -- src/domain/audio/audioPolicy.test.ts`

Expected: FAIL because the gameplay SFX ids and action mappings do not exist.

- [ ] **Step 3: Implement domain catalog and mappings**

In `src/domain/audio/audioAssets.ts`, extend `SFX_ASSETS` with the six gameplay paths.

In `src/domain/audio/audioPolicy.ts`, define:

```ts
export type UiSfxAction = 'move' | 'confirm' | 'back'
export type GameplaySfxAction =
  | 'player-hit'
  | 'coin-collected'
  | 'player-death'
  | 'checkpoint-activated'
  | 'player-footstep'
  | 'goal-opened'
export type SfxAction = UiSfxAction | GameplaySfxAction
```

Update `getSfxForAction(action: SfxAction): SfxId` to map each gameplay action to its asset id.

- [ ] **Step 4: Run green test**

Run: `npm run test -- src/domain/audio/audioPolicy.test.ts`

Expected: PASS.

## Task 2: Application Command Coverage

**Files:**
- Modify: `src/application/audio/audioCommands.ts`
- Test: `src/application/audio/audioCommands.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests:

```ts
expect(createSfxCommand('coin-collected', { ...DEFAULT_SETTINGS, masterVolume: 50, sfxVolume: 40 })).toEqual({
  type: 'play-sfx',
  sound: 'coin',
  volume: 0.2,
})
expect(createSfxCommand('player-death', { ...DEFAULT_SETTINGS, sfxVolume: 0 })).toBeNull()
```

- [ ] **Step 2: Run red test**

Run: `npm run test -- src/application/audio/audioCommands.test.ts`

Expected: FAIL because `createSfxCommand` only accepts `UiSfxAction`.

- [ ] **Step 3: Implement command type widening**

Change the import and signature in `src/application/audio/audioCommands.ts` to use `type SfxAction` instead of `type UiSfxAction`:

```ts
export function createSfxCommand(action: SfxAction, settings: GameSettings): PlaySfxCommand | null
```

- [ ] **Step 4: Run green test**

Run: `npm run test -- src/application/audio/audioCommands.test.ts`

Expected: PASS.

## Task 3: Adapter And Asset Availability

**Files:**
- Modify: `src/application/audio/browserAudioController.test.ts`
- Create: `src/domain/audio/audioAssetsPublic.test.ts`
- Copy assets into `public/assets/audio/sfx/`

- [ ] **Step 1: Write failing preload and public asset tests**

Update the controller preload expectation to include all SFX paths.

Create `src/domain/audio/audioAssetsPublic.test.ts`:

```ts
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SFX_ASSETS } from './audioAssets'

const publicRoot = fileURLToPath(new URL('../../../public', import.meta.url))

describe('public audio assets', () => {
  it('contains every declared sfx asset', () => {
    for (const assetPath of Object.values(SFX_ASSETS)) {
      expect(existsSync(`${publicRoot}${assetPath}`), assetPath).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run red tests**

Run: `npm run test -- src/application/audio/browserAudioController.test.ts src/domain/audio/audioAssetsPublic.test.ts`

Expected: FAIL because the missing gameplay SFX assets are not copied and the controller preload list is not updated.

- [ ] **Step 3: Copy assets and rely on manifest-driven preload**

Copy:

```text
__prototype__/public/assets/audio/sfx/hit.wav -> public/assets/audio/sfx/hit.wav
__prototype__/public/assets/audio/sfx/coin.wav -> public/assets/audio/sfx/coin.wav
__prototype__/public/assets/audio/sfx/death.wav -> public/assets/audio/sfx/death.wav
__prototype__/public/assets/audio/sfx/checkpoint.wav -> public/assets/audio/sfx/checkpoint.wav
__prototype__/public/assets/audio/sfx/armor-step.wav -> public/assets/audio/sfx/armor-step.wav
__prototype__/public/assets/audio/sfx/goal.wav -> public/assets/audio/sfx/goal.wav
```

No production adapter change should be required because `browserAudioController` already iterates over `Object.entries(SFX_ASSETS)`.

- [ ] **Step 4: Run green tests**

Run: `npm run test -- src/application/audio/browserAudioController.test.ts src/domain/audio/audioAssetsPublic.test.ts`

Expected: PASS.

## Task 4: Final Verification

**Files:**
- All files from Tasks 1-3.

- [ ] **Step 1: Run focused audio suite**

Run: `npm run test -- src/domain/audio/audioPolicy.test.ts src/application/audio/audioCommands.test.ts src/application/audio/browserAudioController.test.ts src/domain/audio/audioAssetsPublic.test.ts`

Expected: PASS.

- [ ] **Step 2: Run required checks**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected: all pass. `npm run build` may keep the existing chunk-size warning.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-13-audio-sfx-foundation-design.md docs/superpowers/plans/2026-07-13-audio-sfx-foundation.md src/domain/audio/audioAssets.ts src/domain/audio/audioPolicy.ts src/domain/audio/audioPolicy.test.ts src/application/audio/audioCommands.ts src/application/audio/audioCommands.test.ts src/application/audio/browserAudioController.test.ts src/domain/audio/audioAssetsPublic.test.ts public/assets/audio/sfx/hit.wav public/assets/audio/sfx/coin.wav public/assets/audio/sfx/death.wav public/assets/audio/sfx/checkpoint.wav public/assets/audio/sfx/armor-step.wav public/assets/audio/sfx/goal.wav
git commit -m "feat: add gameplay sfx audio foundation"
```
