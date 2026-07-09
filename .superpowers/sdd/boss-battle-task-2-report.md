Status: DONE

RED command and failure summary:
- `npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts`
- Failed as expected with 4 test failures: converted boss enemies did not preserve `respawnPolicy`/`countsForScore`, and `createInitialGameplayHudState` did not expose `bossPhase`/`bossPhaseMax`.

GREEN commands and pass summaries:
- `npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts`
- Passed: 3 files, 51 tests.
- `npm run test`
- Passed: 49 files, 509 tests.
- `git diff --check`
- Passed with no diff whitespace or conflict-marker issues.

Files changed:
- `src/domain/gameplay/gameplayMapTypes.ts`
- `src/domain/gameplay/gameplayStageMapConverter.ts`
- `src/domain/gameplay/gameplayStageMapConverter.test.ts`
- `src/domain/gameplay/gameplayStageMaps.test.ts`
- `src/domain/gameplay/gameplayHud.ts`
- `src/domain/gameplay/gameplayHud.test.ts`
- `.superpowers/sdd/boss-battle-task-2-report.md`

Commit hash:
- `7073840`

Concerns, if any:
- None.
