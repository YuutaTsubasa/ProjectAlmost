## Task 2 Report: Converter And Catalog Wiring

### RED

- Updated `src/domain/gameplay/gameplayStageMapConverter.test.ts` to assert visual-profile-driven conversion with no fallback diagnostics.
- Updated `src/domain/gameplay/gameplayStageMaps.test.ts` to assert representative stage asset refs and copied Emerald Sanctuary assets.
- Ran `npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts`.
- Observed expected failure in `uses complete non-white theme profiles without fallback diagnostics` because the converter still forced the legacy `mid` layer width to `1920` instead of preserving the visual profile's `3840`.

### GREEN

- Rewired `convertGameplayStageSource` to consume `gameplayStageVisualProfiles` and copy profile-authored background layers directly.
- Removed legacy theme fallback asset types and diagnostic code from `src/domain/gameplay/gameplayStageSource.ts`.
- Rewired `src/domain/gameplay/gameplayStageMaps.ts` to convert catalog entries with `gameplayStageVisualProfiles`.
- Copied these rebuilt-project assets from the prototype archive into `public/assets/`:
  - `public/assets/maps/emerald_sanctuary_sky.webp`
  - `public/assets/maps/emerald_sanctuary_far_bg.webp`
  - `public/assets/maps/emerald_sanctuary_mid_bg_loop.webp`
  - `public/assets/maps/emerald_sanctuary_gameplay_bg.webp`
  - `public/assets/tiles/emerald_sanctuary_platform_tiles.webp`
- Ran `npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayStageVisualProfile.test.ts`.
- Result: `3 passed`, `42 passed`.

### REFACTOR

- Kept the converter narrowly focused on source-to-map translation by removing the legacy local background presentation constant and relying on the authored visual profile data.
- Preserved existing unsupported-mechanic diagnostics and cloning behavior for map data.

### Tests Run

- `npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts` — failed as expected during RED
- `npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayStageVisualProfile.test.ts` — passed
- `npm run test` — passed (`47` files, `485` tests)
- `git diff --check` — passed
- `rg -n "__prototype__" src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageVisualProfile.ts public/assets` — no matches

### Files Changed

- `src/domain/gameplay/gameplayStageMapConverter.ts`
- `src/domain/gameplay/gameplayStageMapConverter.test.ts`
- `src/domain/gameplay/gameplayStageMaps.ts`
- `src/domain/gameplay/gameplayStageMaps.test.ts`
- `src/domain/gameplay/gameplayStageSource.ts`
- `public/assets/maps/emerald_sanctuary_sky.webp`
- `public/assets/maps/emerald_sanctuary_far_bg.webp`
- `public/assets/maps/emerald_sanctuary_mid_bg_loop.webp`
- `public/assets/maps/emerald_sanctuary_gameplay_bg.webp`
- `public/assets/tiles/emerald_sanctuary_platform_tiles.webp`

### Concerns

- None.
