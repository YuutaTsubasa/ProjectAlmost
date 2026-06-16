# Project Almost

Project Almost is a browser-based 2D action platformer built with Svelte, TypeScript, Vite, and Phaser. The current playable slice follows a single armored character through the White Palace, with fast traversal centered on jumping, attacking, and Homing Attacks.

This README is also the handoff document for humans and coding agents collaborating on the project.

## Agent Workflow

Before changing code in a new session, read `AGENTS.md`, then follow `docs/PROJECT_WORKFLOW.md`.

For larger features, write a short brief using `docs/templates/FEATURE_BRIEF.md` before editing. The brief should identify which boundaries are touched: Svelte UI, Phaser gameplay, stage JSON, assets/preload, save data, localization, and responsive CSS.

Use `docs/ARCHITECTURE_MAP.md` to decide where behavior belongs. In particular, avoid mutable module-level runtime state for individual stages, platforms, hazards, enemies, bosses, or asset variants.

For the longer-term architecture direction, read `docs/ARCHITECTURE_REVIEW_TDD_DDD.md`. New systems should move toward TDD-driven pure domain rules with Svelte and Phaser acting as adapters.

## Current State

The game currently includes:

- Title Screen, World Select, Stage Select, Gameplay, Pause Menu, Settings, and Stage Result.
- Six named worlds with themed World Select and Stage Select backgrounds.
- Two playable White Palace stages: `1-1` and `1-2`.
- Keyboard, gamepad, and touch controls.
- Homing Attack targeting, chained traversal through Azure Cores, and persistent blue afterimages.
- Coins, enemies, checkpoints, goal flags, death/restart flow, and stage results.
- Per-stage rank targets, best records, stage unlocking, and local save data.
- English, Japanese, Traditional Chinese, and Korean UI.
- Music and sound effects with configurable volume.
- Startup asset preload and responsive 16:9 presentation.

The project is still a prototype-quality vertical slice. Most content after World 01 and Stage `1-2` is placeholder or locked.

## Run Locally

Requirements:

- Node.js
- npm

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run check
npm run build
npm run preview
```

Before committing, run at least `npm run check`, `npm run build`, and `git diff --check`.

## Screen Flow

```text
Boot / Preload
  -> Title Screen
  -> World Select
  -> Stage Select
  -> Gameplay
  -> Stage Result

Gameplay
  -> Pause Menu
  -> Settings
  -> Stage Select
```

`src/App.svelte` currently owns this screen state machine, global transitions, music switching, settings, gamepad routing, save updates, and the Phaser game lifecycle.

## Project Structure

```text
src/
  App.svelte                    Application shell and screen flow
  TitleScreen.svelte            Title menu
  WorldSelect.svelte            Six-world selector
  StageSelect.svelte            Stage map and stage details
  StageResult.svelte            Clear results and next/retry actions
  SettingsPanel.svelte          Audio, language, display, and save settings
  VirtualControls.svelte        Touch joystick and action buttons
  app.css                       Shared UI, HUD, responsive, and transition styles
  i18n.ts                       Four-language key/value dictionaries

  game/
    assets/assetManifest.ts     Images, music, SFX, fonts, and preload list
    createGame.ts               Phaser configuration and scene startup
    objects/objectDefinitions.ts
                                Object placement, body, origin, and visual rules
    save/saveData.ts            localStorage save records and stage unlocking
    scenes/GameplayScene.ts     Core gameplay, physics, HUD events, and audio events
    stages/
      stageTypes.ts             JSON stage schema
      stageRegistry.ts          Registered stages, validation, and stage selection
      1-1.json                  White Palace stage data
      1-2.json                  White Palace stage data

public/assets/
  audio/                        BGM and SFX used by the game
  fonts/                        Locally hosted HUD fonts
  hud/                          Portrait and navigator art
  maps/                         World and stage backgrounds
  props/                        Checkpoint and goal art
  results/                      Stage Result character art
  sprites/                      Player and enemy animation sheets
  tiles/                        Gameplay tilesets
  title/                        Title Screen art

__DESIGN__/                     Claude Design references; not loaded by the game
```

## Important Architecture Rules

### Assets and Preload

All runtime assets should live under `public/assets/`. Register new runtime images, music, SFX, or fonts in `src/game/assets/assetManifest.ts`.

`PRELOAD_ASSETS` is generated from that manifest. Assets referenced only from CSS but omitted from the manifest will load late when a screen first appears. When adding a new background or UI image, register it in `IMAGE_ASSETS` even if TypeScript does not directly import it.

Files in `__DESIGN__/` are design references or source material. They are not runtime assets.

### Stage Data

Playable stage layouts are JSON files under `src/game/stages/`.

To add a stage:

1. Create a JSON file matching `StageData` in `stageTypes.ts`.
2. Import and register it in `stageRegistry.ts`.
3. Add translated stage labels in `src/i18n.ts`.
4. Update Stage Select presentation if the world needs a real stage map.
5. Run validation and play through the full stage.

Grounded objects use `surfaceY`, not arbitrary sprite coordinates. `stageRegistry.ts` validates that player spawn, grounded enemies, checkpoints, respawns, and goals align with platform surfaces.

Object origins, collision bodies, and bottom alignment belong in `objectDefinitions.ts`. Do not compensate for transparent sprite padding independently in each stage JSON.

### Gameplay and UI Communication

Phaser gameplay runs in `GameplayScene.ts`. Svelte owns menus and HUD presentation.

Gameplay reports state through `projectrun:hud` events. UI-triggered sounds use `projectrun:sfx`. Preserve this boundary unless there is a clear reason to replace the event contract.

### Localization

Do not add visible UI strings directly to components when they need localization. Add a key to the English dictionary in `src/i18n.ts`, then provide Japanese, Traditional Chinese, and Korean values.

### Save Data

Save data is stored in `localStorage` under `project-almost:save`. Settings use `project-almost:settings`.

Changing the save schema requires a version/migration decision. Do not silently reinterpret existing records.

## Current Design Decisions

- World Select and Stage Select intentionally share each world's background.
- Their transition preserves the background and swaps UI using a subtle directional glass/light sweep.
- World Select uses the world's `_bgm`; Stage Select uses the world's `_map`; Gameplay uses the world's `_bgm`.
- Azure Cores are enemies and Homing Attack traversal anchors. Regenerating Azure Cores do not count toward permanent enemy-clear scoring.
- Homing Attack should feel nearly instant, ignore intervening walls, collect coins along its trail, and leave a continuous blue afterimage.
- Rank targets are stage-specific. Current implemented stages have their own timing requirements.
- The visual direction is white/blue fantasy UI with restrained gold accents and detailed illustrated world backgrounds.

## Suggested Next Work

### High Priority

- Finish and balance World 01 stages `1-3` through `1-6`.
- Extend and refine `1-1` and `1-2`; both are still relatively short.
- Create a repeatable workflow or editor for authoring stage JSON and validating platform/object placement.
- Split the large `GameplayScene.ts` into focused gameplay systems before adding substantially more mechanics.
- Test all major flows on real mobile devices, especially touch target size, text scaling, and landscape browser chrome.

### Gameplay and Content

- Add more enemy types for ground, airborne, ranged, and traversal roles.
- Decide the final rank formula and scoring weights for time, coins, damage, falls, enemies, and checkpoints.
- Add stage-specific objectives beyond reaching the goal.
- Expand tilesets, foregrounds, parallax layers, hazards, and world-specific gameplay.
- Add a proper World Select/Stage Select content model instead of placeholder stages embedded in components.

### Product and UX

- Add Save Slots / Profile.
- Improve loading feedback for larger asset sets and consider per-world preload groups.
- Add remappable controls and clearer touch-control onboarding.
- Audit accessibility, focus states, reduced motion, and localization overflow.
- Add automated smoke tests for Title -> World -> Stage -> Gameplay -> Result navigation.

### Technical Debt

- `src/app.css` is large and should eventually be separated by screen/system.
- `App.svelte` owns many unrelated responsibilities and should be decomposed carefully.
- Some Stage Select content is hard-coded for World 01 or placeholder worlds.
- The production bundle currently emits a large-chunk warning.

## Collaboration Notes

- Check `git status` before editing. Other agents may have uncommitted work.
- Keep changes scoped and do not revert unrelated modifications.
- Coordinate ownership before modifying `App.svelte`, `GameplayScene.ts`, or `app.css`; they are current conflict hotspots.
- Prefer separate branches for parallel work. Codex branches should use the `codex/` prefix.
- Include generated runtime assets under `public/assets/` and their manifest entries in the same commit.
- Preserve design references in `__DESIGN__/` when they explain an implemented screen.
- For sprite and map generation, the project has used the `generate2dsprite` and `generate2dmap` skills derived from Agent Sprite Forge workflows.
- Verify frontend changes in the running app, not only through type checking.

## Known Reference Files

- `__DESIGN__/White Palace 1-1 (download).html`
- `__DESIGN__/Stage Select (download).html`
- `__DESIGN__/Stage Result (download).html`
- `__DESIGN__/World Select C (download).html`

These files are useful visual references, but the production implementation lives in Svelte/CSS and may intentionally differ where interaction or responsive behavior requires it.
