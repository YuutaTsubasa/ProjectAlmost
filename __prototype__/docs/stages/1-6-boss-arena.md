# 1-6 The High Spire - Boss Arena Blockout

`1-6` is a fixed boss arena rather than another horizontal platforming stage. The
arena tests the complete World 01 movement vocabulary across five one-hit phases.
The Boss character, projectiles, and phase controller are intentionally not
implemented yet.

Structured layout and phase data lives in:

- `src/game/stages/1-6-boss-arena.json`
- `src/game/stages/bossArenaTypes.ts`

## Arena Shape

- A wide ground floor provides a reliable recovery route.
- Low side platforms support ordinary jump dodges.
- Upper side platforms reward deliberate climbing and create vertical bullet
  routing.
- The small center platform creates a dangerous attack opportunity.
- Four regenerating Azure Cores support lift and cross-arena Homing routes.

## Phase Progression

1. **Royal Fan** teaches the basic bullet gap and attack-window rhythm.
2. **Azure Divide** requires a Homing crossing through the arena center.
3. **Silver Rain** forces movement between platform heights.
4. **Crown Orbit** asks the player to maintain a continuous route.
5. **White Palace Finale** combines abbreviated versions of all prior patterns.

The Boss takes one hit after each completed pattern. On the fifth hit, hostile
projectiles clear and the exit goal appears.

## Required Systems

Before registering `1-6` as playable:

1. Add Boss entities with phase health, invulnerability, and attack windows.
2. Add projectile spawning, collision, cleanup, and deterministic phase resets.
3. Add stage goal visibility and collision gating.
4. Add same-phase player respawn so a fall does not reset completed phases.
5. Add Boss-specific HUD and result scoring.
