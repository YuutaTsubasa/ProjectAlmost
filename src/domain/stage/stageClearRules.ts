export type StageClearState = {
  stageCleared: boolean
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export function canCompleteStage(input: {
  stageCleared: boolean
}): boolean {
  return !input.stageCleared
}

export function getStageClearState(): StageClearState {
  return {
    stageCleared: true,
    attacking: false,
    homingAttacking: false,
    attackReady: false,
  }
}
