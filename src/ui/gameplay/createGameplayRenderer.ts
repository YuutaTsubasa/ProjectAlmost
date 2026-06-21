import Phaser from 'phaser'
import {
  enemyActorDefinitions,
  enemyDefeatPresentation,
  getEnemySpawnY,
  getEnemyDefeatPresentation,
  getNextEnemyPatrolDirection,
  shouldProcessEnemyDefeat,
  shouldUpdateEnemyPatrol,
  type EnemyPatrolDirection,
} from '../../domain/gameplay/enemyActor'
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import type { GameplayEnemySpawn } from '../../domain/gameplay/gameplayMapTypes'
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
  canStartMeleeAttack,
  getAttackInputDecision,
  getMeleeAttackEndState,
  getMeleeAttackEntryState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
  isMeleeHitCandidate,
  meleeAttackTiming,
  meleeHitboxSize,
} from '../../domain/gameplay/playerAttack'
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

type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spawn: GameplayEnemySpawn
  direction: EnemyPatrolDirection
  defeated: boolean
}

type ActiveMeleeHitbox = {
  image: Phaser.GameObjects.Image
  consumed: boolean
}

type PlayerFacingDirection = 'left' | 'right'

class GameplayMapScene extends Phaser.Scene {
  private readonly stageMap: GameplayStageMap
  private backgroundLayers: BackgroundRuntimeLayer[] = []
  private terrainLayer: Phaser.Tilemaps.TilemapLayer | null = null
  private enemies: EnemyRuntime[] = []
  private player: Phaser.Physics.Arcade.Sprite | null = null
  private playerKeys: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    j: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    w: Phaser.Input.Keyboard.Key
    z: Phaser.Input.Keyboard.Key
  } | null = null
  private playerJumpState: MovableActorJumpState | null = null
  private wasJumpDown = false
  private attackReady = true
  private isAttacking = false
  private wasAttackDown = false
  private activeMeleeHitboxes: ActiveMeleeHitbox[] = []

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

    for (const definition of Object.values(enemyActorDefinitions)) {
      if (!('sprites' in definition) || !definition.sprites) {
        continue
      }

      for (const sprite of Object.values(definition.sprites)) {
        this.load.spritesheet(sprite.key, sprite.assetRef, {
          frameWidth: sprite.frameWidth,
          frameHeight: sprite.frameHeight,
        })
      }
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
    this.createEnemyTextures()
    this.createAttackHitboxTexture()
    this.createEnemyAnimations()
    this.createEnemies()
    this.playerKeys = this.createPlayerKeys()
    this.createPlayer()
  }

  update(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }

    this.updateEnemyPatrol()
    this.processActiveMeleeHitboxes()
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

  private createEnemyTextures(): void {
    this.createAzureCoreTexture()
  }

  private createAttackHitboxTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0x4be8ff, 0.2)
    graphics.lineStyle(2, 0x4f7dff, 0.8)
    graphics.generateTexture('attack-hitbox', meleeHitboxSize.width, meleeHitboxSize.height)
    graphics.destroy()
  }

  private createEnemyAnimations(): void {
    const guardSprites = enemyActorDefinitions['armor-guard'].sprites
    if (!guardSprites) return

    for (const sprite of Object.values(guardSprites)) {
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

  private createAzureCoreTexture(): void {
    const texture = enemyActorDefinitions['azure-core'].generatedTexture
    if (!texture) return

    const graphics = this.make.graphics()
    graphics.fillStyle(0xffffff, 0.88)
    graphics.fillCircle(38, 38, 28)
    graphics.lineStyle(6, 0xb7dfff, 0.95)
    graphics.strokeCircle(38, 38, 29)
    graphics.lineStyle(3, 0x4f7dff, 0.9)
    graphics.strokeCircle(38, 38, 20)
    graphics.fillStyle(0x4be8ff, 0.95)
    graphics.fillCircle(38, 38, 13)
    graphics.fillStyle(0xffffff, 0.9)
    graphics.fillCircle(34, 34, 5)
    graphics.lineStyle(4, 0x4be8ff, 0.7)
    graphics.lineBetween(4, 38, 16, 38)
    graphics.lineBetween(60, 38, 72, 38)
    graphics.generateTexture(texture.key, texture.width, texture.height)
    graphics.destroy()
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
      j: Phaser.Input.Keyboard.KeyCodes.J,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
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
    this.attackReady = true
    this.isAttacking = false
    this.wasAttackDown = false
    this.wasJumpDown = false
    this.activeMeleeHitboxes = []
    this.player = player
  }

  private createEnemies(): void {
    if (!this.terrainLayer) {
      throw new Error(`Unable to create enemy colliders before terrain for stage ${this.stageMap.id}.`)
    }

    const terrainLayer = this.terrainLayer

    this.enemies = this.stageMap.enemies.map((spawn) => {
      if (spawn.type === 'armor-guard') {
        const definition = enemyActorDefinitions['armor-guard']
        const textureKey = definition.sprites.walk?.key
        if (!textureKey) {
          throw new Error(`Enemy ${spawn.id} has no renderable texture.`)
        }

        const sprite = this.physics.add.sprite(
          spawn.x,
          getEnemySpawnY(spawn),
          textureKey,
        )

        sprite
          .setOrigin(definition.origin.x, definition.origin.y)
          .setScale(definition.scale)
          .setCollideWorldBounds(true)
          .setDepth(definition.depth)

        sprite.body.setSize(definition.body.width, definition.body.height)
        sprite.body.setOffset(
          definition.body.offsetX,
          definition.body.offsetY + definition.visualLiftY,
        )

        const direction = definition.patrol.initialDirection
        const walk = definition.sprites?.walk
        if (walk) {
          sprite.play(walk.key)
        }
        sprite.setVelocityX(direction * definition.patrol.speed)
        this.physics.add.collider(sprite, terrainLayer)

        return {
          sprite,
          spawn,
          direction,
          defeated: false,
        }
      } else {
        const definition = enemyActorDefinitions['azure-core']
        const textureKey = definition.generatedTexture?.key
        if (!textureKey) {
          throw new Error(`Enemy ${spawn.id} has no renderable texture.`)
        }

        const sprite = this.physics.add.sprite(
          spawn.x,
          getEnemySpawnY(spawn),
          textureKey,
        )

        sprite
          .setOrigin(definition.origin.x, definition.origin.y)
          .setScale(definition.scale)
          .setCollideWorldBounds(true)
          .setDepth(definition.depth)

        sprite.body.setSize(definition.body.width, definition.body.height)
        sprite.body.setOffset(definition.body.offsetX, definition.body.offsetY)

        sprite.body.allowGravity = false
        sprite.setImmovable(true)
        this.createAzureCoreFloat(sprite, spawn.y)

        return {
          sprite,
          spawn,
          direction: -1,
          defeated: false,
        }
      }
    })
  }

  private createAzureCoreFloat(sprite: Phaser.Physics.Arcade.Sprite, spawnY: number): void {
    const floating = enemyActorDefinitions['azure-core'].floating
    if (!floating) return

    this.tweens.add({
      targets: sprite,
      y: spawnY + floating.yOffset,
      angle: floating.angle,
      duration: floating.durationMs,
      ease: floating.ease,
      yoyo: true,
      repeat: -1,
    })
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

  private isAttackDown(): boolean {
    if (!this.playerKeys) return false

    return this.playerKeys.j.isDown || this.playerKeys.z.isDown
  }

  private tryStartPlayerAttack(grounded: boolean, facing: PlayerFacingDirection): void {
    if (!this.player || !this.playerKeys) return

    const attackDown = this.isAttackDown()
    const attackPressed = attackDown && !this.wasAttackDown
    this.wasAttackDown = attackDown

    const decision = getAttackInputDecision({
      attackPressed,
      crouching: false,
      grounded,
    })

    if (decision !== 'melee') return

    if (
      !canStartMeleeAttack({
        attackReady: this.attackReady,
        hurting: false,
        homingAttacking: false,
      })
    ) {
      return
    }

    const entry = getMeleeAttackEntryState()
    this.attackReady = entry.attackReady
    this.isAttacking = entry.attacking
    this.player.setFlipX(facing === 'left')
    this.player.play(playerActorDefinition.sprites.attack.key, true)

    this.spawnMeleeHitbox()

    this.time.delayedCall(meleeAttackTiming.attackEndDelayMs, () => {
      const end = getMeleeAttackEndState()
      this.isAttacking = end.attacking
    })
    this.time.delayedCall(meleeAttackTiming.readyDelayMs, () => {
      const ready = getMeleeAttackReadyState()
      this.attackReady = ready.attackReady
    })
  }

  private spawnMeleeHitbox(): void {
    if (!this.player) return

    const geometry = getMeleeHitboxGeometry({
      playerX: this.player.x,
      playerY: this.player.y,
      playerFlipX: this.player.flipX,
    })
    const hitbox = this.add
      .image(geometry.x, geometry.y, 'attack-hitbox')
      .setFlipX(geometry.flipX)
      .setVisible(false)
    const activeHitbox = { image: hitbox, consumed: false }
    this.activeMeleeHitboxes.push(activeHitbox)
    this.processEnemyHitsForHitbox(activeHitbox)

    this.time.delayedCall(meleeAttackTiming.hitboxLifetimeMs, () => {
      this.activeMeleeHitboxes = this.activeMeleeHitboxes.filter((candidate) => candidate !== activeHitbox)
      hitbox.destroy()
    })
  }

  private processActiveMeleeHitboxes(): void {
    for (const hitbox of this.activeMeleeHitboxes) {
      this.processEnemyHitsForHitbox(hitbox)
    }
  }

  private processEnemyHitsForHitbox(hitbox: ActiveMeleeHitbox): void {
    if (hitbox.consumed) {
      return
    }

    const enemy = this.enemies.find((candidate) =>
      isMeleeHitCandidate({
        defeated: candidate.defeated,
        intersectsHitbox: Phaser.Geom.Intersects.RectangleToRectangle(
          hitbox.image.getBounds(),
          candidate.sprite.getBounds(),
        ),
      }),
    )

    if (enemy && shouldProcessEnemyDefeat({ enemyExists: true, defeated: enemy.defeated })) {
      hitbox.consumed = true
      this.defeatEnemy(enemy)
    }
  }

  private defeatEnemy(enemy: EnemyRuntime): void {
    enemy.defeated = true
    enemy.sprite.setVelocity(0, 0)
    const body = enemy.sprite.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.enable = false
    }

    const presentation = getEnemyDefeatPresentation(enemy.spawn.type)
    if (presentation === 'armor-guard-death') {
      const death = enemyActorDefinitions['armor-guard'].sprites?.death
      if (death) {
        enemy.sprite.play(death.key, true)
      }
    } else {
      const burst = enemyDefeatPresentation.azureCoreBurst
      this.tweens.killTweensOf(enemy.sprite)
      this.tweens.add({
        targets: enemy.sprite,
        scale: burst.scale,
        alpha: burst.alpha,
        angle: enemy.sprite.angle + burst.angleDelta,
        duration: burst.durationMs,
        ease: burst.ease,
      })
    }

    this.time.delayedCall(enemyDefeatPresentation.hideDelayMs, () => {
      enemy.sprite.setVisible(false)
    })
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
    const facing: PlayerFacingDirection =
      decision.direction === 'left'
        ? 'left'
        : decision.direction === 'right'
          ? 'right'
          : this.player.flipX
            ? 'left'
            : 'right'

    this.tryStartPlayerAttack(grounded, facing)

    this.player.setDragX(decision.dragX)
    this.player.setAccelerationX(decision.accelerationX)
    if (decision.direction === 'left') {
      this.player.setFlipX(true)
    } else if (decision.direction === 'right') {
      this.player.setFlipX(false)
    }

    if (this.isAttacking) {
      this.player.play(playerActorDefinition.sprites.attack.key, true)
    } else if (!grounded || jumpingThisFrame) {
      this.player.play(playerActorDefinition.sprites.jump.key, true)
    } else if (decision.direction === 'left') {
      this.player.play(playerActorDefinition.sprites.run.key, true)
    } else if (decision.direction === 'right') {
      this.player.play(playerActorDefinition.sprites.run.key, true)
    } else {
      this.player.play(playerActorDefinition.sprites.idle.key, true)
    }
  }

  private updateEnemyPatrol(): void {
    for (const enemy of this.enemies) {
      if (
        !shouldUpdateEnemyPatrol({
          type: enemy.spawn.type,
          defeated: enemy.defeated,
        }) ||
        enemy.spawn.type !== 'armor-guard'
      ) {
        continue
      }

      const speed = enemyActorDefinitions['armor-guard'].patrol.speed
      enemy.direction = getNextEnemyPatrolDirection({
        x: enemy.sprite.x,
        patrolMinX: enemy.spawn.patrolMinX,
        patrolMaxX: enemy.spawn.patrolMaxX,
        currentDirection: enemy.direction,
      })

      enemy.sprite.setVelocityX(enemy.direction * speed)
      enemy.sprite.setFlipX(enemy.direction > 0)
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
