# Gameplay Stage Unlock UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the existing stage progression projection to Stage Select and Result HUD presentation so locked, unlocked, cleared, and next-stage states match the Prototype behavior surface.

**Architecture:** Consume the Slice 1 record state and Slice 2 unlock projection from App; do not add persistence or duplicate record facts. `StageSelectScreen.svelte` remains a reactive presentation component that receives per-stage progression option states and renders localized locked/record UI. CSS handles visual treatment; domain/application progression rules remain unchanged unless a test exposes a contract gap.

**Tech Stack:** TypeScript, Svelte 5 runes, Vitest source-contract tests, existing global CSS in `src/app.css`.

---

## File Structure

- Modify: `src/domain/data/localize/localize.ts`
  - Add `common.locked` to `CommonLocalizationKey` and all locale catalogs.
- Modify: `src/domain/data/localize/localize.test.ts`
  - Verify `common.locked` resolves for every supported locale.
- Modify: `src/ui/stage/StageSelectScreen.svelte`
  - Accept `stageProgressionOptions`.
  - Render locked node marker `◆`, locked/cleared classes, locked preview overlay, localized locked deploy/objective, cleared records, and live path lines.
  - Keep selected locked stages selectable for preview.
  - Keep deploy click and double-click inert for locked stages.
- Modify: `src/ui/stage/stageSelectLocalization.test.ts`
  - Add source-contract tests for locked copy, locked overlay, disabled deploy, cleared records, `locked/cleared/live` classes, and `◆`.
- Modify: `src/App.svelte`
  - Compute `stageProgressionOptions = projectStageProgressionOptions(stageOrder, stageProgressionSave.stageRecords, debugUnlockAllStages)`.
  - Pass options into `StageSelectScreen`.
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
  - Verify App passes projected option states to Stage Select.
- Modify: `src/ui/gameplay/gameplayScreenResult.test.ts`
  - Strengthen the Result HUD contract that `nextStageAvailable` is parent-provided and passed to both resolver and `StageResult`.
- Modify: `src/ui/gameplay/StageResult.svelte`
  - Only if required by tests: keep disabled `next-stage` with the existing `locked` button treatment and no new persistence.
- Modify: `src/app.css`
  - Add locked/cleared node treatment, live path treatment, locked preview overlay, and disabled deploy treatment.

---

## Task 1: Localization And Stage Select Progression Contract

**Files:**
- Modify: `src/domain/data/localize/localize.test.ts`
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/ui/stage/stageSelectLocalization.test.ts`
- Modify: `src/ui/stage/StageSelectScreen.svelte`

- [ ] **Step 1: Write failing localization tests**

Append this test to `src/domain/data/localize/localize.test.ts`:

```ts
it('includes localized locked copy for every supported locale', () => {
  expect(resolveLocalizedText(localize, 'en', 'common.locked')).toBe('Locked')
  expect(resolveLocalizedText(localize, 'ja', 'common.locked')).toBe('ロック中')
  expect(resolveLocalizedText(localize, 'zhHant', 'common.locked')).toBe('未解鎖')
  expect(resolveLocalizedText(localize, 'ko', 'common.locked')).toBe('잠김')
})
```

- [ ] **Step 2: Write failing Stage Select source-contract tests**

Append these tests to `src/ui/stage/stageSelectLocalization.test.ts`:

```ts
describe('Stage Select progression UI contract', () => {
  it('receives stage progression option states from App', () => {
    expect(stageSelectSource).toContain('stageProgressionOptions')
    expect(stageSelectSource).toContain('progressionByStageId')
    expect(stageSelectSource).toContain('selectedStageProgression')
  })

  it('renders localized locked state without hiding the selected preview', () => {
    expect(stageSelectSource).toContain('text(\\'common.locked\\')')
    expect(stageSelectSource).toContain('class="stage-preview-lock"')
    expect(stageSelectSource).toContain('{#if !selectedStageProgression.unlocked}')
    expect(stageSelectSource).toContain('stageObjective(selectedStage)')
  })

  it('renders locked, cleared, and live route markers like the Prototype state surface', () => {
    expect(stageSelectSource).toContain('class:locked={!stageProgression(stage.id).unlocked}')
    expect(stageSelectSource).toContain('class:cleared={stageProgression(stage.id).cleared}')
    expect(stageSelectSource).toContain('class:live={stageProgression(stage.id).unlocked && stageProgression(stageOptions[index + 1].id).unlocked}')
    expect(stageSelectSource).toContain("{stageProgression(stage.id).unlocked ? stage.id : '◆'}")
  })

  it('keeps deploy and double-click inert for locked stages', () => {
    expect(stageSelectSource).toContain('if (!selectedStageProgression.unlocked) return')
    expect(stageSelectSource).toContain('disabled={!selectedStageProgression.unlocked || confirming}')
    expect(stageSelectSource).toContain('onSelectStage(index)')
    expect(stageSelectSource).toContain('handleConfirmStage()')
  })

  it('renders cleared records from the progression option state', () => {
    expect(stageSelectSource).toContain('selectedStageProgression.record?.maxCoins ?? 0')
    expect(stageSelectSource).toContain('selectedStageProgression.record?.bestTime ?? text(stageSelectRefs.recordUnavailable)')
    expect(stageSelectSource).toContain('selectedStageProgression.record?.bestRank ?? text(stageSelectRefs.recordUnavailable)')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/stage/stageSelectLocalization.test.ts
```

Expected: FAIL because `common.locked` and Stage Select progression props are missing.

- [ ] **Step 4: Add localized locked copy**

Update `src/domain/data/localize/localize.ts`:

```ts
export type CommonLocalizationKey =
  | 'common.select'
  | 'common.confirm'
  | 'common.adjust'
  | 'common.back'
  | 'common.on'
  | 'common.off'
  | 'common.cancel'
  | 'common.delete'
  | 'common.warning'
  | 'common.locked'
```

Add catalog values in each locale:

```ts
'common.locked': 'Locked',
'common.locked': 'ロック中',
'common.locked': '未解鎖',
'common.locked': '잠김',
```

- [ ] **Step 5: Add Stage Select progression props and rendering**

Update `src/ui/stage/StageSelectScreen.svelte` imports:

```ts
import type { StageProgressionOptionState } from '../../domain/progression/stageProgression'
import type { StageId } from '../../domain/data/worlds/worldTypes'
```

Extend props:

```ts
stageProgressionOptions: readonly StageProgressionOptionState<StageId>[]
```

Destructure the prop.

Add progression helpers after `selectedStage`:

```ts
const progressionByStageId = $derived(new Map(
  stageProgressionOptions.map((option) => [option.stageId, option]),
))

function stageProgression(stageId: StageId): StageProgressionOptionState<StageId> {
  return progressionByStageId.get(stageId) ?? {
    stageId,
    unlocked: false,
    cleared: false,
    record: undefined,
  }
}

const selectedStageProgression = $derived(stageProgression(selectedStage.id))
```

Update `handleConfirmStage`:

```ts
function handleConfirmStage() {
  if (!selectedStageProgression.unlocked) return
  confirming = true
  onConfirmStage()
  if (confirmResetTimer) window.clearTimeout(confirmResetTimer)
  confirmResetTimer = window.setTimeout(() => {
    confirming = false
    confirmResetTimer = undefined
  }, 220)
}
```

Update locked preview, objective, records, deploy, paths, and nodes:

```svelte
{#if !selectedStageProgression.unlocked}
  <div class="stage-preview-lock">{text('common.locked')}</div>
{/if}

<p class="stage-objective">
  {selectedStageProgression.unlocked ? stageObjective(selectedStage) : text('common.locked')}
</p>

<b>{selectedStageProgression.record?.maxCoins ?? 0} <small>/ {selectedStage.collectibleCount}</small></b>

<b>{selectedStageProgression.record?.bestTime ?? text(stageSelectRefs.recordUnavailable)}</b>
<b>{selectedStageProgression.record?.bestRank ?? text(stageSelectRefs.recordUnavailable)}</b>

<button
  class="stage-deploy"
  type="button"
  disabled={!selectedStageProgression.unlocked || confirming}
  onclick={handleConfirmStage}
>
  <span>{selectedStageProgression.unlocked ? text(stageSelectRefs.deploy) : text('common.locked')}</span>
  <b aria-hidden="true">›</b>
</button>

<line
  class:live={stageProgression(stage.id).unlocked && stageProgression(stageOptions[index + 1].id).unlocked}
  ...
></line>

<button
  class:locked={!stageProgression(stage.id).unlocked}
  class:cleared={stageProgression(stage.id).cleared}
  ...
>
  <i aria-hidden="true"></i>
  <b>{stageProgression(stage.id).unlocked ? stage.id : '◆'}</b>
  <span><strong>{stage.id}</strong>{stageSubtitle(stage)}</span>
</button>
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/stage/stageSelectLocalization.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts src/ui/stage/StageSelectScreen.svelte src/ui/stage/stageSelectLocalization.test.ts
git commit -m "feat: add stage select progression states"
```

---

## Task 2: App Projection Into Stage Select

**Files:**
- Modify: `src/application/progression/appStageProgressionWiring.test.ts`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write failing App wiring tests**

Append to `src/application/progression/appStageProgressionWiring.test.ts`:

```ts
describe('App stage select progression UI wiring', () => {
  it('projects stage progression options for Stage Select from records and debug unlock', () => {
    expect(source).toContain('projectStageProgressionOptions(')
    expect(source).toContain('stageProgressionSave.stageRecords')
    expect(source).toContain('debugUnlockAllStages')
    expect(source).toContain('const stageProgressionOptions = $derived(')
  })

  it('passes projected stage progression options into StageSelectScreen', () => {
    expect(source).toContain('stageProgressionOptions={stageProgressionOptions}')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts
```

Expected: FAIL because `projectStageProgressionOptions` is not used by App.

- [ ] **Step 3: Wire the projection in App**

Update `src/App.svelte` progression imports:

```ts
import {
  getNextStageId,
  isStageUnlocked,
  projectStageProgressionOptions,
  type StageClearResult,
} from './domain/progression/stageProgression'
```

Add derived projection near `nextGameplayStageAvailable`:

```ts
const stageProgressionOptions = $derived(
  projectStageProgressionOptions(
    stageOrder,
    stageProgressionSave.stageRecords,
    debugUnlockAllStages,
  ),
)
```

Pass it to Stage Select:

```svelte
<StageSelectScreen
  ...
  stageProgressionOptions={stageProgressionOptions}
  ...
/>
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test -- src/application/progression/appStageProgressionWiring.test.ts src/ui/stage/stageSelectLocalization.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.svelte src/application/progression/appStageProgressionWiring.test.ts
git commit -m "feat: wire stage select progression projection"
```

---

## Task 3: Stage Select And Result Visual State CSS

**Files:**
- Modify: `src/ui/stage/stageSelectLocalization.test.ts`
- Modify: `src/ui/gameplay/gameplayScreenResult.test.ts`
- Modify: `src/ui/stage/StageSelectScreen.svelte`
- Modify: `src/ui/gameplay/StageResult.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Write failing source-contract tests**

Append to `src/ui/stage/stageSelectLocalization.test.ts`:

```ts
describe('Stage Select progression visual styles', () => {
  it('defines locked preview, disabled deploy, live path, locked node, and cleared node classes', async () => {
    const css = await import('../../app.css?raw').then((module) => module.default)

    expect(css).toContain('.stage-preview-lock')
    expect(css).toContain('.stage-deploy:disabled')
    expect(css).toContain('.stage-paths line.live')
    expect(css).toContain('.stage-node.locked')
    expect(css).toContain('.stage-node.cleared')
  })
})
```

Append to `src/ui/gameplay/gameplayScreenResult.test.ts`:

```ts
it('keeps Result HUD next-stage lock treatment driven by nextStageAvailable', () => {
  expect(gameplayScreenSource).toContain('nextStageAvailable={nextStageAvailable}')
  expect(gameplayScreenSource).toContain('resolveStageResultActionIntent')
  expect(gameplayScreenSource).toContain('{nextStageAvailable}')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/ui/stage/stageSelectLocalization.test.ts src/ui/gameplay/gameplayScreenResult.test.ts
```

Expected: FAIL because Stage Select CSS classes are not all defined.

- [ ] **Step 3: Add focused CSS visual treatments**

Add to `src/app.css` near existing Stage Select rules:

```css
.stage-preview-lock {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(11, 23, 48, 0.62), rgba(19, 57, 96, 0.58)),
    rgba(8, 18, 36, 0.42);
  color: #fff;
  font-size: min(1.05cqw, 20px);
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.stage-deploy:disabled {
  border-color: rgba(87, 104, 128, 0.34);
  background: linear-gradient(100deg, rgba(77, 91, 112, 0.72), rgba(104, 119, 139, 0.64));
  box-shadow: none;
  color: rgba(255, 255, 255, 0.72);
  cursor: default;
}

.stage-paths line {
  opacity: 0.45;
}

.stage-paths line.live {
  opacity: 1;
  stroke: rgba(255, 230, 160, 0.92);
  stroke-dasharray: none;
  filter: drop-shadow(0 0 5px rgba(255, 230, 160, 0.65));
}

.stage-node.locked {
  color: rgba(255, 255, 255, 0.82);
  filter: drop-shadow(0 6px 10px rgba(18, 26, 43, 0.42)) grayscale(0.25);
}

.stage-node.locked i {
  border-color: rgba(255, 255, 255, 0.62);
  background: linear-gradient(145deg, rgba(119, 136, 158, 0.92), rgba(53, 65, 86, 0.94));
}

.stage-node.cleared i {
  box-shadow:
    0 0 0 2px rgba(255, 230, 160, 0.72),
    0 0 18px rgba(255, 230, 160, 0.48);
}
```

Do not change `StageResult.svelte` unless the tests expose missing existing locked treatment. It already applies `class:locked={action.disabled}`, `disabled={action.disabled}`, and renders locked copy.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test -- src/ui/stage/stageSelectLocalization.test.ts src/ui/gameplay/gameplayScreenResult.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app.css src/ui/stage/stageSelectLocalization.test.ts src/ui/gameplay/gameplayScreenResult.test.ts src/ui/stage/StageSelectScreen.svelte src/ui/gameplay/StageResult.svelte
git commit -m "feat: style stage progression UI states"
```

---

## Task 4: Verification And Browser Sanity

**Files:**
- Inspect only unless verification exposes a defect.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts src/ui/stage/stageSelectLocalization.test.ts src/application/progression/appStageProgressionWiring.test.ts src/ui/gameplay/gameplayScreenResult.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full required checks**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected:
- `npm run test`: all tests pass.
- `npm run check`: 0 errors.
- `npm run build`: success; existing chunk-size warning is acceptable if unchanged.
- `git diff --check`: no whitespace errors.

- [ ] **Step 3: Browser sanity**

Use the current local app in the in-app browser or start the dev server if needed.

Verify manually:

- Fresh save on Stage Select shows `1-1` deployable and later stages locked.
- Locked stage can be selected for preview, shows locked overlay/objective/deploy label, and cannot deploy by double-click.
- Clearing `1-1` updates Result HUD Next Stage to available and returning to Stage Select shows `1-2` unlocked.
- With `?debugUnlock=1`, all stages render as unlocked.

- [ ] **Step 4: Commit any verification fixes**

If verification required fixes, commit them:

```bash
git add <fixed-files>
git commit -m "fix: complete stage unlock UI integration"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Stage Select locked, unlocked, and cleared visual states: Tasks 1 and 3.
- Locked preview overlay and localized locked labels: Tasks 1 and 3.
- Path live state based on adjacent unlock states: Tasks 1 and 3.
- Cleared record display: Task 1.
- Result HUD next-stage locked/available state: Task 3 verifies the existing domain-driven action model consumes parent `nextStageAvailable`; Slice 2 already made the parent value reactive.
- No new persistence logic: all tasks consume existing records/debug projection only.

Deferred:

- Pixel-perfect visual tuning after browser inspection if the user sees mismatch.
- Replacing source-contract tests with mounted interaction tests; current codebase mostly uses source-contract tests for these Svelte surfaces.

Placeholder scan: no deferred-placeholder instructions remain.

Type consistency:

- `StageProgressionOptionState<StageId>` is imported from domain progression and passed from App to Stage Select.
- `common.locked` is a `CommonLocalizationKey` and is resolved through `text('common.locked')`.
- `stageProgressionOptions` is derived from `projectStageProgressionOptions(stageOrder, records, debugUnlockAllStages)`.
