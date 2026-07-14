# Scene Transition System Design

## Goal

Implement a reusable scene transition system for the rebuild that matches the playable prototype's screen-change feel without copying prototype runtime code. The system must also fill the area outside the fixed 16:9 resolution frame with the appropriate world background image, changing as the selected world or gameplay stage changes.

## Prototype Reference

The prototype uses a shell-level transition overlay with three phases:

- `idle`: no overlay.
- `cover`: an overlay fades or sweeps in before the screen changes.
- `reveal`: the overlay fades or sweeps out after the new screen is ready.

It uses two visual families:

- Page transitions: a soft bright radial cover/reveal with a central `✦` emblem.
- World-stage transitions: a horizontal light sweep between world select and stage select, reversed when navigating back.

Prototype timing is approximately:

- Page cover: 260-280 ms.
- World-stage cover: 300 ms.
- Stage/gameplay reveal wait: about 420 ms before reveal to hide canvas setup.
- Reveal: about 540-620 ms.

These values are reference targets, not code to copy. The rebuild should keep the same visual language while using deterministic, testable policies.

## Architecture

Use **App-level transition coordination**.

### Pure Application Policy

Add a pure transition policy module under `src/application/sceneTransition/`.

It owns:

- transition phase names: `idle`, `cover`, `reveal`
- transition style names: `page`, `world-stage-forward`, `world-stage-back`, `gameplay`
- duration constants
- screen-to-screen style selection
- prevention of transition reentry while a transition is active

The policy must not import Svelte, DOM APIs, timers, Phaser, browser storage, or prototype code.

### App Coordination

`App.svelte` remains the only coordinator for screen mutation and cross-screen side effects.

Screen changes that replace the visible scene should follow this sequence:

1. Determine transition style from previous and next app screen.
2. Enter `cover`.
3. After the cover duration, mutate `appState.screen`.
4. Run existing side effects for music/SFX/state reset at the same logical moment they happen today.
5. Wait any style-specific hold duration needed to avoid blank canvas or layout flashes.
6. Enter `reveal`.
7. Return to `idle` after reveal duration.

Selection-only changes within the same screen, such as changing highlighted world or highlighted stage, must not run a full scene transition. They should continue using the existing local UI animations and SFX.

### UI Overlay

Add a presentation-only `SceneTransitionOverlay.svelte`.

It receives:

- phase
- style

It renders an overlay inside the shell/resolution-frame stack and contains no app flow logic. CSS implements the visuals:

- `page` and `gameplay`: soft luminous radial cover/reveal, central emblem pulse.
- `world-stage-forward`: horizontal light sweep moving left-to-right.
- `world-stage-back`: the same sweep reversed.

The overlay must block pointer events while active so users cannot click through a transition.

## Transition Coverage

The first implementation must cover these navigation paths:

- title intro/menu to world select
- world select to stage select
- stage select back to world select
- stage select to gameplay
- gameplay result retry
- gameplay result next stage
- gameplay result/stage pause return to stage select
- settings back to title menu

Control-intent paths and direct button-click paths must go through the same transition coordinator where they cause the same screen change. This avoids keyboard/gamepad and mouse behavior drifting apart.

## Backdrop Fill Outside Resolution Frame

The rebuild currently centers a fixed 16:9 `ResolutionFrame` inside `.shell`. The area outside that frame must use the correct world image instead of a generic gradient.

Add a pure shell backdrop resolver.

Inputs:

- current app screen
- world catalog
- stage catalog
- selected world index when available
- selected gameplay stage when available
- previous resolved backdrop as a fallback for screens that do not carry world context

Outputs:

- asset reference for the shell backdrop
- a stable theme key for CSS tinting

Rules:

- Title screens use the title background if available, otherwise the current title fallback color.
- World select uses the currently highlighted world's `assetRefs.stageSelectBackground`.
- Stage select uses the selected world's `assetRefs.stageSelectBackground`.
- Gameplay uses the current stage's world `assetRefs.stageSelectBackground`.
- Settings uses the previous resolved backdrop so opening settings does not abruptly change the shell background.
- Unknown or missing world data falls back to world 01's stage-select background.

`.shell` should expose the selected asset through a CSS custom property and render it with `background-image`. Add a dim/blur/tint layer so the out-of-frame image supports the central 16:9 frame without competing with it.

## Data Flow

The intended data flow is:

1. User intent enters `App.svelte`.
2. Existing pure app-flow functions calculate the next `AppScreen`.
3. Transition policy decides whether a scene transition is required and which style to use.
4. `App.svelte` schedules transition phases and applies the screen mutation at cover.
5. `SceneTransitionOverlay.svelte` renders the current phase/style.
6. Shell backdrop resolver derives the out-of-frame background from current screen state.

Pure app-flow functions should remain deterministic and side-effect free. The timer boundary belongs in `App.svelte`, because it is the browser-side reactive coordinator.

## Testing Strategy

Use TDD for every behavior slice.

Required tests:

- transition policy maps `world-select -> stage-select` to `world-stage-forward`
- transition policy maps `stage-select -> world-select` to `world-stage-back`
- transition policy maps any navigation into gameplay to `gameplay`
- transition policy leaves same-screen selection changes as no full transition
- transition state rejects reentry while not `idle`
- shell backdrop resolver maps world select, stage select, and gameplay to the expected world backgrounds
- shell backdrop resolver preserves the previous backdrop for settings
- App source contract proves screen-changing handlers route through the transition coordinator
- overlay source/CSS contract proves the page, world-shift, reverse, reveal, pointer-blocking, and emblem classes exist

After implementation, run:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

Also verify in browser:

- stage/world transitions visibly cover then reveal
- world-stage sweep direction changes when navigating back
- gameplay entry/retry/next stage does not show a blank frame
- the area outside the 16:9 frame shows the world background and changes with selected world/stage

## Non-Goals

- Do not rewrite the existing app-flow domain model.
- Do not move root project directories.
- Do not copy prototype Svelte or CSS verbatim.
- Do not add new gameplay map assets in this slice; use already-copied public world background assets.
- Do not implement per-screen bespoke transition logic.

## Acceptance Criteria

- All screen-changing routes listed in this spec use the centralized transition coordinator.
- The transition overlay visually matches the prototype's page and world-stage transition families.
- The implementation remains layered: pure policy in application/domain-style modules, timers and browser coordination in `App.svelte`, rendering in Svelte UI.
- The 16:9 frame remains stable at all viewport sizes.
- Out-of-frame shell background uses the selected world's stage-select image for world select, stage select, and gameplay.
- No runtime imports or source dependencies point into `__prototype__/`.
- Required tests and verification commands pass.
