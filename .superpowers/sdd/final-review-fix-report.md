# Final Review Fix Report

## RED

- `npm test -- src/domain/gameplay/stageClear.test.ts`
  - failed on the new boss-clear gate case because `canCompleteStage()` ignored boss defeat state.
- `npm test -- src/ui/gameplay/createGameplayRenderer.test.ts`
  - failed on premature boss-stage goal clear and on the post-defeat goal-clear path assumptions.
- `npm test -- src/ui/gameplay/gameplayHudUi.test.ts`
  - failed because the HUD still hard-coded the objective copy and did not render `state.statusMessageKey`.
- `npm test -- src/domain/data/localize/localize.test.ts`
  - failed because the existing gameplay status keys were not present in the localization catalog.

## GREEN

- Focused:
  - `npm test -- src/domain/gameplay/stageClear.test.ts`
  - `npm test -- src/ui/gameplay/createGameplayRenderer.test.ts`
  - `npm test -- src/ui/gameplay/gameplayHudUi.test.ts`
  - `npm test -- src/domain/data/localize/localize.test.ts`
- Broad:
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `rg -n "__prototype__" src public package.json -g "!*.test.ts"`
  - `git diff --check`

## Files Changed

- `src/domain/gameplay/stageClear.ts`
- `src/domain/gameplay/stageClear.test.ts`
- `src/ui/gameplay/createGameplayRenderer.ts`
- `src/ui/gameplay/createGameplayRenderer.test.ts`
- `src/ui/gameplay/GameplayHud.svelte`
- `src/ui/gameplay/gameplayHudUi.test.ts`
- `src/domain/data/localize/localize.ts`
- `src/domain/data/localize/localize.test.ts`
- `.superpowers/sdd/final-review-fix-report.md`

## Commit

- This report is included in the requested fix commit; use the commit that adds this file as the authoritative hash.

## Concerns

- `status.bossVulnerable` is still localized and typed, but it remains intentionally unemitted in this slice because the current boss flow does not expose a distinct vulnerability state separate from the existing phase-transition messaging.
