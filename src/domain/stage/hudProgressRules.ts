export function getHudProgress(input: {
  position: number
  worldSize: number
}): number {
  const progress = input.position / input.worldSize
  return Math.max(0, Math.min(1, progress))
}
