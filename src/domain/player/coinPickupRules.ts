export const PLAYER_COIN_PICKUP_RADIUS = 52

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
