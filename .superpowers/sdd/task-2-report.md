# Task 2 Report: Rebuilt Stage Source Catalog

## RED

Command:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Result:

- Failed as expected.
- `gameplayStageMaps.order` had length `1` instead of `36`.
- `gameplayStageMaps.order` did not align with `stages.order`.
- `gameplayStageConversionDiagnostics` was not exported yet, so the diagnostics assertion threw on `undefined`.

## GREEN

Focused verification:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Result:

- `gameplayStageMaps.test.ts`: passed, 1 file and 27 tests green.
- `gameplayStageMapConverter.test.ts`: passed, 1 file and 7 tests green.

Project verification:

```bash
npm run check
npm run build
git diff --check
rg -n "__prototype__" src/domain/gameplay/gameplayStageSources.ts src/domain/gameplay/gameplayStageMaps.ts
npm run test
```

Result:

- `npm run check`: passed with 0 errors and 0 warnings.
- `npm run build`: passed. Vite reported the existing large-chunk warning after a successful build.
- `git diff --check`: passed with no whitespace issues.
- `rg -n "__prototype__" ...`: no matches in the rebuilt catalog or map assembly files.
- `npm run test`: failed in existing HUD and renderer tests that still expect the old hand-authored `1-1` sample to contain an early Azure Core and the old guard placement. The new converter-backed `1-1` now reflects prototype source data, so those out-of-scope tests need their own update.

## Files Changed

- `src/domain/gameplay/gameplayStageSources.ts`
- `src/domain/gameplay/gameplayStageMaps.ts`
- `src/domain/gameplay/gameplayStageMaps.test.ts`
- `.superpowers/sdd/task-2-report.md`

## Commit

- `aa956c6` - `feat: convert gameplay stage source catalog`

## Self-Review

- The rebuilt project now owns a static `GameplayStageSource` catalog for all 36 normal stages with no runtime import from `__prototype__/`.
- `gameplayStageMaps` is assembled purely through `convertGameplayStageSource`, and catalog diagnostics are exposed at the domain boundary.
- The generated source catalog keeps unsupported mechanics present as data so the converter can emit stable diagnostics while producing renderer-safe maps.
- The catalog tests now verify stage ordering, full map availability, bounds, id uniqueness, diagnostics, and rebuilt asset-path constraints across the full slice.

## Concerns

- Full `npm run test` is not green because `src/domain/gameplay/gameplayHud.test.ts` and `src/ui/gameplay/createGameplayRenderer.test.ts` still assert the old manual `1-1` enemy composition and coordinates. The task brief explicitly excluded renderer-test updates, so I am carrying that as the remaining concern on this commit.
