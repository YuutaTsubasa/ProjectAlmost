# World 02 Coin Placement Validation Design

## Context

World 02 stages `2-1` through `2-5` contain authored coins, static platforms, moving platforms, and floor spike hazards. A geometry audit found coins whose rendered 44 by 44 bounds intersect platform or spike visuals. Playtesting then found that overlap-free airborne coins could still lead the player into a fatal fall because their vertical landing path ended in a gap or on spikes. Stage `2-6` is a boss stage and intentionally has no coins.

## Scope

- Add a pure domain validator for coin intersections with static platforms, the complete authored travel range of moving platforms, and spike visuals.
- Validate that every coin has a guaranteed static-platform landing directly below it and that the landing area is clear of spikes.
- Correct the conflicting coin coordinates in stages `2-1` through `2-5`.
- Preserve coin counts while moving unsafe airborne coins to the nearest safe static-platform route.
- Keep stage `2-6` at zero coins.
- Validate that checkpoints, checkpoint respawn positions, and goals do not overlap spike hazards.
- Correct unsafe World 02 landmark coordinates without changing platforms or hazards.
- Validate that coin visuals do not overlap the goal visual.

## Geometry

- Coins use the renderer's generated 44 by 44 texture and are centered on their authored point.
- Static platform rectangles use authored tile coordinates and the stage tile size.
- Moving platforms travel from their authored origin in the positive axis by `distance`; validation uses the swept rectangle across that full path.
- Spike visual bounds use authored width and height plus the domain `visualBottomInset`, matching renderer placement.
- A safe landing requires the full coin width to fit within the first static platform below it.
- A spike whose horizontal range intersects the coin width and whose `surfaceY` matches that platform makes the landing unsafe.
- Moving platforms are not guaranteed landing surfaces because their runtime position changes.
- Edge contact is allowed; only positive-area intersections are reported.
- Checkpoint validation uses its rendered width, goal validation uses its collision-body width, and respawn validation uses the standing player collision-body width.
- Landmark and spike ranges are compared only when they share the same authored surface.
- Coin-goal validation uses their complete rendered visual rectangles.

## Testing

- Unit-test rectangle intersection and conflict classification through the public validator.
- Assert that World 02 stages `2-1` through `2-5` have no platform or spike conflicts.
- Assert that World 02 coins have safe static-platform landings without spikes.
- Assert that moving platform travel is included rather than checking only its initial position.
- Assert that stage `2-6` still has zero coins.
- Assert that World 02 checkpoints, respawn positions, and goals are clear of spikes.
- Assert that World 02 coins are clear of goal visuals.

## Out of Scope

- Rebalancing collectible counts or route difficulty.
- Adding coins to boss stages.
- Changing hazard or moving-platform behavior.
