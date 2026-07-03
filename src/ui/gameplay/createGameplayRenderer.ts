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
import type { GameplayCoinPoint, GameplayEnemySpawn } from '../../domain/gameplay/gameplayMapTypes'
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
  type PlayerAnimationKey,
} from '../../domain/gameplay/playerActor'
import {
  PLAYER_MAX_HEALTH,
  PLAYER_OUT_OF_BOUNDS_MARGIN,
  canApplyPlayerEnemyHit,
  canEnterPlayerDefeat,
  getPlayerDamageOutcome,
  getPlayerDefeatEntryState,
  getPlayerDefeatOutcome,
  getPlayerHurtEntryState,
  getPlayerHurtRecoveryState,
  getPlayerHurtVelocity,
  getPlayerInvulnerabilityRecoveryState,
  getPlayerKnockbackDirection,
  getPlayerRespawnState,
  isPlayerOutsideWorldBounds,
  playerDeathTransitionPresentation,
  playerHurtPresentation,
  playerLifeTiming,
  type PlayerDefeatReason,
} from '../../domain/gameplay/playerLife'
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
  canShowHomingReticle,
  canStartHomingAttack,
  homingAttackPresentation,
  getHomingAttackEntryState,
  getHomingContactPoint,
  getHomingFinishOutcome,
  getHomingRecoveryState,
  getHomingTargetAcquisitionDecision,
  getHomingTrailSamples,
  homingAttackTiming,
  isHomingTargetAvailable,
  isHomingTargetLost,
  selectNearestHomingTarget,
  shouldUpdateHomingAttack,
} from '../../domain/gameplay/playerHomingAttack'
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

type CoinRuntime = {
  sprite: Phaser.GameObjects.Image
  point: GameplayCoinPoint
  collected: boolean
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
  private playerHealth = PLAYER_MAX_HEALTH
  private isPlayerHurting = false
  private isPlayerInvulnerable = false
  private isPlayerDead = false
  private isHomingAttacking = false
  private homingTarget: Phaser.Physics.Arcade.Sprite | null = null
  private homingReticle: Phaser.GameObjects.Image | null = null
  private coins: CoinRuntime[] = []
  private collectedCoins = 0

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
    this.createHomingReticleTexture()
    this.createCoinTexture()
    this.createEnemyAnimations()
    this.createEnemies()
    this.createCoins()
    this.playerKeys = this.createPlayerKeys()
    this.createPlayer()
  }

  update(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }

    this.updateEnemyPatrol()
    this.processActiveMeleeHitboxes()
    this.updateHomingAttack()
    this.checkPlayerOutOfBounds()
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

  private createHomingReticleTexture(): void {
    const graphics = this.make.graphics()
    const size = homingAttackPresentation.reticleSize
    const center = size / 2
    graphics.lineStyle(3, homingAttackPresentation.trailTint, 1)
    graphics.strokeCircle(center, center, 14)
    graphics.lineBetween(center, 3, center, 13)
    graphics.lineBetween(center, 35, center, 45)
    graphics.lineBetween(3, center, 13, center)
    graphics.lineBetween(35, center, 45, center)
    graphics.lineStyle(1, 0xffffff, 0.9)
    graphics.strokeCircle(center, center, 8)
    graphics.generateTexture(homingAttackPresentation.reticleTextureKey, size, size)
    graphics.destroy()
  }

  private createCoinTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0xf4c542)
    graphics.fillCircle(22, 22, 18)
    graphics.lineStyle(3, 0xfff3cf, 1)
    graphics.strokeCircle(22, 22, 18)
    graphics.lineStyle(2, 0xf4c542, 0.85)
    graphics.fillStyle(0xffffff, 0.34)
    graphics.fillEllipse(17, 15, 12, 8)
    graphics.fillStyle(0xc5891f, 0.9)
    graphics.fillRoundedRect(18, 11, 8, 22, 3)
    graphics.generateTexture('coin', 44, 44)
    graphics.destroy()
  }

  private createCoins(): void {
    this.coins = this.stageMap.coins.map((point, index) => {
      const sprite = this.add.image(point.x, point.y, 'coin')
      sprite.setDepth(12)

      this.tweens.add({
        targets: sprite,
        y: point.y - 8,
        duration: 900 + index * 35,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })

      return { sprite, point, collected: false }
    })
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
      .setCollideWorldBounds(false)
      .setDragX(playerActorDefinition.movement.idleDragX)
      .setMaxVelocity(playerActorDefinition.maxVelocity.x, playerActorDefinition.maxVelocity.y)
      .setDepth(playerActorDefinition.depth)

    player.body.setSize(playerActorDefinition.body.width, playerActorDefinition.body.height)
    player.body.setOffset(playerActorDefinition.body.offsetX, playerActorDefinition.body.offsetY)
    this.playPlayerAnimation(player, 'idle')

    this.physics.add.collider(player, this.terrainLayer)
    this.cameras.main.startFollow(player, true, 0.12, 0.12)
    this.playerJumpState = createMovableActorJumpState({
      now: this.time.now,
      grounded: true,
      config: playerActorDefinition.jump,
    })
    this.attackReady = true
    this.isAttacking = false
    this.clearHomingState()
    this.wasAttackDown = false
    this.wasJumpDown = false
    this.activeMeleeHitboxes = []
    this.playerHealth = PLAYER_MAX_HEALTH
    this.isPlayerHurting = false
    this.isPlayerInvulnerable = false
    this.isPlayerDead = false
    this.player = player
    this.createPlayerEnemyOverlaps(player)
  }

  private createPlayerEnemyOverlaps(player: Phaser.Physics.Arcade.Sprite): void {
    for (const enemy of this.enemies) {
      this.physics.add.overlap(player, enemy.sprite, () => {
        this.handlePlayerEnemyContact(enemy)
      })
    }
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

    if (decision === 'none') return

    if (decision === 'homing-then-melee' && this.tryHomingAttack()) {
      return
    }

    if (decision !== 'melee' && decision !== 'homing-then-melee') return

    if (
      !canStartMeleeAttack({
        attackReady: this.attackReady,
        hurting: this.isPlayerHurting,
        homingAttacking: this.isHomingAttacking,
      })
    ) {
      return
    }

    const entry = getMeleeAttackEntryState()
    this.attackReady = entry.attackReady
    this.isAttacking = entry.attacking
    this.player.setFlipX(facing === 'left')
    this.playPlayerAnimation(this.player, 'attack')

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

  private tryHomingAttack(): boolean {
    if (!this.player) return false

    if (
      !canStartHomingAttack({
        attackReady: this.attackReady,
        hurting: this.isPlayerHurting,
        homingAttacking: this.isHomingAttacking,
        dead: this.isPlayerDead,
      })
    ) {
      return false
    }

    const target = this.findHomingTarget()
    if (getHomingTargetAcquisitionDecision({ hasTarget: target !== undefined }) === 'fail' || !target) {
      return false
    }

    const entry = getHomingAttackEntryState()
    this.attackReady = entry.attackReady
    this.isAttacking = entry.attacking
    this.isHomingAttacking = entry.homingAttacking
    this.homingTarget = target
    this.homingReticle?.setVisible(false)
    this.resolveHomingAttack(target)

    return true
  }

  private resolveHomingAttack(target: Phaser.Physics.Arcade.Sprite): void {
    if (!this.player) return

    const startX = this.player.x
    const startY = this.player.y
    const contact = getHomingContactPoint({
      startX,
      startY,
      targetX: target.x,
      targetY: target.y,
    })

    this.player.setFlipX(target.x < startX)
    this.player.setScale(playerActorDefinition.sprites.attack.scale)
    this.player.setTexture(playerActorDefinition.sprites.attack.key, homingAttackPresentation.attackFrame)
    this.emitHomingTrail(startX, startY, contact.x, contact.y)
    this.player.setPosition(contact.x, contact.y)
    this.player.setVelocity(0, 0)

    const enemy = this.enemies.find((candidate) => candidate.sprite === target)
    if (enemy && shouldProcessEnemyDefeat({ enemyExists: true, defeated: enemy.defeated })) {
      this.defeatEnemy(enemy)
    }

    this.finishHomingAttack(true)
  }

  private finishHomingAttack(hit: boolean): void {
    if (!this.player) return

    this.homingTarget = null
    const outcome = getHomingFinishOutcome({
      hit,
      gravitySign: 1,
    })

    if (outcome.remainingAirJumps !== undefined && this.playerJumpState) {
      this.playerJumpState = {
        ...this.playerJumpState,
        remainingAirJumps: outcome.remainingAirJumps,
      }
    }

    this.player.setVelocity(0, outcome.velocityY)

    this.time.delayedCall(homingAttackTiming.recoveryDelayMs, () => {
      const recovery = getHomingRecoveryState({ hurting: this.isPlayerHurting })
      this.isAttacking = recovery.attacking
      if (!this.isPlayerDead && recovery.attackReady !== undefined) {
        this.attackReady = recovery.attackReady
      }
      this.clearHomingState()
    })
  }

  private emitHomingTrail(startX: number, startY: number, endX: number, endY: number): void {
    if (!this.player) return

    for (const sample of getHomingTrailSamples({ startX, startY, endX, endY })) {
      const trail = this.add
        .sprite(sample.x, sample.y, playerActorDefinition.sprites.attack.key, homingAttackPresentation.attackFrame)
        .setDepth(this.player.depth - 1)
        .setScale(this.player.scale)
        .setFlipX(this.player.flipX)
        .setTint(homingAttackPresentation.trailTint)
        .setAlpha(sample.alpha)
        .setBlendMode(Phaser.BlendModes.ADD)

      this.tweens.add({
        targets: trail,
        alpha: 0,
        duration: homingAttackTiming.trailFadeMs,
        delay: homingAttackTiming.trailHoldMs,
        onComplete: () => trail.destroy(),
      })
    }
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

  private clearActiveMeleeHitboxes(): void {
    for (const hitbox of this.activeMeleeHitboxes) {
      hitbox.consumed = true
      hitbox.image.destroy()
    }
    this.activeMeleeHitboxes = []
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

  private handlePlayerEnemyContact(enemy: EnemyRuntime): void {
    if (!this.player) return

    if (
      !canApplyPlayerEnemyHit({
        invulnerable: this.isPlayerInvulnerable,
        hurting: this.isPlayerHurting,
        enemyDefeated: enemy.defeated,
        homingAttacking: this.isHomingAttacking,
        dead: this.isPlayerDead,
      })
    ) {
      return
    }

    const damageOutcome = getPlayerDamageOutcome({ currentHealth: this.playerHealth })
    this.playerHealth = damageOutcome.nextHealth
    if (damageOutcome.type === 'defeated') {
      this.defeatPlayer('damage')
      return
    }

    const entry = getPlayerHurtEntryState()
    this.clearHomingState()
    this.isPlayerHurting = entry.hurting
    this.isPlayerInvulnerable = entry.invulnerable
    this.isAttacking = entry.attacking
    this.attackReady = entry.attackReady
    this.clearActiveMeleeHitboxes()

    const direction = getPlayerKnockbackDirection({
      playerX: this.player.x,
      sourceX: enemy.sprite.x,
    })
    const velocity = getPlayerHurtVelocity({
      direction,
      gravitySign: 1,
    })

    this.player.setVelocity(velocity.x, velocity.y)
    this.playPlayerAnimation(this.player, 'hurt')
    this.tweens.add({
      targets: this.player,
      alpha: playerHurtPresentation.blinkAlpha,
      duration: playerHurtPresentation.blinkDurationMs,
      yoyo: playerHurtPresentation.blinkYoyo,
      repeat: playerHurtPresentation.blinkRepeat,
    })

    this.time.delayedCall(playerLifeTiming.hurtRecoveryDelayMs, () => {
      const recovery = getPlayerHurtRecoveryState()
      this.isPlayerHurting = recovery.hurting
      this.attackReady = recovery.attackReady
    })
    this.time.delayedCall(playerLifeTiming.invulnerabilityRecoveryDelayMs, () => {
      const recovery = getPlayerInvulnerabilityRecoveryState()
      this.isPlayerInvulnerable = recovery.invulnerable
      this.player?.setAlpha(1)
    })
  }

  private checkPlayerOutOfBounds(): void {
    if (!this.player) return

    if (
      isPlayerOutsideWorldBounds({
        x: this.player.x,
        y: this.player.y,
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
        margin: PLAYER_OUT_OF_BOUNDS_MARGIN,
      })
    ) {
      this.defeatPlayer('fall')
    }
  }

  private defeatPlayer(reason: PlayerDefeatReason): void {
    if (!this.player) return

    if (!canEnterPlayerDefeat({ dead: this.isPlayerDead })) {
      return
    }

    const entry = getPlayerDefeatEntryState()
    this.isPlayerDead = entry.dead
    this.isPlayerHurting = entry.hurting
    this.isPlayerInvulnerable = entry.invulnerable
    this.isAttacking = entry.attacking
    this.attackReady = entry.attackReady
    this.clearHomingState()
    this.clearActiveMeleeHitboxes()

    const outcome = getPlayerDefeatOutcome({
      reason,
      gravitySign: 1,
    })

    this.player.setAccelerationX(0)
    this.player.setVelocity(0, outcome.velocityY)
    this.playPlayerAnimation(this.player, 'death')

    this.time.delayedCall(playerLifeTiming.deathRespawnDelayMs, () => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.respawnPlayer()
        this.cameras.main.fadeIn(
          playerDeathTransitionPresentation.fadeInDurationMs,
          playerDeathTransitionPresentation.color.red,
          playerDeathTransitionPresentation.color.green,
          playerDeathTransitionPresentation.color.blue,
        )
      })
      this.cameras.main.fadeOut(
        playerDeathTransitionPresentation.fadeOutDurationMs,
        playerDeathTransitionPresentation.color.red,
        playerDeathTransitionPresentation.color.green,
        playerDeathTransitionPresentation.color.blue,
      )
    })
  }

  private respawnPlayer(): void {
    if (!this.player) return

    const state = getPlayerRespawnState()
    this.playerHealth = state.health
    this.isPlayerHurting = state.hurting
    this.isPlayerInvulnerable = state.invulnerable
    this.isPlayerDead = state.dead
    this.isAttacking = state.attacking
    this.attackReady = state.attackReady
    this.wasAttackDown = false
    this.wasJumpDown = false

    this.player.x = this.stageMap.player.spawn.x
    this.player.y = getPlayerCenterY({ surfaceY: this.stageMap.player.spawn.surfaceY })
    this.player.setVelocity(0, 0)
    this.player.setAccelerationX(0)
    this.player.setAlpha(1)
    if (this.player.body) {
      this.player.body.enable = true
    }
    this.clearHomingState()
    this.playerJumpState = createMovableActorJumpState({
      now: this.time.now,
      grounded: true,
      config: playerActorDefinition.jump,
    })
    this.playPlayerAnimation(this.player, 'idle')
  }

  private clearHomingState(): void {
    this.isHomingAttacking = false
    this.homingTarget = null
    this.homingReticle?.setVisible(false)
  }

  private updatePlayerMovement(): void {
    if (!this.player || !this.playerKeys || !this.playerJumpState) return

    if (this.isPlayerHurting || this.isPlayerDead) {
      return
    }

    const grounded = this.isPlayerGrounded()
    this.updateHomingReticle(grounded)
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

    if (this.isHomingAttacking) {
      this.player.setScale(playerActorDefinition.sprites.attack.scale)
      this.player.setTexture(playerActorDefinition.sprites.attack.key, homingAttackPresentation.attackFrame)
    } else if (this.isAttacking) {
      this.playPlayerAnimation(this.player, 'attack')
    } else if (!grounded || jumpingThisFrame) {
      this.playPlayerAnimation(this.player, 'jump')
    } else if (decision.direction === 'left') {
      this.playPlayerAnimation(this.player, 'run')
    } else if (decision.direction === 'right') {
      this.playPlayerAnimation(this.player, 'run')
    } else {
      this.playPlayerAnimation(this.player, 'idle')
    }
  }

  private playPlayerAnimation(
    player: Phaser.Physics.Arcade.Sprite,
    animationKey: PlayerAnimationKey,
  ): void {
    const sprite = playerActorDefinition.sprites[animationKey]

    player.setScale(sprite.scale)
    player.play(sprite.key, true)
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

  private getPlayerFacingSign(): -1 | 1 {
    return this.player?.flipX ? -1 : 1
  }

  private updateHomingAttack(): void {
    const target = this.homingTarget
    if (!shouldUpdateHomingAttack({
      homingAttacking: this.isHomingAttacking,
      hasTarget: target !== null,
    })) {
      return
    }

    if (!target) return

    const enemy = this.enemies.find((candidate) => candidate.sprite === target)
    if (!enemy || isHomingTargetLost({ defeated: enemy.defeated, active: target.active, visible: target.visible })) {
      this.finishHomingAttack(false)
    }
  }

  private findHomingTarget(): Phaser.Physics.Arcade.Sprite | undefined {
    if (!this.player) return undefined

    const candidates = this.enemies
      .filter((enemy) => isHomingTargetAvailable({
        defeated: enemy.defeated,
        active: enemy.sprite.active,
        visible: enemy.sprite.visible,
      }))
      .map((enemy) => ({
        target: enemy.sprite,
        targetX: enemy.sprite.x,
        distance: Phaser.Math.Distance.Between(this.player!.x, this.player!.y, enemy.sprite.x, enemy.sprite.y),
      }))

    return selectNearestHomingTarget({
      playerX: this.player.x,
      facing: this.getPlayerFacingSign(),
      candidates,
    })
  }

  private updateHomingReticle(grounded: boolean): void {
    if (
      !this.player ||
      !canShowHomingReticle({
        grounded,
        dead: this.isPlayerDead,
        attacking: this.isAttacking,
        hurting: this.isPlayerHurting,
        homingAttacking: this.isHomingAttacking,
      })
    ) {
      this.homingReticle?.setVisible(false)
      this.homingTarget = null
      return
    }

    const target = this.findHomingTarget()
    if (!target) {
      this.homingReticle?.setVisible(false)
      this.homingTarget = null
      return
    }

    this.homingTarget = target
    if (!this.homingReticle) {
      this.homingReticle = this.add
        .image(target.x, target.y + homingAttackPresentation.reticleYOffset, homingAttackPresentation.reticleTextureKey)
        .setDepth(20)
        .setBlendMode(Phaser.BlendModes.ADD)
    }

    this.homingReticle
      .setPosition(target.x, target.y + homingAttackPresentation.reticleYOffset)
      .setVisible(true)
      .setAngle(this.homingReticle.angle + 3)
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
