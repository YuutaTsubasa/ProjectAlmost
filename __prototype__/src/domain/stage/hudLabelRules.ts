export function formatHealthLabel(input: {
  current: number
  max: number
}): string {
  return `HP ${input.current}/${input.max}`
}

export function formatCoinLabel(input: {
  collected: number
  target: number
}): string {
  return `COIN ${String(input.collected).padStart(3, '0')} / ${input.target}`
}
