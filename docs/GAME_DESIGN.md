# Game Design

## Working Pitch

ProjectRun is a side-scrolling action platformer built around short, readable combat encounters, precise jumps, and fast iteration across Web, desktop, and mobile.

## MVP Scope

- One controllable player character.
- One prototype level with platforms, hazards, and one enemy type.
- Core actions: move, jump, fall, attack, take damage, die, respawn.
- One melee attack with a short active window.
- Camera follows the player through a horizontal stage.
- Placeholder visuals first, generated sprites second.

## Control Targets

- Keyboard: Arrow keys or WASD for movement, Space or W for jump, Z or J for attack.
- Gamepad: left stick or d-pad for movement, south face button for jump, west face button for attack.
- Touch: virtual left/right/jump/attack buttons after the Web loop is stable.

## First Vertical Slice

- Player can run and jump across a 2-screen level.
- Player can defeat one basic enemy.
- Enemy patrols a fixed platform.
- Player respawns after falling below the level.
- HUD shows current objective and debug control hints.

## Non-Goals For The First Slice

- Tauri packaging.
- Mobile touch controls.
- Final art.
- Save data.
- Procedural generation.
- Complex enemy AI.
