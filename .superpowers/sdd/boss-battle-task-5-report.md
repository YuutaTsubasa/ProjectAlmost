Status: Implemented and verified.

RED summary:
- Added a localization catalog test covering `gameplayHud.bossPhase`, `gameplayHud.bossPhaseHint`, `status.bossPattern`, `status.bossVulnerable`, and `status.bossDefeated` across all supported locales.
- Added a HUD source test covering conditional boss-phase panel rendering and key placeholder wiring.
- Verified the focused RED run failed because the new catalog keys and HUD panel were missing.

GREEN summaries:
- Added boss HUD and boss status localization key types plus catalog entries for `en`, `ja`, `zhHant`, and `ko`.
- Added a scoped boss-phase HUD panel to `GameplayHud.svelte` using existing source-tested placeholder key patterns and cqw/cqh layout sizing.
- Verified the focused boss HUD tests pass.
- Verified `npm run check` passes.
- Verified `git diff --check` passes.

Files changed:
- `src/domain/data/localize/localize.ts`
- `src/domain/data/localize/localize.test.ts`
- `src/ui/gameplay/GameplayHud.svelte`
- `src/ui/gameplay/gameplayHudUi.test.ts`
- `.superpowers/sdd/boss-battle-task-5-report.md`

Commit hash: PENDING

Concerns:
- The design doc uses `hud.bossPhase` / `hud.bossPhaseHint`, while the task brief requires `gameplayHud.bossPhase` / `gameplayHud.bossPhaseHint`; this implementation follows the task brief as the stated requirements source.
- The HUD still renders placeholder localization keys for this new panel, matching the task brief's scoped approach and avoiding a broader HUD localization refactor in Task 5.

---

Task 5 review fix report:

- Updated boss HUD localization keys from `gameplayHud.*` to spec-aligned `hud.*` without keeping duplicate aliases.
- Changed `GameplayHud.svelte` to resolve visible boss panel copy through `resolveLocalizedText(localize, locale, key)` with a scoped default locale.
- Added a HUD source regression test that requires localized boss text wiring and rejects raw boss localization key literals as visible markup.

Command summaries:

- `npm run test -- src/domain/data/localize/localize.test.ts src/ui/gameplay/gameplayHudUi.test.ts` (RED): failed because `hud.bossPhase` fell back to the raw key and `GameplayHud.svelte` did not use `resolveLocalizedText`.
- `npm run test -- src/domain/data/localize/localize.test.ts src/ui/gameplay/gameplayHudUi.test.ts` (GREEN): passed, 2 files and 22 tests green.
- `npm run check`: passed, `svelte-check found 0 errors and 0 warnings`.
- `git diff --check`: passed with no output.
