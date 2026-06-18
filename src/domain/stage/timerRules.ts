export function shouldAdvanceStageTimer(input: {
  timerStarted: boolean
  stageCleared: boolean
  dead: boolean
}): boolean {
  return input.timerStarted && !input.stageCleared && !input.dead
}

export function shouldStartStageAction(input: {
  timerStarted: boolean
  left: boolean
  right: boolean
  crouchHeld: boolean
  jumpPressed: boolean
  attackPressed: boolean
}): boolean {
  return !input.timerStarted
    && (input.left || input.right || input.crouchHeld || input.jumpPressed || input.attackPressed)
}

export function formatStageTimer(input: {
  elapsedMs: number
}): string {
  const totalCentiseconds = Math.floor(input.elapsedMs / 10)
  const minutes = Math.floor(totalCentiseconds / 6000)
  const seconds = Math.floor((totalCentiseconds % 6000) / 100)
  const centiseconds = totalCentiseconds % 100

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}
