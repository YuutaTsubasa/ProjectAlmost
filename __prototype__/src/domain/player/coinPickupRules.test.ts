import { describe, expect, test } from 'vitest'
import {
  PLAYER_COIN_PICKUP_RADIUS,
  canPlayerPickUpCoin,
  getPlayerCoinPickupDecision,
  shouldScanPlayerCoins,
} from './coinPickupRules'

describe('canPlayerPickUpCoin', () => {
  test('keeps normal player coin pickup radius explicit', () => {
    expect(PLAYER_COIN_PICKUP_RADIUS).toBe(52)
  })

  test('allows pickup when coin center is inside the radius', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: 30,
      coinY: 40,
    })).toBe(true)
  })

  test('rejects pickup on the exact radius boundary', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: 52,
      coinY: 0,
    })).toBe(false)
  })

  test('rejects pickup outside the radius', () => {
    expect(canPlayerPickUpCoin({
      playerX: 0,
      playerY: 0,
      coinX: 53,
      coinY: 0,
    })).toBe(false)
  })

  test('supports explicit radius overrides', () => {
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
  test('allows scanning while gameplay is active', () => {
    expect(shouldScanPlayerCoins({
      stageCleared: false,
      dead: false,
    })).toBe(true)
  })

  test('blocks scanning after stage clear', () => {
    expect(shouldScanPlayerCoins({
      stageCleared: true,
      dead: false,
    })).toBe(false)
  })

  test('blocks scanning while dead', () => {
    expect(shouldScanPlayerCoins({
      stageCleared: false,
      dead: true,
    })).toBe(false)
  })
})

describe('getPlayerCoinPickupDecision', () => {
  test('skips collected coins even inside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: true,
      playerX: 0,
      playerY: 0,
      coinX: 0,
      coinY: 0,
    })).toBe('skip')
  })

  test('collects uncollected coins inside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: 30,
      coinY: 40,
    })).toBe('collect')
  })

  test('skips uncollected coins on the exact pickup radius boundary', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS,
      coinY: 0,
    })).toBe('skip')
  })

  test('skips uncollected coins outside pickup radius', () => {
    expect(getPlayerCoinPickupDecision({
      collected: false,
      playerX: 0,
      playerY: 0,
      coinX: PLAYER_COIN_PICKUP_RADIUS + 1,
      coinY: 0,
    })).toBe('skip')
  })
})
