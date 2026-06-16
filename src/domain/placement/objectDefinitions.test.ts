import { describe, expect, test } from 'vitest'
import { groundedBottomY, groundedCenterY, groundedHazardCenterY, objectDefinitions } from './objectDefinitions'

describe('groundedCenterY', () => {
  test('places the player center above the surface using the player definition', () => {
    expect(groundedCenterY(704, 'player')).toBe(704 - objectDefinitions.player.centerAboveSurface)
  })

  test('places guards using the guard definition', () => {
    expect(groundedCenterY(640, 'guard')).toBe(640 - objectDefinitions.guard.centerAboveSurface)
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
