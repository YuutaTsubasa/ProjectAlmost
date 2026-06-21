import Phaser from 'phaser'
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import {
  buildTerrainTileGrid,
  getTileColumnCount,
  getTileRowCount,
  validatePlatformBounds,
} from '../../domain/gameplay/terrain'

type GameplayRendererInput = {
  parent: HTMLElement
  stage: GameplayStageMap
}

type BackgroundRuntimeLayer = {
  sprite: Phaser.GameObjects.TileSprite
  parallaxFactor: number
}

class GameplayMapScene extends Phaser.Scene {
  private readonly stageMap: GameplayStageMap
  private backgroundLayers: BackgroundRuntimeLayer[] = []

  constructor(stage: GameplayStageMap) {
    super(`GameplayMapScene:${stage.id}`)
    this.stageMap = stage
  }

  preload(): void {
    for (const layer of this.stageMap.backgroundLayers) {
      this.load.image(layer.id, layer.assetRef)
    }

    this.load.image('terrain-tiles', this.stageMap.terrain.tilesetAssetRef)
  }

  create(): void {
    const columns = getTileColumnCount({
      worldWidth: this.stageMap.world.width,
      tileSize: this.stageMap.world.tileSize,
    })
    const rows = getTileRowCount({
      worldHeight: this.stageMap.world.height,
      tileSize: this.stageMap.world.tileSize,
    })
    const validation = validatePlatformBounds({
      columns,
      rows,
      platforms: this.stageMap.terrain.platforms,
    })

    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    this.physics.world.setBounds(0, 0, this.stageMap.world.width, this.stageMap.world.height)
    this.cameras.main.setBounds(0, 0, this.stageMap.world.width, this.stageMap.world.height)

    this.createBackgroundLayers()
    this.createTerrainLayer(columns, rows)
  }

  update(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }
  }

  private createBackgroundLayers(): void {
    this.backgroundLayers = this.stageMap.backgroundLayers.map((layer) => {
      const sprite = this.add
        .tileSprite(0, 0, layer.width, layer.height, layer.id)
        .setOrigin(0)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(layer.depth)

      return { sprite, parallaxFactor: layer.parallaxFactor }
    })
  }

  private createTerrainLayer(columns: number, rows: number): void {
    const map = this.make.tilemap({
      data: buildTerrainTileGrid({
        columns,
        rows,
        platforms: this.stageMap.terrain.platforms,
      }),
      tileWidth: this.stageMap.world.tileSize,
      tileHeight: this.stageMap.world.tileSize,
    })
    const tileset = map.addTilesetImage(
      'terrain-tiles',
      undefined,
      this.stageMap.world.tileSize,
      this.stageMap.world.tileSize,
      0,
      0,
    )
    const layer = map.createLayer(0, tileset!, 0, 0)

    if (!layer) {
      throw new Error(`Unable to create terrain tilemap layer for stage ${this.stageMap.id}.`)
    }

    layer.setCollision([...this.stageMap.terrain.solidTileIndexes])
    layer.setDepth(5)
  }
}

export function createGameplayRendererConfig(
  input: GameplayRendererInput,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: input.parent,
    width: 1280,
    height: 720,
    backgroundColor: '#05070d',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new GameplayMapScene(input.stage)],
  }
}

export function createGameplayRenderer(input: GameplayRendererInput): Phaser.Game {
  return new Phaser.Game(createGameplayRendererConfig(input))
}
