# P2 Slice 34: Gameplay HUD Label Format

## Target Behavior

Move the existing gameplay HUD label formatting for health and coins out of `GameplayScene` and into pure domain functions.

The scene should still own player health, max health, collected coin count, coin target count, and HUD dispatch side effects. The domain layer should only answer how those values are displayed by the current gameplay HUD.

## Boundary

- Domain: format health and coin numeric values into existing HUD labels.
- Phaser adapter: pass the current scene values into the domain functions.

## Files Expected To Change

- `src/domain/stage/hudLabelRules.ts`
- `src/domain/stage/hudLabelRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing labels exactly:
  - health: `HP current/max`
  - coins: `COIN 000 / target`
- Keep the existing three-digit left padding for collected coins.
- Do not change HUD event payloads, player health rules, coin collection rules, scoring, localization, or UI layout.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- `formatHealthLabel({ current: 3, max: 3 }) -> HP 3/3`
- `formatHealthLabel({ current: 0, max: 3 }) -> HP 0/3`
- `formatCoinLabel({ collected: 0, target: 25 }) -> COIN 000 / 25`
- `formatCoinLabel({ collected: 7, target: 25 }) -> COIN 007 / 25`
- `formatCoinLabel({ collected: 25, target: 25 }) -> COIN 025 / 25`
- `formatCoinLabel({ collected: 125, target: 125 }) -> COIN 125 / 125`

## Validation Plan

1. Run the focused HUD label test and observe RED before implementation.
2. Implement pure label formatters and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
