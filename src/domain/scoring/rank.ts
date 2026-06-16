export const RANK_ORDER = ['--', 'D', 'C', 'B', 'A', 'S'] as const

export type Rank = typeof RANK_ORDER[number]
export type ClearRank = Exclude<Rank, '--'>

export function rankValue(rank: Rank): number {
  return RANK_ORDER.indexOf(rank)
}
