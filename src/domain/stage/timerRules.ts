export function shouldAdvanceStageTimer(input: {
  timerStarted: boolean
  stageCleared: boolean
  dead: boolean
}): boolean {
  return input.timerStarted && !input.stageCleared && !input.dead
}
