# White Palace 1-1

## Runtime Contract

- Mode: side-scroll platformer.
- World: `6400x1080`.
- Tile size: `64x64`.
- Objective: reach the GOAL flag.
- Respawn: latest activated checkpoint.
- Runtime objects remain separate from scenery: platforms, coins, enemies, checkpoints, and goal.

## Progression

| Section | Range | Purpose |
| --- | ---: | --- |
| Safe Start | `0-900` | Introduce movement and jumping with a wide safe platform. |
| Jump School | `900-2380` | Teach gap judgment and vertical platform changes using coin trails. |
| First Combat | `2380-3260` | Introduce a single grounded guard in a wide arena. |
| Homing Crossing | `3260-4220` | Use elevated guards as Homing Attack targets across a large gap. |
| Final Ascent | `4220-6400` | Combine movement, combat, and ascending platforms before the GOAL flag. |

## Scene Hooks

- Checkpoint `combat-gate`: activated before the first combat arena.
- Checkpoint `final-ascent`: activated after the Homing Attack crossing.
- Goal: animated White Palace GOAL flag at the end of the final ascent.

## Reference

- Stage reference: `assets/source/generated/white_palace_1_1_stage_reference/stage-reference.png`.
- The stage reference is planning-only and must not be used as a runtime background or collision source.
