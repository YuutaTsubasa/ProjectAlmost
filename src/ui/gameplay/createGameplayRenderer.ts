import Phaser from 'phaser'
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import {
  bufferMovableActorJump,
  createMovableActorJumpState,
  getMovableActorJumpDecision,
  updateMovableActorGroundContact,
  type MovableActorJumpState,
} from '../../domain/gameplay/movableActorState'
import {
  getPlayerCenterY,
  getPlayerHorizontalMovementDecision,
  playerActorDefinition,
} from '../../domain/gameplay/playerActor'
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
  private terrainLayer: Phaser.Tilemaps.TilemapLayer | null = null
  private player: Phaser.Physics.Arcade.Sprite | null = null
  private playerKeys: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    w: Phaser.Input.Keyboard.Key
  } | null = null
  private playerJumpState: MovableActorJumpState | null = null
  private wasJumpDown = false

  constructor(stage: GameplayStageMap) {
    super(`GameplayMapScene:${stage.id}`)
    this.stageMap = stage
  }

  preload(): void {
    for (const layer of this.stageMap.backgroundLayers) {
      this.load.image(layer.id, layer.assetRef)
    }

    this.load.image('terrain-tiles', this.stageMap.terrain.tilesetAssetRef)

    for (const sprite of Object.values(playerActorDefinition.sprites)) {
      this.load.spritesheet(sprite.key, sprite.assetRef, {
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight,
      })
    }
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
    this.terrainLayer = this.createTerrainLayer(columns, rows)
    this.createPlayerAnimations()
    this.playerKeys = this.createPlayerKeys()
    this.createPlayer()
  }

  update(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }

    this.updatePlayerMovement()
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

  private createTerrainLayer(columns: number, rows: number): Phaser.Tilemaps.TilemapLayer {
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

    return layer
  }

  private createPlayerAnimations(): void {
    for (const sprite of Object.values(playerActorDefinition.sprites)) {
      this.anims.create({
        key: sprite.key,
        frames: this.anims.generateFrameNumbers(sprite.key, {
          start: sprite.frameStart,
          end: sprite.frameEnd,
        }),
        frameRate: sprite.frameRate,
        repeat: sprite.repeat,
      })
    }
  }

  private createPlayerKeys(): NonNullable<GameplayMapScene['playerKeys']> {
    if (!this.input.keyboard) {
      throw new Error(`Unable to create player keyboard controls for stage ${this.stageMap.id}.`)
    }

    const keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
    }) as NonNullable<GameplayMapScene['playerKeys']>

    return keys
  }

  private createPlayer(): void {
    if (!this.terrainLayer) {
      throw new Error(`Unable to create player collider before terrain for stage ${this.stageMap.id}.`)
    }

    const player = this.physics.add.sprite(
      this.stageMap.player.spawn.x,
      getPlayerCenterY({ surfaceY: this.stageMap.player.spawn.surfaceY }),
      playerActorDefinition.sprites.idle.key,
    )

    player
      .setOrigin(playerActorDefinition.origin.x, playerActorDefinition.origin.y)
      .setScale(playerActorDefinition.scale)
      .setCollideWorldBounds(true)
      .setDragX(playerActorDefinition.movement.idleDragX)
      .setMaxVelocity(playerActorDefinition.maxVelocity.x, playerActorDefinition.maxVelocity.y)
      .setDepth(playerActorDefinition.depth)

    player.body.setSize(playerActorDefinition.body.width, playerActorDefinition.body.height)
    player.body.setOffset(playerActorDefinition.body.offsetX, playerActorDefinition.body.offsetY)
    player.play(playerActorDefinition.sprites.idle.key)

    this.physics.add.collider(player, this.terrainLayer)
    this.cameras.main.startFollow(player, true, 0.12, 0.12)
    this.playerJumpState = createMovableActorJumpState({
      now: this.time.now,
      grounded: true,
      config: playerActorDefinition.jump,
    })
    this.wasJumpDown = false
    this.player = player
  }

  private isPlayerGrounded(): boolean {
    if (!this.player) return false

    const body = this.player.body as Phaser.Physics.Arcade.Body | null

    if (!body) return false

    return body.blocked.down || body.touching.down
  }

  private isJumpDown(): boolean {
    if (!this.playerKeys) return false

    return this.playerKeys.space.isDown || this.playerKeys.up.isDown || this.playerKeys.w.isDown
  }

  private updatePlayerMovement(): void {
    if (!this.player || !this.playerKeys || !this.playerJumpState) return

    const grounded = this.isPlayerGrounded()
    this.playerJumpState = updateMovableActorGroundContact({
      state: this.playerJumpState,
      now: this.time.now,
      grounded,
      config: playerActorDefinition.jump,
    })

    const jumpDown = this.isJumpDown()
    if (jumpDown && !this.wasJumpDown) {
      this.playerJumpState = bufferMovableActorJump({
        state: this.playerJumpState,
        now: this.time.now,
        config: playerActorDefinition.jump,
      })
    }
    this.wasJumpDown = jumpDown

    const jumpDecision = getMovableActorJumpDecision({
      state: this.playerJumpState,
      now: this.time.now,
      config: playerActorDefinition.jump,
    })
    this.playerJumpState = jumpDecision.state
    const jumpingThisFrame = jumpDecision.type !== 'none'
    if (jumpDecision.type !== 'none') {
      this.player.setVelocityY(playerActorDefinition.jump.velocityY)
    }

    const decision = getPlayerHorizontalMovementDecision({
      left: this.playerKeys.left.isDown || this.playerKeys.a.isDown,
      right: this.playerKeys.right.isDown || this.playerKeys.d.isDown,
    })

    this.player.setDragX(decision.dragX)
    this.player.setAccelerationX(decision.accelerationX)

    if (!grounded || jumpingThisFrame) {
      this.player.play(playerActorDefinition.sprites.jump.key, true)
    } else if (decision.direction === 'left') {
      this.player.setFlipX(true)
      this.player.play(playerActorDefinition.sprites.run.key, true)
    } else if (decision.direction === 'right') {
      this.player.setFlipX(false)
      this.player.play(playerActorDefinition.sprites.run.key, true)
    } else {
      this.player.play(playerActorDefinition.sprites.idle.key, true)
    }
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
        gravity: { x: 0, y: playerActorDefinition.gravityY },
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
