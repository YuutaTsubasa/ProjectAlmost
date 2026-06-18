export type StageClearState = {
  stageCleared: boolean
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export function getStageClearState(): StageClearState {
  return {
    stageCleared: true,
    attacking: false,
    homingAttacking: false,
    attackReady: false,
  }
}
