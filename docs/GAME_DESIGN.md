# Game Design

## Working Pitch

ProjectRun is a side-scrolling action platformer about a knight ordered by the princess to recover a stolen treasure. Across six worlds, the knight discovers that the treasure is actually a demon seal and that the thief is a hero trying to prevent disaster. The final act ends in a battle against the released demon.

## Story Outline

- The princess sends the knight to retrieve a treasure stolen by a thief.
- The knight crosses six major regions while pursuing the thief.
- The treasure is revealed to be a seal that contains a demon.
- The thief is revealed to be a hero, not a villain.
- The final confrontation is against the demon.

## World Structure

| World | Scene | Stages | Boss |
| --- | --- | ---: | --- |
| 1 | White Palace | 3 | Yes |
| 2 | Forest | 3 | Yes |
| 3 | Ocean | 3 | Yes |
| 4 | Snow Mountain | 3 | Yes |
| 5 | Volcano | 3 | Yes |
| 6 | Demon Stronghold | 3 | Final Boss |

Each stage contains 5 collectible coins.

## Playable Characters

- Knight.
- Princess.

Both playable characters share the same controls and gameplay abilities. Their differences are visual presentation, animation identity, and possibly story framing.

## Core Mechanics

### Movement

- Move left and right.
- Run by holding a dedicated input to increase speed.

### Jumping

- Basic jump.

### Attacking

- Melee attack.
- Homing Attack: while airborne, lock onto an enemy within range and dash into it.

### Collection

- Each stage has 5 collectible coins.

## Input Support

- Keyboard for PC.
- Touch virtual buttons for mobile.
- Gamepad controller.

## First Vertical Slice

- One playable knight scene using final-reference sprites.
- One 2-screen prototype level.
- Left/right movement, run modifier, jump, melee attack.
- One enemy target for melee and homing attack tests.
- Five collectible coins in the prototype stage.
- Respawn after falling below the level.
- HUD shows current stage objective and collected coin count.

## Non-Goals For The First Slice

- Full six-world campaign.
- Final boss implementation.
- Complete mobile UI polish.
- Save data.
- Final music and sound effects.
