# Gameplay Pause Menu Design

## Goal

Rebuild the gameplay Pause Menu from the playable `__prototype__/` into the rebuilt project.

The rebuilt pause menu must match the prototype's observable behavior, layout, and animation, while staying clean-room and aligned with the rebuild architecture:

- pure domain/application transitions,
- deterministic input handling,
- reactive Svelte presentation,
- explicit Phaser renderer pause/resume boundary,
- no runtime imports from `__prototype__/`,
- no direct copying of prototype Svelte or CSS.

## Current Problem

The rebuilt gameplay screen has a Phaser canvas, Svelte HUD, and Stage Result overlay, but it has no pause state.

Current rebuilt behavior:

- `GameplayScreen.svelte` creates a Phaser game and renders HUD/result overlays.
- Keyboard/gamepad handling inside gameplay is currently dedicated to Stage Result actions after clear.
- `createGameplayRenderer.ts` does not expose a pause/resume controller to Svelte.
- `App.svelte` can retry gameplay and return to Stage Select, but it does not model pause or pause-origin settings.
- `SettingsScreen.svelte` exists, but settings always return to the title menu through current app-flow rules.

The prototype already has the desired experience:

- `Esc`, gamepad start-like behavior, or touch pause opens a centered pause overlay while gameplay is running.
- Phaser gameplay is paused while the menu is open.
- The menu shows `Resume`, `Restart Stage`, `Settings`, and `Return to Stage Select`.
- `Settings` opens the settings panel over paused gameplay and returns to Pause Menu.
- `Resume` and `Esc` close the menu and resume gameplay.
- The menu uses the prototype bright HUD panel style, dark blurred backdrop, kicker/rule heading, staggered row animation, and control hints.

## Non-Negotiable Constraints

- Follow TDD for every domain, application, renderer, and UI contract change.
- Keep domain/application pause rules pure and framework-free.
- Keep Phaser-specific pausing inside the renderer boundary.
- Keep Svelte reactive and presentational: components render state and emit user intents.
- Do not import runtime code from `__prototype__/`.
- Do not copy prototype Svelte or CSS verbatim. Rebuild equivalent structure and styling in the new project.
- Use container-query units for gameplay overlay sizing, matching the existing resolution-frame HUD approach.
- Preserve Stage Result behavior: pause cannot open once the stage result overlay exists.
- Preserve Settings behavior for title-origin settings while adding pause-origin settings.
- Avoid hard-coded gameplay UI copy where localization is already available; new pause text must be added to localization data.

## Prototype Reference Surface

Use these files only as reference material:

- `__prototype__/src/App.svelte`
  - Pause state, pause actions, keyboard/gamepad behavior, settings origin behavior.
- `__prototype__/src/app.css`
  - `.pause-overlay`, `.pause-menu`, `.pause-kicker`, `.pause-rule`, row styling, and pause animation timing.
- `__prototype__/src/SettingsPanel.svelte`
  - Shared system-menu visual language and settings-in-pause composition.
- `__prototype__/src/i18n.ts`
  - Pause labels across locales.

Prototype values to preserve conceptually:

- Pause items: `Resume`, `Restart Stage`, `Settings`, `Return to Stage Select`.
- Overlay backdrop: dark blue horizontal gradient plus blur/saturation.
- Panel: bright translucent HUD surface, 8px radius, inset outline, centered in the gameplay frame.
- Animation:
  - backdrop fades and blurs in around 220ms,
  - panel scales/translates in around 260ms,
  - menu rows slide/fade in around 220ms with staggered delays.

## Target User Experience

During active gameplay:

- Pressing `Escape` opens Pause Menu.
- Pressing gamepad east/back opens Pause Menu when gameplay is active.
- A future touch pause button can call the same open-pause command; this slice does not need to build the touch controls.
- Opening pause stops Phaser simulation and HUD timer progression.
- The gameplay canvas remains visible behind a blurred pause overlay.
- Menu selection starts at `Resume`.

While Pause Menu is open:

- `ArrowUp` / `W` and `ArrowDown` / `S` move selection with wraparound.
- Gamepad d-pad or left-stick vertical movement moves selection.
- `Enter`, Space, or gamepad south confirms the selected action.
- `Escape` or gamepad east resumes gameplay.
- Pointer click selects and activates a pause item.

Pause actions:

- `Resume`: closes Pause Menu, resumes Phaser, resets renderer/game loop delta so elapsed time does not jump.
- `Restart Stage`: closes Pause Menu and remounts the current gameplay stage through the existing retry/run-id path.
- `Settings`: opens Settings over paused gameplay. The gameplay renderer remains paused.
- `Return to Stage Select`: leaves gameplay and returns to the stage selection for the current stage.

While pause-origin Settings is open:

- Settings keeps the same settings rows and controls as the existing Settings screen.
- Back/Escape returns to Pause Menu with `Settings` selected.
- Confirming the settings Back row returns to Pause Menu with `Settings` selected.
- Delete-save confirmation behavior remains unchanged inside Settings.
- Gameplay remains paused until the user returns to Pause Menu and chooses Resume.

Stage Result interaction:

- If `hudState.result` exists, gameplay is considered cleared and Pause Menu does not open.
- Stage Result keeps owning result action input.

## Domain And Application Model

Add a pure gameplay pause module under `src/domain/gameplay/`.

It should model:

```ts
export const PAUSE_MENU_ITEMS = ['resume', 'restart-stage', 'settings', 'stage-select'] as const

export type PauseMenuItem = (typeof PAUSE_MENU_ITEMS)[number]

export type GameplayPauseState =
  | { mode: 'playing' }
  | { mode: 'paused'; selectedItemIndex: number }
  | { mode: 'settings'; selectedItemIndex: number }

export type PauseAction =
  | 'resume'
  | 'restart-stage'
  | 'open-settings'
  | 'stage-select'
```

Pure functions should cover:

- `openPauseMenu(state)`
- `resumePauseMenu(state)`
- `movePauseMenuSelection(state, direction)`
- `selectPauseMenuItem(state, index)`
- `activatePauseMenuItem(state)`
- `openPauseSettings(state)`
- `backFromPauseSettings(state)`

The module must not import Svelte, Phaser, DOM APIs, timers, browser storage, or `__prototype__`.

Application/input handling should:

- Extend control intent context with a gameplay pause menu context.
- Map keyboard/gamepad pause-menu input through existing `ControlIntent` values where possible.
- Add a gameplay active pause-opening input path without disrupting player movement input handled by Phaser.
- Route pause settings through existing settings reducers without duplicating settings logic.

## App Flow

Keep gameplay as the app-level screen while Pause Menu is a gameplay overlay state owned by `GameplayScreen.svelte`.

Pause-origin Settings should also remain over the live gameplay screen so the Phaser game can stay mounted and paused. The preferred implementation path is to extract a reusable settings panel/body from `SettingsScreen.svelte`, then render that panel inside the gameplay pause overlay. This keeps title-origin Settings and pause-origin Settings sharing the same settings rows and reducers without routing away from gameplay.

If extraction proves more invasive than extending app flow, the implementation plan may instead add an explicit settings origin to `AppScreen`. That fallback is acceptable only with tests proving that pause-origin settings returns to a paused gameplay screen without recreating or unpausing the gameplay renderer.

Regardless of implementation path:

- Restart uses existing gameplay retry/remount behavior.
- Stage Select uses existing return-to-stage-select behavior.
- Title-origin Settings must still return to the title menu.
- Pause-origin Settings must return to Pause Menu.

## Renderer Boundary

`createGameplayRenderer` should return a small controller instead of only the raw `Phaser.Game`, or otherwise expose explicit pause methods through `GameplayScreen.svelte`.

Required renderer-facing behavior:

- `pause()` pauses the active gameplay scene.
- `resume()` resumes the active gameplay scene.
- `resetTiming()` resets Phaser loop delta after resume to avoid elapsed-time jumps.
- `destroy()` still tears down the Phaser game on component unmount.

The renderer should not know about menu item labels, selected indices, Settings, or app navigation.

## Svelte UI

Add a gameplay pause component under `src/ui/gameplay/`, likely `PauseMenu.svelte`.

The component receives:

- pause state or selected index,
- localized label data,
- callbacks for select and action,
- control hint labels.

The component renders:

- full-frame `pause-overlay`,
- centered `pause-menu`,
- kicker: localized `settings.systemMenu`,
- title: localized `pause.paused`,
- divider rule,
- four menu buttons with `01`-style indices,
- active row treatment,
- shared `ControlHints` for select/confirm/resume hints.

`GameplayScreen.svelte` owns reactive pause state and coordinates:

- keyboard/gamepad pause input,
- pause menu selection,
- activation callbacks,
- renderer pause/resume,
- settings overlay state,
- Stage Result input precedence.

The pause overlay must sit above HUD and canvas but below Stage Result if a result exists. Because Pause Menu cannot open after result, this should remain simple in practice.

## Localization

Add pause localization keys:

- `pause.paused`
- `pause.resume`
- `pause.restart`
- `pause.stageSelect`

The Settings label can reuse `settings.title` or the existing settings menu label already used by title/settings screens.

Add English, Japanese, Traditional Chinese, and Korean values aligned with the prototype:

- English: `Paused`, `Resume`, `Restart Stage`, `Return to Stage Select`
- Japanese: `ポーズ`, `再開`, `ステージ再開`, `ステージ選択へ`
- Traditional Chinese: `暫停`, `繼續`, `重新開始關卡`, `返回選關畫面`
- Korean: `일시 정지`, `계속`, `스테이지 재시작`, `스테이지 선택으로`

Visible pause copy must be accessed through localization, not inline English literals in Svelte.

## Visual And Animation Requirements

The rebuilt Pause Menu must visually converge with the prototype:

- Overlay covers only the 16:9 gameplay frame, not the whole browser viewport.
- Backdrop uses dark blue horizontal gradient, blur, and saturation reduction.
- Panel width is about one third of the gameplay frame with a practical max width.
- Panel uses bright HUD surface tokens, thin blue border, inset white shine, outer translucent outline, and deep shadow.
- Panel has 8px or less border radius.
- Kicker is small uppercase tracking text.
- Title is large uppercase `Paused`.
- Rows are compact, indexed, left-aligned, and use active blue strip/highlight.
- Rows animate in with staggered delays.
- Control hints sit at the bottom of the panel and use shared `ControlHints`.
- All sizing uses `cqw`/`cqh` or frame-relative constraints so desktop and smaller 16:9 sizes preserve proportions.

Exact CSS source is not copied from the prototype. Matching means the visible hierarchy, proportions, animation timing, and interaction affordances match the prototype.

## Testing Strategy

### Domain Tests

Add tests before implementation for:

- opening pause from playing selects the first item,
- opening pause is idempotent when already paused/settings,
- menu selection wraps up and down,
- direct pointer selection is bounded to valid menu items,
- activating Resume returns a `resume` action,
- activating Restart returns `restart-stage`,
- activating Settings enters settings/open-settings action,
- activating Stage Select returns `stage-select`,
- Back from pause-origin settings returns to paused menu with Settings selected.

### Input Tests

Add tests before implementation for:

- gameplay active `Escape` maps to pause/back intent appropriate for opening pause,
- pause menu arrow/W/S maps to up/down,
- pause menu Enter/Space maps to confirm,
- pause menu Escape maps to back/resume,
- gamepad south confirms, east backs/resumes, d-pad/stick moves selection.

Existing title/world/stage/settings input tests must remain unchanged.

### Application/App Flow Tests

Add focused tests for:

- Restart from Pause Menu uses the same current-stage retry/remount path as Stage Result Retry.
- Return to Stage Select from Pause Menu returns to the current stage's stage-select position.
- Title-origin Settings still returns to title menu.
- Pause-origin Settings returns to Pause Menu.

If the implementation keeps pause state inside `GameplayScreen.svelte`, cover app-flow navigation through the smallest pure helper possible instead of forcing app-flow to know Svelte-local UI details.

### Renderer Tests

Add tests or source-level contracts for:

- `createGameplayRenderer` exposes a pause/resume/reset timing boundary.
- `GameplayScreen.svelte` calls pause when Pause Menu opens.
- `GameplayScreen.svelte` calls resume and resets timing when Resume happens.
- The renderer boundary remains independent of menu item labels and app navigation.

### UI Source Tests

Add source-level Svelte tests for:

- Pause Menu renders overlay, panel, kicker, title, rule, four menu items, and shared `ControlHints`.
- Pause item labels come from localization/copy references, not inline English.
- Rows use indexed markup and active class.
- CSS includes the prototype-equivalent overlay, panel, staggered item animation, and container-query sizing.
- `GameplayScreen.svelte` gives Stage Result input precedence over Pause Menu input.

### Browser Verification

Use the in-app browser after implementation:

- Active gameplay can open Pause Menu.
- Resume continues gameplay without timer jump.
- Restart remounts the stage.
- Settings opens over paused gameplay and returns to Pause Menu.
- Return to Stage Select leaves gameplay.
- Visual layout matches prototype proportions at desktop and smaller 16:9 frame sizes.

## Verification

Before completion, run:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
- a prototype-boundary scan confirming rebuild runtime source does not import from `__prototype__`.
- browser verification against the rebuilt Pause Menu.

## Out Of Scope

- Touch virtual controls beyond accepting a future pause callback path.
- Save persistence or unlock updates.
- New audio assets.
- Reworking the entire Settings screen architecture unless needed for pause-origin return behavior.
- Pause support during Stage Result.
- Pause support during future story/AVG overlays that are not yet rebuilt.
