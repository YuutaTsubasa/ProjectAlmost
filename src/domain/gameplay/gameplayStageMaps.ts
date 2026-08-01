import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageMap } from './gameplayMapTypes'
import { convertGameplayStageSource } from './gameplayStageMapConverter'
import type { GameplayStageConversionDiagnostic } from './gameplayStageSource'
import { gameplayStageSources } from './gameplayStageSources'
import { gameplayStageVisualProfiles } from './gameplayStageVisualProfile'

export type GameplayStageMapCatalog = {
  order: readonly StageId[]
  items: Readonly<Record<StageId, GameplayStageMap>>
}

const conversionEntries = gameplayStageSources.order.map((stageId) => {
  const source = gameplayStageSources.items[stageId]

  return [stageId, convertGameplayStageSource(source, gameplayStageVisualProfiles)] as const
})

export const gameplayStageConversionDiagnostics: readonly GameplayStageConversionDiagnostic[] =
  conversionEntries.flatMap(([, result]) => result.diagnostics)

export const gameplayStageMaps: GameplayStageMapCatalog = {
  order: gameplayStageSources.order,
  items: Object.fromEntries(
    conversionEntries.map(([stageId, result]) => [stageId, result.map]),
  ) as Record<StageId, GameplayStageMap>,
}

export function getGameplayStageMap(stageId: StageId): GameplayStageMap | undefined {
  return gameplayStageMaps.items[stageId]
}
