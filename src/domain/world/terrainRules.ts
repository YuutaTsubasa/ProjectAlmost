export function getPlatformTileIndex(input: {
  index: number
  width: number
}): number {
  if (input.width === 1) {
    return 1
  }

  if (input.index === 0) {
    return 0
  }

  if (input.index === input.width - 1) {
    return 2
  }

  return 1
}
