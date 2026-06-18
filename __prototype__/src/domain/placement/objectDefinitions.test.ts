import { describe, expect, test } from 'vitest'
import {
  getEnemySpawnY,
  getHazardFrameIndex,
  getPlayerCenterY,
  groundedBottomY,
  groundedCenterY,
  groundedHazardCenterY,
  objectDefinitions,
} from './objectDefinitions'

describe('groundedCenterY', () => {
  test('places the player center above the surface using the player definition', () => {
    expect(groundedCenterY(704, 'player')).toBe(704 - objectDefinitions.player.centerAboveSurface)
  })

  test('places guards using the guard definition', () => {
    expect(groundedCenterY(640, 'guard')).toBe(640 - objectDefinitions.guard.centerAboveSurface)
  })
})

describe('getPlayerCenterY', () => {
  test('places the player center above the surface for down gravity', () => {
    expect(getPlayerCenterY({ surfaceY: 704, gravity: 'down' }))
      .toBe(704 - objectDefinitions.player.centerAboveSurface)
  })

  test('places the player center below the surface for up gravity', () => {
    expect(getPlayerCenterY({ surfaceY: 704, gravity: 'up' }))
      .toBe(704 + objectDefinitions.player.centerAboveSurface)
  })
})

describe('groundedBottomY', () => {
  test('aligns the goal bottom using its visual bottom inset', () => {
    expect(groundedBottomY(704, 'goal')).toBe(704 + objectDefinitions.goal.visualBottomInset)
  })
})

describe('groundedHazardCenterY', () => {
  test('places floor spikes on a platform surface with visual inset', () => {
    expect(groundedHazardCenterY(704, 32, 'spikes')).toBe(704 - 16 + objectDefinitions.spikes.visualBottomInset)
  })
})

describe('getHazardFrameIndex', () => {
  test('uses the floor frame when orientation is omitted or floor', () => {
    expect(getHazardFrameIndex({})).toBe(0)
    expect(getHazardFrameIndex({ orientation: 'floor' })).toBe(0)
  })

  test('maps ceiling and wall orientations to authored frames', () => {
    expect(getHazardFrameIndex({ orientation: 'ceiling' })).toBe(4)
    expect(getHazardFrameIndex({ orientation: 'left-wall' })).toBe(3)
    expect(getHazardFrameIndex({ orientation: 'right-wall' })).toBe(2)
  })
})

describe('getEnemySpawnY', () => {
  test('uses authored y for airborne Azure Cores', () => {
    expect(getEnemySpawnY({ type: 'azure-core', y: 420 })).toBe(420)
  })

  test('uses guard grounded center for explicit guards', () => {
    expect(getEnemySpawnY({ type: 'guard', surfaceY: 704 })).toBe(groundedCenterY(704, 'guard'))
  })

  test('uses guard grounded center when enemy type is omitted', () => {
    expect(getEnemySpawnY({ surfaceY: 640 })).toBe(groundedCenterY(640, 'guard'))
  })
})
