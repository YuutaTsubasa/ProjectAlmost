status: complete

commit hash: e60776c

red test command and failure summary:
`npm run test -- src/application/progression/appStageProgressionWiring.test.ts`
Failed as expected with 1 failing source-contract test:
- `App stage progression record wiring > resets gameplay music state before syncing music after control intent enters gameplay`

Failure reason: `src/App.svelte` did not contain the expected `enteredGameplay` guard or `gameplayMusicState = initialGameplayMusicState` reset in `handleControlIntent` before `syncMusicForCurrentState()`.

green test/check command summaries:
- `npm run test -- src/application/progression/appStageProgressionWiring.test.ts src/ui/gameplay/gameplayScreenStageClear.test.ts src/application/audio/audioCommands.test.ts`: 3 files passed, 24 tests passed.
- `npm run check`: svelte-check and TypeScript passed with 0 errors and 0 warnings.
- `npm run build`: Vite build passed; Vite reported the existing large chunk warning for the main JS bundle.
- `git diff --check`: passed with no whitespace errors.

files changed:
- `src/App.svelte`
- `src/application/progression/appStageProgressionWiring.test.ts`
- `.superpowers/sdd/task-4-fix-report.md`

concerns:
- `AGENTS.md` asks for new behavior specs under `docs/superpowers/specs/`, but the task's allowed-file list did not include that directory. This fix treats the supplied review finding as the approved scoped contract and records evidence here instead.
