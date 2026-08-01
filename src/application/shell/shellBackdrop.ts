import type { AppScreen } from '../../domain/app/appFlow'
import type { StageCatalog } from '../../domain/data/stages/stageTypes'
import type { WorldCatalog, WorldData, WorldTheme } from '../../domain/data/worlds/worldTypes'

export type ShellBackdrop = {
  assetRef: string
  theme: WorldTheme
}

export type ShellBackdropInput = {
  screen: AppScreen
  worlds: WorldCatalog
  stages: StageCatalog
}

function fallbackWorld(worlds: WorldCatalog): WorldData {
  return worlds.items[worlds.order[0]]
}

function backdropForWorld(world: WorldData): ShellBackdrop {
  return {
    assetRef: world.assetRefs.stageSelectBackground,
    theme: world.theme,
  }
}

function worldByIndex(worlds: WorldCatalog, index: number): WorldData {
  return worlds.items[worlds.order[index]] ?? fallbackWorld(worlds)
}

function worldForGameplayStage(input: ShellBackdropInput): WorldData {
  if (input.screen.type !== 'gameplay') return fallbackWorld(input.worlds)

  const stage = input.stages.items[input.screen.stageId]
  return stage ? input.worlds.items[stage.worldId] ?? fallbackWorld(input.worlds) : fallbackWorld(input.worlds)
}

export function resolveShellBackdrop(input: ShellBackdropInput): ShellBackdrop {
  if (input.screen.type === 'world-select') {
    return backdropForWorld(worldByIndex(input.worlds, input.screen.selectedWorldIndex))
  }

  if (input.screen.type === 'stage-select') {
    return backdropForWorld(worldByIndex(input.worlds, input.screen.selectedWorldIndex))
  }

  if (input.screen.type === 'gameplay') {
    return backdropForWorld(worldForGameplayStage(input))
  }

  return backdropForWorld(fallbackWorld(input.worlds))
}
