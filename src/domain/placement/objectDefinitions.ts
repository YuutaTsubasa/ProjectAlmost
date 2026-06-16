export type BodyDefinition = {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export type GameObjectDefinition = {
  placement: 'grounded' | 'airborne'
  origin: { x: number; y: number }
  displaySize?: { width: number; height: number }
  body?: BodyDefinition
  centerAboveSurface?: number
  visualBottomInset?: number
  gravity: boolean
  behavior: 'player' | 'collectible' | 'patrol' | 'homing-target' | 'checkpoint' | 'goal' | 'hazard'
}

export const objectDefinitions = {
  player: {
    placement: 'grounded',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 34, height: 72, offsetX: 47, offsetY: 42 },
    centerAboveSurface: 76,
    gravity: true,
    behavior: 'player',
  },
  coin: {
    placement: 'airborne',
    origin: { x: 0.5, y: 0.5 },
    gravity: false,
    behavior: 'collectible',
  },
  guard: {
    placement: 'grounded',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 46, height: 54, offsetX: 41, offsetY: 54 },
    centerAboveSurface: 70,
    gravity: true,
    behavior: 'patrol',
  },
  'azure-core': {
    placement: 'airborne',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 58, height: 58, offsetX: 9, offsetY: 9 },
    gravity: false,
    behavior: 'homing-target',
  },
  checkpoint: {
    placement: 'grounded',
    origin: { x: 0.5, y: 1 },
    displaySize: { width: 76, height: 114 },
    visualBottomInset: 0,
    gravity: false,
    behavior: 'checkpoint',
  },
  goal: {
    placement: 'grounded',
    origin: { x: 0.5, y: 1 },
    displaySize: { width: 96, height: 128 },
    body: { width: 52, height: 112, offsetX: 22, offsetY: 16 },
    // The source frames have transparent pixels below the flag pole.
    visualBottomInset: 6,
    gravity: false,
    behavior: 'goal',
  },
  spikes: {
    placement: 'grounded',
    origin: { x: 0.5, y: 0.5 },
    visualBottomInset: 14,
    gravity: false,
    behavior: 'hazard',
  },
  lava: {
    placement: 'grounded',
    origin: { x: 0.5, y: 0.5 },
    visualBottomInset: 0,
    gravity: false,
    behavior: 'hazard',
  },
} as const satisfies Record<string, GameObjectDefinition>

export type ObjectDefinitionId = keyof typeof objectDefinitions

export function groundedCenterY(surfaceY: number, definitionId: 'player' | 'guard'): number {
  return surfaceY - objectDefinitions[definitionId].centerAboveSurface
}

export function groundedBottomY(surfaceY: number, definitionId: 'checkpoint' | 'goal'): number {
  return surfaceY + objectDefinitions[definitionId].visualBottomInset
}

export function groundedHazardCenterY(surfaceY: number, height: number, definitionId: 'spikes' | 'lava'): number {
  return surfaceY - height / 2 + objectDefinitions[definitionId].visualBottomInset
}
