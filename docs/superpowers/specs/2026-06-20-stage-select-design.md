# Stage Select Design

## Goal

Build the first rebuild Stage Select page as a static selectable UI slice that follows the project architecture: deterministic domain data and app flow, reactive Svelte presentation, localized visible text, existing UI SFX, and world-specific music policy. The page appears after World Select and uses the prototype-style map layout.

## Approved Scope

- Use the `__prototype__/src/StageSelect.svelte` visual direction: stage map background, connected stage nodes, left detail panel, back button, deploy button, and compact control hints.
- Add first-class Stage data to the rebuild data system.
- Connect all visible Stage Select text to the localization system.
- Connect Stage Select navigation to the existing music and SFX systems.
- Connect keyboard and gamepad controls so World Select confirmation opens Stage Select.
- Keep this slice static and selectable: every stage is available, and record fields show static default display values such as `--:--.--` and `--`. Save data, unlock rules, gameplay loading, clear records, rank records, and stage JSON loading are out of scope.

## Architecture

Create a pure domain Stage catalog under `src/domain/data/stages/`. `StageData` describes all 36 stages and is keyed by `StageId`. Each stage has UI-ready metadata: `id`, `worldId`, `number`, `titleRef`, `subtitleRef`, `objectiveRef`, `nodePosition`, `previewAssetRef`, and `isBoss`. `StageCatalog` exposes an `order` list plus `items` map, matching the existing world catalog style. Stage collectible totals are not owned by `StageData`; Stage Select receives a projected collectible target derived from the gameplay map coins so the UI cannot drift from playable stage data.

Expose the catalog through `projectData`:

```ts
export const projectData = {
  localize,
  worlds,
  stages,
}
```

Keep `WorldData.stageIds` as the source of the relationship between a world and its stages. Tests must prove every world stage id exists in `projectData.stages`.

Extend `AppScreen` with:

```ts
export type StageSelectScreen = {
  type: 'stage-select'
  selectedWorldIndex: number
  worldId: WorldId
  selectedStageIndex: number
}
```

`confirmSelectedWorld` transitions from `world-select` to `stage-select`, preserving the selected world and selecting that world's first stage. `moveStageSelection` wraps within the selected world's six stages. `selectStage` selects a stage by index. `confirmSelectedStage` is a no-op for this slice because gameplay entry is out of scope. `backFromStageSelect` returns to `world-select` with the original world selected.

## UI

Create `src/ui/stage/StageSelectScreen.svelte`. The component receives catalogs and current screen state as props. It resolves localized stage and world text, renders selected-stage details, renders the selected world's map background, and emits callbacks for control intents and pointer selection.

The layout follows the approved visual direction:

- Full-screen selected world map background from root `public/assets/maps/*_stage_select.webp`.
- Center/top banner for the localized Stage Select title.
- Left translucent detail panel with prototype-style layered preview art, a compact selected-stage heading, localized stage subtitle, localized objective, collectible count, unavailable-record placeholders sourced from existing localization keys, and deploy button. The preview uses the gameplay foreground loop over the matching sky/background layer. The panel must not add separate world title/subtitle lines above the selected stage because that diverges from the prototype information density.
- Connected stage nodes positioned by `StageData.nodePosition`.
- Back button and compact control hints matching the rebuild UI language, with key labels paired to localized action labels.
- Stage nodes show stable stage ids such as `1-1`, matching the prototype. The selected-node tooltip is compact: stage id plus localized subtitle, not full localized title copy.
- Boss stage nodes use the same form as normal stage nodes with a red visual treatment.
- Title Screen, World Select, Settings, and Stage Select share a single control-hints component. The component owns the black-background control-hint presentation and accepts hint data so a later input-device adapter can switch labels for keyboard/mouse, touch, or controller.

The component must not read browser storage, dispatch global audio events, import prototype runtime code, or import stage JSON files from `__prototype__/`. It only renders data and emits user intents.

## Localization

Extend `src/domain/data/localize/localize.ts` with Stage Select labels and stage text keys:

- Stage Select labels: title, objective, collectibles, best time, rank, active character, deploy, record unavailable, and aria labels.
- Stage text: title, subtitle, and objective refs for all 36 stages.

All visible Stage Select text must resolve through `resolveLocalizedText`. Four locale catalogs (`en`, `ja`, `zhHant`, `ko`) must contain every new key. Stage subtitle copy follows the prototype localization catalog so the rebuild Stage Select presents the same stage names while still using rebuild-localized keys.

## Input Flow

Extend `ControlContext` with `stage-select`. Keyboard and gamepad behavior matches World Select:

- Left/up: previous stage.
- Right/down: next stage.
- Enter/Space or south gamepad button: confirm selected stage.
- Escape or east gamepad button: back to World Select.

`applyControlIntent` routes these intents through pure app-flow functions. Pointer selection updates the selected stage and double-clicking a stage confirms it, though confirmation remains a no-op in this slice.

## Audio

Stage Select uses the existing audio command path. UI SFX actions are derived by `getControlIntentSfxAction`:

- Stage selection changes play `move`.
- Confirm plays `confirm`.
- Back plays `back`.

`getMusicForScreen` handles `stage-select` and returns the selected world's map music track (`worldXXMap`) so Stage Select matches the prototype's `worldXX_map.mp3` behavior. World Select continues to use the selected world's BGM track (`worldXXBgm`).

## Data Boundaries

The prototype is a visual and behavioral reference only. The rebuild must not import from `__prototype__/src`, must not store new runtime assets under `__prototype__/public`, and must not create `__prototype__/rebuild/`.

Runtime asset references must point to root `public/` paths. Existing stage-select map backgrounds are already available under `public/assets/maps/`. Prototype preview art used by the rebuild must be copied into root `public/assets/maps/`; rebuild data must not reference `__prototype__/public`.

## Testing Plan

Use TDD for domain and application behavior:

1. Add failing stage catalog tests proving there are 36 stages, every world's `stageIds` exists, each stage belongs to its world, positions are percentages, and localization refs resolve.
2. Add failing app-flow tests for World Select confirmation entering Stage Select, stage selection wraparound, direct stage selection, Stage Select back returning to the same world, and selected-stage confirmation being a no-op.
3. Add failing input tests for `stage-select` keyboard and gamepad mappings.
4. Add failing audio tests proving Stage Select uses the selected world's BGM and stage movement triggers move SFX.
5. Implement the smallest domain/application changes to pass those tests.
6. Add the Svelte component and App wiring.
7. Run focused tests, then full required checks.

Before finishing the implementation, run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Report any command that cannot run and why.

## Out Of Scope

- Save data persistence.
- Unlock progression.
- Stage clear records, best time, best rank, or max coin persistence.
- Gameplay scene loading.
- Stage JSON registry migration.
- New map-theme audio assets.
- Tauri Rust changes.
