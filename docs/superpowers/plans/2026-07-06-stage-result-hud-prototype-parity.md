# Stage Result HUD Prototype Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust the rebuilt Stage Result HUD to match the approved bright prototype-style result layout while preserving the existing clean-room data flow and result actions.

**Architecture:** This is a Svelte presentation-only change. Domain scoring, renderer snapshots, app flow, and gameplay input routing stay unchanged; `StageResult.svelte` continues to receive typed props and emit user intents. Source-level UI contract tests define the parity markers before implementation.

**Tech Stack:** Svelte 5, TypeScript, Vitest source tests, CSS using the existing 16:9 `cqw`/`cqh` resolution-frame sizing.

---

## File Structure

- Modify `src/ui/gameplay/stageResultUi.test.ts`
  - Adds failing source-level contract assertions for prototype-parity markup and CSS markers.
- Modify `src/ui/gameplay/StageResult.svelte`
  - Rebuilds the result HUD markup/CSS toward the approved bright prototype-style layout.

No domain, renderer, app routing, asset, or prototype files should change.

## Global Constraints

- Do not import from `__prototype__/`.
- Do not copy prototype Svelte or CSS verbatim.
- Keep existing `StageResult.svelte` props unchanged.
- Keep result action callbacks and keyboard/gamepad handling unchanged in `GameplayScreen.svelte`.
- Keep all sizing inside the result HUD based on `cqw`/`cqh`; do not use `vw`/`vh`.
- Do not add save records, unlock progression, next-stage navigation, or scoring changes.

## Task 1: Add Prototype-Parity UI Contract Tests

**Files:**
- Modify: `src/ui/gameplay/stageResultUi.test.ts`

- [ ] **Step 1: Add failing tests for the approved visual parity markers**

Append these tests to `src/ui/gameplay/stageResultUi.test.ts`:

```ts
  it('renders prototype-style banner and stage title ornamentation', () => {
    expect(stageResultSource).toContain('class="result-banner-star"')
    expect(stageResultSource).toContain('class="result-stage-separator"')
  })

  it('renders target counts and locked action sublabel in prototype-style nested elements', () => {
    expect(stageResultSource).toContain('<em>/ {result.coinTarget}</em>')
    expect(stageResultSource).toContain('<em>/ {result.enemyTarget}</em>')
    expect(stageResultSource).toContain('<em>/ {result.checkpointTarget}</em>')
    expect(stageResultSource).toContain('locked: \'Locked\'')
    expect(stageResultSource).toContain('{#if action.disabled}<span>{stageResultCopy.actions.locked}</span>{/if}')
  })

  it('renders the rank as a right-column badge with a final evaluation sublabel', () => {
    expect(stageResultSource).toContain('class="result-rank-badge"')
    expect(stageResultSource).toContain('class="result-rank-sublabel"')
    expect(stageResultSource).toContain('class:rank-s={result.rank === \'S\'}')
    expect(stageResultSource).toContain('class:rank-d={result.rank === \'D\'}')
  })

  it('uses the approved bright prototype-style result HUD surface', () => {
    expect(stageResultSource).toContain('rgba(234, 247, 255')
    expect(stageResultSource).toContain('color-mix(in srgb, var(--hud-panel) 92%, white)')
    expect(stageResultSource).toContain('border-left: 1px solid var(--hud-line-soft)')
    expect(stageResultSource).not.toContain('background: rgba(8, 20, 46, 0.78)')
    expect(stageResultSource).not.toContain('background: rgba(255, 255, 255, 0.075)')
  })
```

- [ ] **Step 2: Run the focused test and confirm the expected RED failure**

Run:

```bash
npm run test -- src/ui/gameplay/stageResultUi.test.ts
```

Expected: FAIL because the current rebuild still uses the darker result surface and does not yet render `result-banner-star`, `result-stage-separator`, nested target `<em>` elements, `result-rank-badge`, `result-rank-sublabel`, or locked sublabel markup.

- [ ] **Step 3: Commit nothing**

Do not commit the failing tests alone. Continue to Task 2 in the same working tree so the next task can make them pass.

## Task 2: Rebuild StageResult Markup And CSS Toward Prototype Parity

**Files:**
- Modify: `src/ui/gameplay/StageResult.svelte`
- Test: `src/ui/gameplay/stageResultUi.test.ts`

- [ ] **Step 1: Update the isolated copy map**

In `src/ui/gameplay/StageResult.svelte`, extend `stageResultCopy.actions` with `locked`:

```ts
    actions: {
      retry: 'Retry',
      stageSelect: 'Stage Select',
      nextStage: 'Next Stage',
      locked: 'Locked',
    },
```

- [ ] **Step 2: Update the banner, stage name, stat value, rank, and action markup**

Replace the current `.result-content` block in `StageResult.svelte` with this structure, preserving the existing script, props, derived values, and event handlers:

```svelte
  <div class="result-content">
    <header class="result-banner">
      <span class="result-banner-star" aria-hidden="true">✦</span>
      <strong>{stageResultCopy.resultTitle}</strong>
      <span class="result-banner-star" aria-hidden="true">✦</span>
    </header>
    <div class="result-stage-name">
      <b>{stageDisplay.worldLabel} {stageDisplay.stageId}</b>
      <i class="result-stage-separator" aria-hidden="true"></i>
      <span>{stageDisplay.stageSubtitle}</span>
    </div>

    <div class="result-board">
      <div class="result-stats">
        <div class="result-row">
          <span>{stageResultCopy.stats.clearTime}</span>
          <b>{result.time}</b>
          <small>{stageResultCopy.stats.newRecord}</small>
        </div>
        <div class:perfect={rowStates.coinsPerfect} class="result-row">
          <span>{stageResultCopy.stats.coins}</span>
          <b>{result.coins}<em>/ {result.coinTarget}</em></b>
          <small class:perfect={rowStates.coinsPerfect}>{rowStates.coinsPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.damagePerfect} class="result-row">
          <span>{stageResultCopy.stats.damageTaken}</span>
          <b>{result.damageTaken}</b>
          <small class:perfect={rowStates.damagePerfect}>{rowStates.damagePerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.fallsPerfect} class="result-row">
          <span>{stageResultCopy.stats.falls}</span>
          <b>{result.falls}</b>
          <small class:perfect={rowStates.fallsPerfect}>{rowStates.fallsPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.enemiesPerfect} class="result-row">
          <span>{stageResultCopy.stats.enemiesDefeated}</span>
          <b>{result.enemiesDefeated}<em>/ {result.enemyTarget}</em></b>
          <small class:perfect={rowStates.enemiesPerfect}>{rowStates.enemiesPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.checkpointsPerfect} class="result-row">
          <span>{stageResultCopy.stats.checkpoints}</span>
          <b>{result.checkpointsReached}<em>/ {result.checkpointTarget}</em></b>
          <small class:perfect={rowStates.checkpointsPerfect}>{rowStates.checkpointsPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
      </div>

      <div class="result-rank">
        <span>{stageResultCopy.rank.label}</span>
        <div
          class="result-rank-badge"
          class:rank-s={result.rank === 'S'}
          class:rank-a={result.rank === 'A'}
          class:rank-b={result.rank === 'B'}
          class:rank-c={result.rank === 'C'}
          class:rank-d={result.rank === 'D'}
        >
          <b>{result.rank}</b>
        </div>
        <small class="result-rank-sublabel">{stageResultCopy.rank.label}</small>
      </div>
    </div>

    <div class="result-actions">
      {#each actions as action, index}
        <button
          type="button"
          class:active={selectedAction === index}
          class:locked={action.disabled}
          disabled={action.disabled}
          onclick={() => handleActionClick(index, action.type, action.disabled)}
          onmouseenter={() => onSelectAction(index)}
        >
          <b>{actionLabel(action.type)}</b>
          {#if action.disabled}<span>{stageResultCopy.actions.locked}</span>{/if}
        </button>
      {/each}
    </div>
  </div>
```

- [ ] **Step 3: Replace the result CSS with the bright prototype-style surface**

In the `<style>` block of `StageResult.svelte`, keep `.stage-result` and all keyframe names, but replace the result-specific rules from `.result-veil` through `.result-actions span` with the following clean-room CSS:

```css
  .stage-result {
    position: absolute;
    inset: 0;
    z-index: 25;
    overflow: hidden;
    pointer-events: auto;
    color: var(--hud-ink);
    font-family: system-ui, sans-serif;
    font-weight: 600;
  }

  .result-veil {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(234, 247, 255, 0.9) 0 27%, rgba(234, 247, 255, 0.45) 48%, rgba(226, 243, 255, 0.72)),
      rgba(236, 248, 255, 0.48);
    backdrop-filter: blur(0.32cqw) saturate(78%);
    animation: result-veil-in 500ms ease-out both;
  }

  .result-hero {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 2;
    width: 27cqw;
    overflow: hidden;
    mask-image: linear-gradient(90deg, #000 80%, transparent);
    animation: result-hero-in 650ms 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .result-hero::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 28%;
    background: linear-gradient(0deg, rgba(18, 59, 131, 0.72), transparent);
  }

  .result-hero img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    filter: drop-shadow(0 0.75cqh 1.7cqh rgba(20, 49, 95, 0.2));
  }

  .result-hero div {
    position: absolute;
    bottom: 4cqh;
    left: 2.1cqw;
    z-index: 2;
    display: block;
    color: #fff;
    text-transform: uppercase;
  }

  .result-hero strong,
  .result-hero span {
    display: block;
  }

  .result-hero strong {
    font-size: min(1.75cqw, 34px);
    letter-spacing: 0.06em;
    text-shadow: 0 0.24cqh 0.75cqh rgba(8, 18, 40, 0.65);
  }

  .result-hero span {
    margin-top: 0.5cqh;
    color: var(--hud-gold-bright);
    font-size: min(0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.25em;
  }

  .result-content {
    position: absolute;
    inset: 0 2.2cqw 0 27cqw;
    z-index: 3;
  }

  .result-banner {
    position: absolute;
    top: 4.2cqh;
    left: 50%;
    display: flex;
    width: 48cqw;
    height: 10.8cqh;
    gap: 1.7cqw;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    clip-path: polygon(0 50%, 1.6cqw 0, calc(100% - 1.6cqw) 0, 100% 50%, calc(100% - 1.6cqw) 100%, 1.6cqw 100%);
    background: linear-gradient(180deg, var(--accent-bright), var(--accent) 48%, var(--accent-deep));
    color: #fff;
    filter: drop-shadow(0 1.55cqh 2.6cqh rgba(20, 49, 95, 0.42));
    animation: result-banner-in 500ms 100ms cubic-bezier(0.2, 0.85, 0.2, 1.1) both;
  }

  .result-banner strong {
    font-size: min(3.3cqw, 64px);
    letter-spacing: 0.13em;
    line-height: 1;
    text-transform: uppercase;
  }

  .result-banner-star {
    color: var(--hud-gold-bright);
    font-size: min(1.4cqw, 27px);
  }

  .result-stage-name {
    position: absolute;
    top: 16.7cqh;
    left: 50%;
    display: flex;
    gap: 1cqw;
    align-items: center;
    transform: translateX(-50%);
    text-transform: uppercase;
    animation: result-row-in 400ms 260ms ease-out both;
  }

  .result-stage-name b {
    font-size: min(1.2cqw, 23px);
    letter-spacing: 0.14em;
    white-space: nowrap;
  }

  .result-stage-name span {
    color: var(--hud-gold-deep);
    font-size: min(0.83cqw, 16px);
    font-weight: 700;
    letter-spacing: 0.25em;
    white-space: nowrap;
  }

  .result-stage-separator {
    width: 0.42cqw;
    height: 0.42cqw;
    rotate: 45deg;
    background: var(--accent-bright);
    box-shadow: 0 0 0.6cqh var(--glow);
  }

  .result-board {
    position: absolute;
    top: 23cqh;
    right: 0;
    left: 0;
    display: grid;
    height: 43cqh;
    grid-template-columns: 1fr 20cqw;
    padding: 1.2cqh 1cqw 1.2cqh 1.4cqw;
    border: 1.5px solid var(--hud-line);
    border-radius: 0.6cqw;
    background: color-mix(in srgb, var(--hud-panel) 92%, white);
    box-shadow: 0 1px 0 #fff inset, 0 2.2cqh 4.6cqh -2.6cqh rgba(20, 49, 95, 0.65);
    backdrop-filter: blur(0.75cqw) saturate(120%);
    animation: result-board-in 520ms 330ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .result-stats {
    display: grid;
    align-content: center;
    padding-right: 1.5cqw;
  }

  .result-row {
    display: grid;
    min-height: 5.9cqh;
    grid-template-columns: 1fr auto 8.5cqw;
    gap: 0.8cqw;
    align-items: center;
    border-bottom: 1px solid var(--hud-line-soft);
    animation: result-row-in 360ms ease-out both;
  }

  .result-row:nth-child(1) { animation-delay: 520ms; }
  .result-row:nth-child(2) { animation-delay: 590ms; }
  .result-row:nth-child(3) { animation-delay: 660ms; }
  .result-row:nth-child(4) { animation-delay: 730ms; }
  .result-row:nth-child(5) { animation-delay: 800ms; }
  .result-row:nth-child(6) {
    border-bottom: 0;
    animation-delay: 870ms;
  }

  .result-row span {
    font-size: min(1.1cqw, 21px);
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .result-row b {
    color: var(--accent-deep);
    font: 700 min(2cqw, 38px)/1 Rajdhani, sans-serif;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .result-row em {
    margin-left: 0.3cqw;
    color: var(--hud-soft);
    font: 0.56em Rajdhani, sans-serif;
    font-style: normal;
  }

  .result-row small {
    min-height: 1em;
    color: var(--hud-gold-deep);
    font-size: min(0.63cqw, 12px);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-align: right;
    text-transform: uppercase;
  }

  .result-row small.perfect {
    color: var(--hud-gold-deep);
  }

  .result-rank {
    display: grid;
    align-content: center;
    justify-items: center;
    border-left: 1px solid var(--hud-line-soft);
    text-transform: uppercase;
  }

  .result-rank > span {
    font-size: min(1.15cqw, 22px);
    font-weight: 700;
    letter-spacing: 0.25em;
  }

  .result-rank-badge {
    display: grid;
    width: 11cqw;
    aspect-ratio: 1;
    margin: 1cqh 0;
    place-items: center;
    border: 1px solid var(--hud-line-soft);
    border-radius: 50%;
    box-shadow: 0 0 0 0.35cqw rgba(255, 255, 255, 0.38) inset, 0 0 2.2cqh var(--glow);
    animation: eval-pulse 1.5s ease-in-out infinite;
  }

  .result-rank-badge.rank-s {
    border-color: rgba(197, 137, 31, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(255, 230, 160, 0.32) inset, 0 0 2.6cqh rgba(243, 198, 77, 0.75);
  }

  .result-rank-badge.rank-a {
    border-color: rgba(16, 159, 200, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(173, 240, 255, 0.3) inset, 0 0 2.6cqh rgba(16, 159, 200, 0.62);
  }

  .result-rank-badge.rank-b {
    border-color: rgba(47, 111, 208, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(174, 211, 255, 0.3) inset, 0 0 2.6cqh rgba(47, 111, 208, 0.62);
  }

  .result-rank-badge.rank-c {
    border-color: rgba(116, 136, 159, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(223, 232, 240, 0.34) inset, 0 0 2.2cqh rgba(116, 136, 159, 0.5);
  }

  .result-rank-badge.rank-d {
    border-color: rgba(214, 83, 83, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(255, 195, 195, 0.28) inset, 0 0 2.4cqh rgba(214, 83, 83, 0.58);
  }

  .result-rank b {
    color: var(--accent);
    font-size: min(4.8cqw, 92px);
    letter-spacing: 0.08em;
  }

  .result-rank-sublabel {
    color: var(--hud-soft);
    font-size: min(0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.2em;
  }

  .result-actions {
    position: absolute;
    top: 70cqh;
    right: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2cqw;
    animation: result-row-in 450ms 900ms ease-out both;
  }

  .result-actions button {
    position: relative;
    display: grid;
    height: 8cqh;
    place-items: center;
    border: 1.5px solid var(--hud-line);
    border-radius: 0.38cqw;
    background: color-mix(in srgb, var(--hud-panel) 94%, white);
    color: var(--hud-ink);
    cursor: pointer;
    backdrop-filter: blur(0.65cqw);
  }

  .result-actions button.active,
  .result-actions button:hover:not(:disabled) {
    border-color: var(--accent);
    background: linear-gradient(180deg, #fff, var(--accent-pale));
    box-shadow: 0 0 1.7cqh rgba(47, 111, 208, 0.28);
    translate: 0 -0.35cqh;
  }

  .result-actions button.locked {
    opacity: 0.45;
    cursor: default;
  }

  .result-actions b {
    font-size: min(1.2cqw, 23px);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .result-actions span {
    position: absolute;
    bottom: 0.4cqh;
    color: var(--hud-soft);
    font-size: min(0.52cqw, 10px);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
```

- [ ] **Step 4: Run the focused UI test and confirm GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/stageResultUi.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS with `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 6: Run the full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 7: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. The existing Vite large chunk warning is acceptable if no new errors are introduced.

- [ ] **Step 8: Run whitespace sanity**

Run:

```bash
git diff --check
```

Expected: PASS with no output.

- [ ] **Step 9: Browser verify the result HUD**

Start or reuse the local Vite dev server, open the app, clear stage `1-1`, and verify:

- veil is pale blue-white rather than dark,
- Yuuta standee is left masked with bottom blue gradient,
- result banner contains gold star ornaments,
- stage name is horizontal with a blue diamond separator,
- board is bright translucent with soft HUD-line stat rows,
- rank is a right-column circular badge,
- action buttons span the content width and disabled Next Stage shows `Locked`,
- no text overlaps at desktop and smaller 16:9 frame sizes.

- [ ] **Step 10: Commit**

```bash
git add src/ui/gameplay/StageResult.svelte src/ui/gameplay/stageResultUi.test.ts
git commit -m "fix: align stage result HUD with prototype"
```

## Self-Review

- Spec coverage: Task 1 covers the required failing UI contract for bright prototype markers. Task 2 covers markup, CSS, locked sublabel, focused/full verification, browser verification, and commit.
- Placeholder scan: The plan contains no `TBD`, `TODO`, deferred implementation markers, or vague implementation steps.
- Scope check: The plan only changes `StageResult.svelte` and `stageResultUi.test.ts`; domain scoring, renderer snapshots, gameplay input routing, app flow, persistence, and prototype files remain out of scope.
- Type consistency: The existing `StageResult` props and callbacks remain unchanged; only local copy, markup, and CSS are adjusted.
