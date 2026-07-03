import { describe, expect, it } from 'vitest'
import {
  PLAYER_COIN_PICKUP_RADIUS,
  canPlayerPickUpCoin,
  getCoinTargetCount,
  getPlayerCoinPickupDecision,
  shouldScanPlayerCoins,
} from './playerCoinPickup'

describe('player coin pickup constants', () => {
  it('keeps prototype pickup radius explicit', () => {
    expect(PLAYER_COIN_PICKUP_RADIUS).toBe(52)
  })
})

describe('canPlayerPickUpCoin', () => {
  it('allows pickup when the coin center is inside the pickup radius', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: 30,
      coinY: 40,
    })).toBe(true)
  })

  it('rejects pickup on the exact pickup radius boundary', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS,
      coinY: 0,
    })).toBe(false)
  })

  it('rejects pickup outside the pickup radius', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS + 1,
      coinY: 0,
    })).toBe(false)
  })

  it('supports explicit radius overrides', () => {
    expect(canPlayerPickUpCoin({
      playerX: 10,
      playerY: 10,
      coinX: 13,
      coinY: 14,
      radius: 5.1,
    })).toBe(true)
    expect(canPlayerPickUpCoin({
      playerX: 10,
      playerY: 10,
      coinX: 13,
      coinY: 14,
      radius: 5,
    })).toBe(false)
  })
})

describe('shouldScanPlayerCoins', () => {
  it('allows scanning while gameplay is active', () => {
    expect(shouldScanPlayerCoins({ stageCleared: false, dead: false })).toBe(true)
  })

  it('blocks scanning after stage clear', () => {
    expect(shouldScanPlayerCoins({ stageCleared: true, dead: false })).toBe(false)
  })

  it('blocks scanning while dead', () => {
    expect(shouldScanPlayerCoins({ stageCleared: false, dead: true })).toBe(false)
  })
})

describe('getPlayerCoinPickupDecision', () => {
  it('skips collected coins even inside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: true,
      playerX: 0,
      playerY: 0,
      coinX: 0,
      coinY: 0,
    })).toBe('skip')
  })

  it('collects uncollected coins inside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: 30,
      coinY: 40,
    })).toBe('collect')
  })

  it('skips uncollected coins on the exact pickup radius boundary', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS,
      coinY: 0,
    })).toBe('skip')
  })
})

describe('getCoinTargetCount', () => {
  it('returns zero when a stage has no coins', () => {
    expect(getCoinTargetCount({ coins: [] })).toBe(0)
  })

  it('returns the number of stage coin entries', () => {
    expect(getCoinTargetCount({
      coins: [
        { id: 'coin-a' },
        { id: 'coin-b' },
        { id: 'coin-c' },
      ],
    })).toBe(3)
  })
})
