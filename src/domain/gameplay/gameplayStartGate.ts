export type GameplayStartGateState =
  | { status: 'waiting-unarmed' }
  | { status: 'waiting-armed' }
  | { status: 'running' }

export type GameplayStartInputSnapshot = {
  leftHeld: boolean
  rightHeld: boolean
  crouchHeld: boolean
  jumpPressed: boolean
  jumpHeld: boolean
  attackPressed: boolean
  attackHeld: boolean
}

export function createInitialGameplayStartGateState(): GameplayStartGateState {
  return { status: 'waiting-unarmed' }
}

export function isGameplayStartGateRunning(state: GameplayStartGateState): boolean {
  return state.status === 'running'
}

export function advanceGameplayStartGate(
  state: GameplayStartGateState,
  input: GameplayStartInputSnapshot,
): GameplayStartGateState {
  if (state.status === 'running') {
    return state
  }

  const gameplayInputActive = hasGameplayStartInput(input)

  if (state.status === 'waiting-unarmed') {
    return gameplayInputActive ? state : { status: 'waiting-armed' }
  }

  return gameplayInputActive ? { status: 'running' } : state
}

function hasGameplayStartInput(input: GameplayStartInputSnapshot): boolean {
  return input.leftHeld ||
    input.rightHeld ||
    input.crouchHeld ||
    input.jumpPressed ||
    input.jumpHeld ||
    input.attackPressed ||
    input.attackHeld
}
