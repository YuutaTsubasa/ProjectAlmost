export const PLAYER_COIN_PICKUP_RADIUS = 52

export type PlayerCoinPickupDecision = 'skip' | 'collect'

export function canPlayerPickUpCoin(input: {
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): boolean {
  const radius = input.radius ?? PLAYER_COIN_PICKUP_RADIUS
  return Math.hypot(input.coinX - input.playerX, input.coinY - input.playerY) < radius
}

export function shouldScanPlayerCoins(input: {
  stageCleared: boolean
  dead: boolean
}): boolean {
  return !input.stageCleared && !input.dead
}

export function getPlayerCoinPickupDecision(input: {
  collected: boolean
  playerX: number
  playerY: number
  coinX: number
  coinY: number
  radius?: number
}): PlayerCoinPickupDecision {
  if (input.collected) return 'skip'
  return canPlayerPickUpCoin(input) ? 'collect' : 'skip'
}

export function getCoinTargetCount(input: {
  coins: readonly unknown[]
}): number {
  return input.coins.length
}
