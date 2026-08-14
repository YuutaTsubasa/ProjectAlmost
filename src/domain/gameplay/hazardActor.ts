export type GameplayHazardType = 'spikes'
export type GameplayHazardOrientation = 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
export type HazardBehavior = 'fixed-damage'

export type HazardSpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

export type HazardActorDefinition = {
  behavior: HazardBehavior
  sprite: HazardSpriteDefinition
  origin: { x: number; y: number }
  visualBottomInset: number
}

export type HazardVisualSegment = {
  x: number
  width: number
  height: number
  frame: number
  flipX: boolean
}

const floorSpikeEndCapWidth = 64

export const hazardActorDefinitions = {
  spikes: {
    behavior: 'fixed-damage',
    sprite: {
      key: 'emerald-sanctuary-spikes',
      assetRef: '/assets/props/emerald_sanctuary_spikes.webp',
      frameWidth: 512,
      frameHeight: 512,
    },
    origin: { x: 0.5, y: 0.5 },
    visualBottomInset: 14,
  },
} as const satisfies Record<GameplayHazardType, HazardActorDefinition>

export function getHazardFrameIndex(input: {
  orientation?: GameplayHazardOrientation
}): number {
  if (input.orientation === 'ceiling') return 4
  if (input.orientation === 'left-wall') return 3
  if (input.orientation === 'right-wall') return 2
  return 0
}

export function getHazardVisualSegments(input: {
  x: number
  width: number
  height: number
  orientation?: GameplayHazardOrientation
}): readonly HazardVisualSegment[] {
  const frame = getHazardFrameIndex({ orientation: input.orientation })
  if (input.orientation !== undefined && input.orientation !== 'floor') {
    return [
      { x: input.x, width: input.width, height: input.height, frame, flipX: false },
    ]
  }

  const capWidth = Math.min(floorSpikeEndCapWidth, input.width / 2)
  const middleWidth = input.width - capWidth * 2

  return [
    {
      x: input.x - input.width / 2 + capWidth / 2,
      width: capWidth,
      height: input.height,
      frame,
      flipX: false,
    },
    ...(middleWidth > 0
      ? [{
          x: input.x,
          width: middleWidth,
          height: input.height,
          frame,
          flipX: false,
        }]
      : []),
    {
      x: input.x + input.width / 2 - capWidth / 2,
      width: capWidth,
      height: input.height,
      frame,
      flipX: true,
    },
  ]
}

export function getGroundedHazardCenterY(input: {
  surfaceY: number
  height: number
  type: GameplayHazardType
}): number {
  return input.surfaceY - input.height / 2 + hazardActorDefinitions[input.type].visualBottomInset
}

export function getHazardBodyPresentation(input: {
  width: number
  height: number
  type: GameplayHazardType
}): {
  width: number
  height: number
  offsetX: number
  offsetY: number
} {
  return {
    width: input.width * 0.86,
    height: input.height * 0.56,
    offsetX: input.width * 0.07,
    offsetY: input.height * 0.36,
  }
}
