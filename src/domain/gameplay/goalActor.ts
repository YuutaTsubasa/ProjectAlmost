export type GoalSpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

export const goalActorDefinition = {
  behavior: 'goal',
  sprite: {
    key: 'stage-goal',
    assetRef: '/assets/props/white_palace_goal_idle.webp',
    frameWidth: 256,
    frameHeight: 256,
  },
  animation: {
    idleKey: 'stage-goal-idle',
    frameStart: 0,
    frameEnd: 3,
    frameRate: 5,
    repeat: -1,
    yoyo: true,
  },
  origin: { x: 0.5, y: 1 },
  displaySize: { width: 96, height: 128 },
  body: { width: 52, height: 112, offsetX: 22, offsetY: 16 },
  visualBottomInset: 6,
  depth: 8,
  activatedTint: 0x4be8ff,
} as const

export function getGoalBottomY(input: {
  surfaceY: number
}): number {
  return input.surfaceY + goalActorDefinition.visualBottomInset
}

export function shouldLockGoalUntilBossDefeated(input: {
  isBossStage: boolean
  bossDefeated: boolean
}): boolean {
  return input.isBossStage && !input.bossDefeated
}
