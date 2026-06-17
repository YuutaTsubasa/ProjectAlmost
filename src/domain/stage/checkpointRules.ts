export function getReachedCheckpointCount(input: {
  activeCheckpointIndex: number
}): number {
  return input.activeCheckpointIndex + 1
}
