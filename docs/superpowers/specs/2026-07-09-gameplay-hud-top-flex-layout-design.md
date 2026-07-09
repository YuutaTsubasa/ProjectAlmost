# Gameplay HUD Top Balanced Layout Design

## Goal

Refactor the gameplay HUD top area so it is organized by layout containers instead of each panel owning independent absolute coordinates.

The visible result should preserve the current prototype-aligned HUD composition, keep the stage banner visually centered in the resolution frame, and make the structure easier to extend for future HUD elements.

## Current Problem

The top HUD currently places status, stage banner, map, objective, and boss phase panels with separate absolute `top`, `left`, and `right` rules. This makes related groups hard to reason about:

- The left status and boss phase panels are visually related, but their spacing is duplicated through separate coordinates.
- The right map and objective panels are visually related, but their spacing is also duplicated.
- The center stage banner is positioned independently from both side groups.
- Adding another top-left or top-right panel would require more manual coordinate math.
- If the top row uses a simple flex row, unequal left and right content widths can make the center banner look visually offset even when it is centered inside the remaining middle space.

## Target Structure

`GameplayHud.svelte` should render one top-level layout row:

- `.top-hud`: absolute overlay row anchored to the top of the resolution frame.
- `.top-left-hud`: vertical flex stack containing player status and boss phase HUD.
- `.top-center-hud`: center region containing the stage banner.
- `.top-right-hud`: vertical flex stack containing map overview and objective HUD.

The bottom HUD remains unchanged in this slice.

## Layout Rules

- `.top-hud` owns the absolute top, left, and right offsets.
- `.top-hud` uses grid layout with equal left and right side tracks so the center track is aligned to the resolution-frame center.
- The side track width is controlled by a CSS custom property based on the wider top side content.
- The right stack keeps its narrower content width and aligns to the end of the right side track.
- Left and right top stacks use the same CSS custom property for vertical spacing.
- Status, boss phase, map, and objective panels are normal-flow children of their stack containers.
- The stage banner is a normal-flow child of the center container.
- HUD geometry continues to use container-query units (`cqw`/`cqh`) against the resolution frame.
- Do not introduce viewport units or mixed pixel/container `min()`, `max()`, `clamp()`, or breakpoint-based layout changes.

## Testing Strategy

Update `src/ui/gameplay/gameplayHudUi.test.ts` to assert:

- The top HUD exposes `.top-hud`, `.top-left-hud`, `.top-center-hud`, and `.top-right-hud`.
- Status and boss phase HUD are in the left stack.
- Stage banner is in the center stack.
- Map and objective HUD are in the right stack.
- The top HUD grid uses equal side tracks around the center track.
- The right HUD stack is end-aligned inside its side track.
- Left and right stacks share the same gap token.
- Top panels no longer carry independent absolute `top`, `left`, or `right` coordinates.
- Existing resolution-frame sizing constraints remain enforced.

## Acceptance Criteria

- The top HUD is driven by three layout regions with balanced side tracks.
- Left and right vertical spacing is consistent.
- The stage banner is visually centered against the whole resolution frame, not merely centered between unequal side contents.
- Existing HUD content and bindings are preserved.
- Focused UI tests, full test suite, Svelte check, build, and whitespace checks pass.
