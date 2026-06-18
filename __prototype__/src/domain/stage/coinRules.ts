export function getCoinTargetCount(input: {
  coins: readonly unknown[]
}): number {
  return input.coins.length
}
