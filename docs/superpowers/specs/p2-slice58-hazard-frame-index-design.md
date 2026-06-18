# P2 Slice 58: Hazard Frame Index

## Target Behavior

Move hazard orientation-to-frame mapping out of `GameplayScene` and into the pure placement domain.

The Phaser scene still owns hazard sprite creation, texture selection, display size, and collision bodies. The domain receives a hazard orientation and returns the frame index currently used by the scene.

## Domain Rule

`getHazardFrameIndex(input)` returns:

- `4` for `orientation === 'ceiling'`.
- `3` for `orientation === 'left-wall'`.
- `2` for `orientation === 'right-wall'`.
- `0` for `orientation === 'floor'` or omitted orientation.

This preserves the current scene behavior.

## Files Expected To Change

- `src/domain/placement/objectDefinitions.ts`
- `src/domain/placement/objectDefinitions.test.ts`
- `src/game/objects/objectDefinitions.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change hazard texture selection, body sizing, body offsets, display size, or hazard placement.
- Do not import stage data or Phaser types into the domain.
- Keep `GameplayScene` as the adapter that passes the authored orientation into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function in placement domain and re-export it through the existing game object barrel.
3. Replace the local `GameplayScene.getHazardFrame()` helper with the domain rule.
4. Run the focused placement domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
