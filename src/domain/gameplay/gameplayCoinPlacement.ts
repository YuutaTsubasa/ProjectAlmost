import { hazardActorDefinitions } from './hazardActor'
import { goalActorDefinition, getGoalBottomY } from './goalActor'
import type {
  GameplayStageSourceCoin,
  GameplayStageSourceHazard,
  GameplayStageSourceMovingPlatform,
  GameplayStageSourcePlatform,
} from './gameplayStageSource'

const COIN_SIZE = 44

type Bounds = {
  left: number
  right: number
  top: number
  bottom: number
}

export type CoinPlacementConflict = {
  coinIndex: number
  obstacleId: string
  obstacleType: 'static-platform' | 'moving-platform' | 'spikes'
}

export type CoinLandingConflict = {
  coinIndex: number
  obstacleId: string
  obstacleType: 'missing-static-landing' | 'spike-covered-landing'
}

export type CoinGoalConflict = {
  coinIndex: number
  obstacleId: 'stage-goal'
}

export function findCoinGoalConflicts(input: {
  coins: readonly GameplayStageSourceCoin[]
  goal: { x: number; surfaceY: number }
}): CoinGoalConflict[] {
  const goalBottom = getGoalBottomY(input.goal)
  const goalBounds = {
    left: input.goal.x - goalActorDefinition.displaySize.width / 2,
    right: input.goal.x + goalActorDefinition.displaySize.width / 2,
    top: goalBottom - goalActorDefinition.displaySize.height,
    bottom: goalBottom,
  }

  return input.coins.flatMap<CoinGoalConflict>((coin, coinIndex) =>
    intersects(getCoinBounds(coin), goalBounds)
      ? [{ coinIndex, obstacleId: 'stage-goal' }]
      : [],
  )
}

export function findCoinPlacementConflicts(input: {
  tileSize: number
  coins: readonly GameplayStageSourceCoin[]
  platforms: readonly GameplayStageSourcePlatform[]
  movingPlatforms: readonly GameplayStageSourceMovingPlatform[]
  hazards: readonly GameplayStageSourceHazard[]
}): CoinPlacementConflict[] {
  const staticPlatforms = input.platforms.map((platform, index) => ({
    id: `platform-${index + 1}`,
    bounds: getPlatformBounds(platform, input.tileSize),
  }))
  const movingPlatforms = input.movingPlatforms.map((platform) => ({
    id: platform.id,
    bounds: getMovingPlatformSweepBounds(platform, input.tileSize),
  }))
  const spikes = input.hazards
    .filter((hazard) => hazard.type === 'spikes')
    .map((hazard) => ({
      id: hazard.id,
      bounds: getSpikeVisualBounds(hazard),
    }))

  return input.coins.flatMap((coin, coinIndex) => {
    const coinBounds = getCoinBounds(coin)

    return [
      ...staticPlatforms
        .filter(({ bounds }) => intersects(coinBounds, bounds))
        .map(({ id }) => ({ coinIndex, obstacleId: id, obstacleType: 'static-platform' as const })),
      ...movingPlatforms
        .filter(({ bounds }) => intersects(coinBounds, bounds))
        .map(({ id }) => ({ coinIndex, obstacleId: id, obstacleType: 'moving-platform' as const })),
      ...spikes
        .filter(({ bounds }) => intersects(coinBounds, bounds))
        .map(({ id }) => ({ coinIndex, obstacleId: id, obstacleType: 'spikes' as const })),
    ]
  })
}

export function findCoinLandingConflicts(input: {
  tileSize: number
  coins: readonly GameplayStageSourceCoin[]
  platforms: readonly GameplayStageSourcePlatform[]
  hazards: readonly GameplayStageSourceHazard[]
}): CoinLandingConflict[] {
  const platforms = input.platforms.map((platform) =>
    getPlatformBounds(platform, input.tileSize),
  )
  const spikes = input.hazards.filter((hazard) => hazard.type === 'spikes')

  return input.coins.flatMap<CoinLandingConflict>((coin, coinIndex) => {
    const coinBounds = getCoinBounds(coin)
    const landing = platforms
      .filter((platform) =>
        coinBounds.left >= platform.left
        && coinBounds.right <= platform.right
        && coinBounds.bottom < platform.top)
      .sort((first, second) => first.top - second.top)[0]

    if (!landing) {
      return [{
        coinIndex,
        obstacleId: 'world-fall',
        obstacleType: 'missing-static-landing' as const,
      }]
    }

    const landingSpike = spikes.find((spike) =>
      spike.surfaceY === landing.top
      && coinBounds.left < spike.x + spike.width / 2
      && coinBounds.right > spike.x - spike.width / 2)

    return landingSpike
      ? [{
          coinIndex,
          obstacleId: landingSpike.id,
          obstacleType: 'spike-covered-landing' as const,
        }]
      : []
  })
}

function getCoinBounds(coin: GameplayStageSourceCoin): Bounds {
  const halfSize = COIN_SIZE / 2
  return {
    left: coin.x - halfSize,
    right: coin.x + halfSize,
    top: coin.y - halfSize,
    bottom: coin.y + halfSize,
  }
}

function getPlatformBounds(platform: GameplayStageSourcePlatform, tileSize: number): Bounds {
  return {
    left: platform.col * tileSize,
    right: (platform.col + platform.width) * tileSize,
    top: platform.row * tileSize,
    bottom: (platform.row + platform.height) * tileSize,
  }
}

function getMovingPlatformSweepBounds(
  platform: GameplayStageSourceMovingPlatform,
  tileSize: number,
): Bounds {
  const bounds = getPlatformBounds(platform, tileSize)
  return {
    ...bounds,
    right: bounds.right + (platform.axis === 'x' ? platform.distance : 0),
    bottom: bounds.bottom + (platform.axis === 'y' ? platform.distance : 0),
  }
}

function getSpikeVisualBounds(hazard: GameplayStageSourceHazard): Bounds {
  const visualBottomInset = hazardActorDefinitions.spikes.visualBottomInset
  return {
    left: hazard.x - hazard.width / 2,
    right: hazard.x + hazard.width / 2,
    top: hazard.surfaceY - hazard.height + visualBottomInset,
    bottom: hazard.surfaceY + visualBottomInset,
  }
}

function intersects(first: Bounds, second: Bounds): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top
}
