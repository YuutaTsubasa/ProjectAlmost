# Gameplay BGM and Result BGM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement prototype-parity gameplay BGM, boss-stage BGM, result BGM, and paused gameplay music ducking in the rebuild.

**Architecture:** Keep audio side effects centralized in `App.svelte` and the existing browser audio controller. Add pure domain music policy for gameplay context, then wire Svelte reactive state to `createMusicCommand` without letting Phaser control music.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Vite, browser `HTMLAudioElement`, existing `BrowserAudioController`.

---

## File Structure

- `public/assets/audio/`: receives copied prototype music files for result and boss tracks.
- `src/domain/audio/audioAssets.ts`: declares all public music asset paths.
- `src/domain/audio/audioPolicy.ts`: pure music policy for regular screens and gameplay context.
- `src/domain/audio/audioPolicy.test.ts`: verifies manifest, normal gameplay BGM, boss BGM, result BGM, and pause ducking.
- `src/application/audio/audioCommands.ts`: adapts the pure policy to existing `set-music` commands.
- `src/application/audio/audioCommands.test.ts`: verifies command creation for gameplay contexts.
- `src/application/progression/appStageProgressionWiring.test.ts`: source-contract test for App BGM wiring.
- `src/ui/gameplay/GameplayScreen.svelte`: exposes reactive gameplay music state changes to App.
- `src/ui/gameplay/gameplayScreenStageClear.test.ts`: source-contract test for result/pause callback wiring.
- `src/App.svelte`: owns audio side effects and passes gameplay music context to the command factory.

---

### Task 1: Music Assets and Manifest

**Files:**
- Copy into: `public/assets/audio/game_result.mp3`
- Copy into: `public/assets/audio/world01_boss.mp3`
- Copy into: `public/assets/audio/world02_boss.mp3`
- Copy into: `public/assets/audio/world03_boss.mp3`
- Copy into: `public/assets/audio/world04_boss.mp3`
- Copy into: `public/assets/audio/world05_boss.mp3`
- Copy into: `public/assets/audio/world06_boss.mp3`
- Modify: `src/domain/audio/audioAssets.ts`
- Modify: `src/domain/audio/audioPolicy.test.ts`
- Test: `src/domain/audio/audioPolicy.test.ts`
- Test: `src/domain/audio/audioAssetsPublic.test.ts`

- [ ] **Step 1: Write the failing manifest test**

Update the `MUSIC_ASSETS` expectation in `src/domain/audio/audioPolicy.test.ts`:

```ts
expect(MUSIC_ASSETS).toEqual({
  title: '/assets/audio/titlescreen.mp3',
  result: '/assets/audio/game_result.mp3',
  world01Bgm: '/assets/audio/world01_bgm.mp3',
  world01Boss: '/assets/audio/world01_boss.mp3',
  world02Bgm: '/assets/audio/world02_bgm.mp3',
  world02Boss: '/assets/audio/world02_boss.mp3',
  world03Bgm: '/assets/audio/world03_bgm.mp3',
  world03Boss: '/assets/audio/world03_boss.mp3',
  world04Bgm: '/assets/audio/world04_bgm.mp3',
  world04Boss: '/assets/audio/world04_boss.mp3',
  world05Bgm: '/assets/audio/world05_bgm.mp3',
  world05Boss: '/assets/audio/world05_boss.mp3',
  world06Bgm: '/assets/audio/world06_bgm.mp3',
  world06Boss: '/assets/audio/world06_boss.mp3',
  world01Map: '/assets/audio/world01_map.mp3',
  world02Map: '/assets/audio/world02_map.mp3',
  world03Map: '/assets/audio/world03_map.mp3',
  world04Map: '/assets/audio/world04_map.mp3',
  world05Map: '/assets/audio/world05_map.mp3',
  world06Map: '/assets/audio/world06_map.mp3',
})
```

- [ ] **Step 2: Run red manifest tests**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts src/domain/audio/audioAssetsPublic.test.ts
```

Expected: FAIL because `MUSIC_ASSETS` does not include `result` or boss tracks.

- [ ] **Step 3: Copy prototype audio assets**

Copy only static audio assets from prototype public assets:

```bash
cp __prototype__/public/assets/audio/game_result.mp3 public/assets/audio/game_result.mp3
cp __prototype__/public/assets/audio/world01_boss.mp3 public/assets/audio/world01_boss.mp3
cp __prototype__/public/assets/audio/world02_boss.mp3 public/assets/audio/world02_boss.mp3
cp __prototype__/public/assets/audio/world03_boss.mp3 public/assets/audio/world03_boss.mp3
cp __prototype__/public/assets/audio/world04_boss.mp3 public/assets/audio/world04_boss.mp3
cp __prototype__/public/assets/audio/world05_boss.mp3 public/assets/audio/world05_boss.mp3
cp __prototype__/public/assets/audio/world06_boss.mp3 public/assets/audio/world06_boss.mp3
```

- [ ] **Step 4: Extend `MUSIC_ASSETS`**

Update `src/domain/audio/audioAssets.ts`:

```ts
export const MUSIC_ASSETS = {
  title: '/assets/audio/titlescreen.mp3',
  result: '/assets/audio/game_result.mp3',
  world01Bgm: '/assets/audio/world01_bgm.mp3',
  world01Boss: '/assets/audio/world01_boss.mp3',
  world02Bgm: '/assets/audio/world02_bgm.mp3',
  world02Boss: '/assets/audio/world02_boss.mp3',
  world03Bgm: '/assets/audio/world03_bgm.mp3',
  world03Boss: '/assets/audio/world03_boss.mp3',
  world04Bgm: '/assets/audio/world04_bgm.mp3',
  world04Boss: '/assets/audio/world04_boss.mp3',
  world05Bgm: '/assets/audio/world05_bgm.mp3',
  world05Boss: '/assets/audio/world05_boss.mp3',
  world06Bgm: '/assets/audio/world06_bgm.mp3',
  world06Boss: '/assets/audio/world06_boss.mp3',
  world01Map: '/assets/audio/world01_map.mp3',
  world02Map: '/assets/audio/world02_map.mp3',
  world03Map: '/assets/audio/world03_map.mp3',
  world04Map: '/assets/audio/world04_map.mp3',
  world05Map: '/assets/audio/world05_map.mp3',
  world06Map: '/assets/audio/world06_map.mp3',
} as const
```

- [ ] **Step 5: Run green manifest tests**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts src/domain/audio/audioAssetsPublic.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/assets/audio/game_result.mp3 public/assets/audio/world01_boss.mp3 public/assets/audio/world02_boss.mp3 public/assets/audio/world03_boss.mp3 public/assets/audio/world04_boss.mp3 public/assets/audio/world05_boss.mp3 public/assets/audio/world06_boss.mp3 src/domain/audio/audioAssets.ts src/domain/audio/audioPolicy.test.ts
git commit -m "feat: add gameplay bgm assets"
```

---

### Task 2: Pure Gameplay Music Policy

**Files:**
- Modify: `src/domain/audio/audioPolicy.ts`
- Modify: `src/domain/audio/audioPolicy.test.ts`
- Test: `src/domain/audio/audioPolicy.test.ts`

- [ ] **Step 1: Write failing policy tests**

Add imports in `src/domain/audio/audioPolicy.test.ts`:

```ts
import {
  MUSIC_ASSETS,
  SFX_ASSETS,
  computeMusicVolume,
  computeSfxVolume,
  getGameplayMusic,
  getMusicForScreen,
  getSfxForAction,
} from './audioPolicy'
```

Replace the gameplay null test with:

```ts
it('maps gameplay stages to normal, boss, result, and paused prototype music', () => {
  expect(getGameplayMusic({
    stageId: '1-1',
    isBoss: false,
    resultVisible: false,
    paused: false,
  }, DEFAULT_SETTINGS)).toEqual({
    track: 'world01Bgm',
    volume: 0.336,
  })

  expect(getGameplayMusic({
    stageId: '1-6',
    isBoss: true,
    resultVisible: false,
    paused: false,
  }, DEFAULT_SETTINGS)).toEqual({
    track: 'world01Boss',
    volume: 0.336,
  })

  expect(getGameplayMusic({
    stageId: '6-6',
    isBoss: true,
    resultVisible: false,
    paused: true,
  }, DEFAULT_SETTINGS)).toEqual({
    track: 'world06Boss',
    volume: 0.1512,
  })

  expect(getGameplayMusic({
    stageId: '3-4',
    isBoss: false,
    resultVisible: true,
    paused: false,
  }, DEFAULT_SETTINGS)).toEqual({
    track: 'result',
    volume: 0.336,
  })
})
```

Keep the existing non-gameplay screen music tests unchanged.

- [ ] **Step 2: Run red policy test**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts
```

Expected: FAIL because `getGameplayMusic` does not exist.

- [ ] **Step 3: Implement pure gameplay policy**

Update `src/domain/audio/audioPolicy.ts`:

```ts
import type { AppScreen } from '../app/appFlow'
import type { StageId } from '../data/worlds/worldTypes'
import type { GameSettings } from '../settings/settings'
import { MUSIC_ASSETS, SFX_ASSETS, type MusicTrackId, type SfxId } from './audioAssets'
```

Add boss track list and gameplay context near existing track lists:

```ts
const GAMEPLAY_PAUSED_VOLUME_MULTIPLIER = 0.45
const WORLD_BOSS_TRACKS: readonly MusicTrackId[] = [
  'world01Boss',
  'world02Boss',
  'world03Boss',
  'world04Boss',
  'world05Boss',
  'world06Boss',
]

export type GameplayMusicContext = {
  stageId: StageId
  isBoss: boolean
  resultVisible: boolean
  paused: boolean
}

function getWorldIndexFromStageId(stageId: StageId): number {
  return Math.max(0, Number(stageId.split('-')[0]) - 1)
}
```

Add the pure resolver:

```ts
export function getGameplayMusic(
  context: GameplayMusicContext,
  settings: GameSettings,
): MusicDecision {
  if (context.resultVisible) {
    return { track: 'result', volume: computeMusicVolume(settings) }
  }

  const worldIndex = getWorldIndexFromStageId(context.stageId)
  const track = context.isBoss
    ? WORLD_BOSS_TRACKS[worldIndex] ?? 'world01Boss'
    : WORLD_BGM_TRACKS[worldIndex] ?? 'world01Bgm'
  const multiplier = context.paused ? GAMEPLAY_PAUSED_VOLUME_MULTIPLIER : 1

  return { track, volume: computeMusicVolume(settings, multiplier) }
}
```

Leave `getMusicForScreen` returning `null` for gameplay until Task 3, so this task only proves the pure gameplay policy.

- [ ] **Step 4: Run green policy test**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/audio/audioPolicy.ts src/domain/audio/audioPolicy.test.ts
git commit -m "feat: add gameplay music policy"
```

---

### Task 3: Music Command Context

**Files:**
- Modify: `src/application/audio/audioCommands.ts`
- Modify: `src/application/audio/audioCommands.test.ts`
- Test: `src/application/audio/audioCommands.test.ts`

- [ ] **Step 1: Write failing command tests**

Update `src/application/audio/audioCommands.test.ts`.

Replace the gameplay null test:

```ts
it('creates gameplay music commands from explicit gameplay context', () => {
  expect(createMusicCommand(
    { type: 'gameplay', stageId: '1-1', runId: 0 },
    DEFAULT_SETTINGS,
    { stageId: '1-1', isBoss: false, resultVisible: false, paused: false },
  )).toEqual({
    type: 'set-music',
    track: 'world01Bgm',
    volume: 0.336,
  })

  expect(createMusicCommand(
    { type: 'gameplay', stageId: '1-6', runId: 0 },
    DEFAULT_SETTINGS,
    { stageId: '1-6', isBoss: true, resultVisible: false, paused: false },
  )).toEqual({
    type: 'set-music',
    track: 'world01Boss',
    volume: 0.336,
  })

  expect(createMusicCommand(
    { type: 'gameplay', stageId: '1-6', runId: 0 },
    DEFAULT_SETTINGS,
    { stageId: '1-6', isBoss: true, resultVisible: true, paused: false },
  )).toEqual({
    type: 'set-music',
    track: 'result',
    volume: 0.336,
  })
})
```

- [ ] **Step 2: Run red command test**

Run:

```bash
npm run test -- src/application/audio/audioCommands.test.ts
```

Expected: FAIL because `createMusicCommand` does not accept gameplay context.

- [ ] **Step 3: Extend command factory**

Update `src/application/audio/audioCommands.ts` imports:

```ts
import {
  computeSfxVolume,
  getGameplayMusic,
  getMusicForScreen,
  getSfxForAction,
  type GameplayMusicContext,
  type SfxAction,
} from '../../domain/audio/audioPolicy'
```

Replace `createMusicCommand`:

```ts
export function createMusicCommand(
  screen: AppScreen,
  settings: GameSettings,
  gameplayContext?: GameplayMusicContext,
): SetMusicCommand | null {
  const decision = screen.type === 'gameplay' && gameplayContext
    ? getGameplayMusic(gameplayContext, settings)
    : getMusicForScreen(screen, settings)
  if (!decision) return null

  return { type: 'set-music', ...decision }
}
```

- [ ] **Step 4: Run green command test**

Run:

```bash
npm run test -- src/application/audio/audioCommands.test.ts src/domain/audio/audioPolicy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/audio/audioCommands.ts src/application/audio/audioCommands.test.ts
git commit -m "feat: route gameplay music commands"
```

---

### Task 4: Reactive Gameplay and Result BGM Wiring

**Files:**
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Modify: `src/ui/gameplay/gameplayScreenStageClear.test.ts`
- Modify: `src/App.svelte`
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
- Test: `src/ui/gameplay/gameplayScreenStageClear.test.ts`
- Test: `src/application/progression/appStageProgressionWiring.test.ts`

- [ ] **Step 1: Write failing `GameplayScreen` wiring test**

Add to `src/ui/gameplay/gameplayScreenStageClear.test.ts`:

```ts
it('publishes gameplay music state when result or pause state changes', () => {
  expect(source).toContain("import type { GameplayMusicState } from './gameplayMusicState'")
  expect(source).toContain('onGameplayMusicStateChange: (state: GameplayMusicState) => void')
  expect(source).toContain('onGameplayMusicStateChange({')
  expect(source).toContain('resultVisible: Boolean(hudState?.result),')
  expect(source).toContain("paused: pauseState.mode !== 'playing',")
})
```

- [ ] **Step 2: Write failing App wiring test**

Add to `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
it('routes gameplay, result, and pause music through the audio command path', () => {
  expect(source).toContain("import type { GameplayMusicState } from './ui/gameplay/gameplayMusicState'")
  expect(source).toContain('let gameplayMusicState = $state<GameplayMusicState>')
  expect(source).toContain('function currentGameplayMusicContext()')
  expect(source).toContain('createMusicCommand(appState.screen, settings, currentGameplayMusicContext())')
  expect(source).toContain('function handleGameplayMusicStateChange(state: GameplayMusicState)')
  expect(source).toContain('onGameplayMusicStateChange={handleGameplayMusicStateChange}')
})
```

- [ ] **Step 3: Run red wiring tests**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because the gameplay music state boundary does not exist.

- [ ] **Step 4: Create gameplay music state type**

Create `src/ui/gameplay/gameplayMusicState.ts`:

```ts
export type GameplayMusicState = {
  resultVisible: boolean
  paused: boolean
}

export const initialGameplayMusicState: GameplayMusicState = {
  resultVisible: false,
  paused: false,
}
```

- [ ] **Step 5: Wire `GameplayScreen.svelte` callback**

In `src/ui/gameplay/GameplayScreen.svelte`, import the type:

```ts
import type { GameplayMusicState } from './gameplayMusicState'
```

Add prop:

```ts
onGameplayMusicStateChange: (state: GameplayMusicState) => void
```

Destructure it:

```ts
onGameplayMusicStateChange,
```

Add a reactive effect after `stageDisplay`:

```ts
$effect(() => {
  onGameplayMusicStateChange({
    resultVisible: Boolean(hudState?.result),
    paused: pauseState.mode !== 'playing',
  })
})
```

- [ ] **Step 6: Wire `App.svelte` audio context**

In `src/App.svelte`, import:

```ts
import type { GameplayMusicState } from './ui/gameplay/gameplayMusicState'
import { initialGameplayMusicState } from './ui/gameplay/gameplayMusicState'
```

Add state near existing `$state` declarations:

```ts
let gameplayMusicState = $state<GameplayMusicState>(initialGameplayMusicState)
```

Add helper near `isGameplayStageUnlocked`:

```ts
function currentGameplayMusicContext() {
  if (appState.screen.type !== 'gameplay') return undefined
  const stage = projectData.stages.items[appState.screen.stageId]

  return {
    stageId: appState.screen.stageId,
    isBoss: stage?.isBoss ?? false,
    resultVisible: gameplayMusicState.resultVisible,
    paused: gameplayMusicState.paused,
  }
}
```

Update `syncMusicForCurrentState`:

```ts
function syncMusicForCurrentState() {
  audio?.execute(createMusicCommand(appState.screen, settings, currentGameplayMusicContext()))
}
```

Add handler:

```ts
function handleGameplayMusicStateChange(state: GameplayMusicState) {
  if (
    gameplayMusicState.resultVisible === state.resultVisible &&
    gameplayMusicState.paused === state.paused
  ) {
    return
  }

  gameplayMusicState = state
  syncMusicForCurrentState()
}
```

Pass prop to `GameplayScreen`:

```svelte
onGameplayMusicStateChange={handleGameplayMusicStateChange}
```

Reset `gameplayMusicState = initialGameplayMusicState` before syncing music in `handleConfirmStage`, `handleNextGameplayStage`, and `handleRetryGameplayStage`.

- [ ] **Step 7: Run green wiring tests**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/progression/appStageProgressionWiring.test.ts src/application/audio/audioCommands.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/ui/gameplay/gameplayMusicState.ts src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayScreenStageClear.test.ts src/App.svelte src/application/progression/appStageProgressionWiring.test.ts
git commit -m "feat: wire gameplay and result bgm"
```

---

### Task 5: Full Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: all test files pass.

- [ ] **Step 2: Run Svelte/TypeScript check**

```bash
npm run check
```

Expected: `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Vite build succeeds. Existing chunk size warnings are acceptable.

- [ ] **Step 4: Run diff sanity**

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Completion audit**

Verify the objective requirement by requirement:

- Prototype behavior referenced: normal stage, boss stage, result, paused ducking.
- No runtime import from `__prototype__`; only audio files copied to root `public/assets/audio/`.
- Normal stage policy maps `1-1` to `world01Bgm`.
- Boss stage policy maps `1-6` to `world01Boss`.
- Result-visible gameplay maps to `result`.
- Paused gameplay maps to same stage music at 45% volume.
- `App.svelte` owns BGM side effects through `createMusicCommand` and `audio.execute`.
- Phaser renderer has no music import or audio command path.

- [ ] **Step 6: Final commit if needed**

If verification required any additional changes:

```bash
git add <changed-files>
git commit -m "test: verify gameplay bgm flow"
```

## Self-Review

- Spec coverage: Task 1 covers assets; Task 2 covers pure policy; Task 3 covers command factory; Task 4 covers App/GamePlayScreen reactive wiring; Task 5 covers full verification and prototype boundary.
- Placeholder scan: no placeholder steps remain.
- Type consistency: `GameplayMusicContext`, `GameplayMusicState`, `createMusicCommand(screen, settings, gameplayContext?)`, `onGameplayMusicStateChange`, and `initialGameplayMusicState` are introduced before use.
