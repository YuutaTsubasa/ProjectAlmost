export type CheckpointSpriteDefinition = {
  key: string
  assetRef: string
}

export const checkpointActorDefinition = {
  behavior: 'checkpoint',
  sprite: {
    key: 'checkpoint-beacon',
    assetRef: '/assets/props/white_palace_checkpoint.webp',
  },
  origin: { x: 0.5, y: 1 },
  displaySize: { width: 76, height: 114 },
  visualBottomInset: 0,
  depth: 7,
  inactiveAlpha: 0.82,
  activatedAlpha: 1,
  activatedTint: 0xfff0a8,
  glow: {
    width: 92,
    height: 20,
    yOffset: -3,
    depth: 6,
    alpha: 0.24,
  },
  ring: {
    width: 74,
    height: 74,
    yOffset: -52,
    depth: 8,
    strokeWidth: 3,
    alpha: 0.7,
  },
  idleTween: {
    durationMs: 920,
    indexDelayMs: 130,
    alphaFrom: 0.24,
    alphaTo: 0.68,
    scaleFrom: 0.92,
    scaleTo: 1.14,
    ease: 'Sine.easeInOut',
  },
  activationTween: {
    durationMs: 180,
    spriteScaleMultiplier: 1.12,
  },
} as const

export function getCheckpointBottomY(input: {
  surfaceY: number
}): number {
  return input.surfaceY + checkpointActorDefinition.visualBottomInset
}
