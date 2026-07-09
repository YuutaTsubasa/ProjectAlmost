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
import {
  canHitBossPrototype,
  canFireBossVolley,
  canRunBossPatternTick,
  canStartBossPattern,
  getBossHitOutcome,
  getBossHudPhaseDisplay,
  getBossPatternDelayMs,
  getBossPhasePlayerResetState,
  getBossVolleyShots,
  isBossStageDefinition,
  shouldResetBossRunAfterHomingHit,
  shouldRestartBossPatternAfterRespawn,
  shouldResetBossSupportCore,
  bossPriestessSpriteAssets,
} from '../../domain/gameplay/bossBattle'
import {
  checkpointActorDefinition,
  getCheckpointBottomY,
} from '../../domain/gameplay/checkpointActor'
import {
  getGoalBottomY,
  goalActorDefinition,
  shouldLockGoalUntilBossDefeated,
} from '../../domain/gameplay/goalActor'
import {
  createInitialGameplayHudState,
  formatGameplayHudTime,
  getHudEnemyMarkers,
  getHudPositionProgress,
  type GameplayHudPatch,
} from '../../domain/gameplay/gameplayHud'
import {
  advanceGameplayStartGate,
  createInitialGameplayStartGateState,
  isGameplayStartGateRunning,
  type GameplayStartGateState,
  type GameplayStartInputSnapshot,
} from '../../domain/gameplay/gameplayStartGate'
import {
  getGroundedHazardCenterY,
  getHazardBodyPresentation,
  getHazardFrameIndex,
  hazardActorDefinitions,
} from '../../domain/gameplay/hazardActor'
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import type {
  GameplayCheckpointSpawn,
  GameplayCoinPoint,
  GameplayEnemySpawn,
  GameplayHazardSpawn,
} from '../../domain/gameplay/gameplayMapTypes'
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
  canApplyPlayerHazardHit,
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
  getHomingLineCoinCollectionDecision,
  homingAttackTiming,
  isHomingTargetAvailable,
  isHomingTargetLost,
  selectNearestHomingTarget,
  shouldUpdateHomingAttack,
} from '../../domain/gameplay/playerHomingAttack'
import {
  getPlayerCoinPickupDecision,
  shouldScanPlayerCoins,
} from '../../domain/gameplay/playerCoinPickup'
import {
  findNextCheckpointIndex,
  getCheckpointRespawnState,
  type PlayerCheckpointGravity,
} from '../../domain/gameplay/playerCheckpoint'
import { canCompleteStage, getStageClearState } from '../../domain/gameplay/stageClear'
import { calculateStageRank } from '../../domain/gameplay/stageResult'
import {
  buildTerrainTileGrid,
  getTileColumnCount,
  getTileRowCount,
  validatePlatformBounds,
} from '../../domain/gameplay/terrain'
import {
  getBossProjectileHitDecision,
  getBossProjectileLifecycleDecision,
  getBossProjectileVelocity,
  isBossProjectileExpired,
  isBossProjectileOutOfBounds,
  shouldUpdateBossProjectiles,
} from '../../domain/gameplay/bossProjectile'

type GameplayRendererInput = {
  parent: HTMLElement
  stage: GameplayStageMap
  onHudUpdate?: (patch: GameplayHudPatch) => void
}

export type GameplayRendererController = {
  game: Phaser.Game
  pause: () => void
  resume: () => void
  resetTiming: () => void
  destroy: () => void
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

type BossProjectileRuntime = Phaser.Physics.Arcade.Sprite

type CoinRuntime = {
  sprite: Phaser.GameObjects.Image
  point: GameplayCoinPoint
  collected: boolean
}

type HazardRuntime = {
  sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody
  spawn: GameplayHazardSpawn
}

type CheckpointRuntime = {
  sprite: Phaser.GameObjects.Image
  glow: Phaser.GameObjects.Ellipse
  ring: Phaser.GameObjects.Ellipse
  spawn: GameplayCheckpointSpawn
  activated: boolean
}

type GoalRuntime = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithStaticBody
  cleared: boolean
}

type CurrentRespawnPoint = {
  x: number
  surfaceY: number
  gravity: PlayerCheckpointGravity
}

type ActiveMeleeHitbox = {
  image: Phaser.GameObjects.Image
  consumed: boolean
}

type PlayerFacingDirection = 'left' | 'right'

const checkpointInactiveTint = 0x4be8ff
const checkpointActivatedTint = 0xfff0a8

class GameplayMapScene extends Phaser.Scene {
  private readonly stageMap: GameplayStageMap
  private readonly onHudUpdate?: (patch: GameplayHudPatch) => void
  private backgroundLayers: BackgroundRuntimeLayer[] = []
  private terrainLayer: Phaser.Tilemaps.TilemapLayer | null = null
  private enemies: EnemyRuntime[] = []
  private player: Phaser.Physics.Arcade.Sprite | null = null
  private playerKeys: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
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
  private bossPrototype: EnemyRuntime | null = null
  private bossProjectiles: BossProjectileRuntime[] = []
  private bossPhase = 0
  private bossShotIndex = 0
  private bossPatternGeneration = 0
  private bossPatternEvent?: Phaser.Time.TimerEvent
  private bossPatternRestartPending = false
  private homingTarget: Phaser.Physics.Arcade.Sprite | null = null
  private homingReticle: Phaser.GameObjects.Image | null = null
  private hazards: HazardRuntime[] = []
  private checkpoints: CheckpointRuntime[] = []
  private goal: GoalRuntime | null = null
  private activeCheckpointIndex = -1
  private currentRespawnPoint: CurrentRespawnPoint
  private coins: CoinRuntime[] = []
  private collectedCoins = 0
  private damageTaken = 0
  private falls = 0
  private enemiesDefeated = 0
  private stageCleared = false
  private gameplayElapsedMs = 0
  private gameplayStartGateState: GameplayStartGateState = createInitialGameplayStartGateState()

  constructor(stage: GameplayStageMap, onHudUpdate?: (patch: GameplayHudPatch) => void) {
    super(`GameplayMapScene:${stage.id}`)
    this.stageMap = stage
    this.onHudUpdate = onHudUpdate
    this.currentRespawnPoint = {
      x: stage.player.spawn.x,
      surfaceY: stage.player.spawn.surfaceY,
      gravity: 'down',
    }
  }

  private get isBossStage(): boolean {
    return isBossStageDefinition({
      stageId: this.stageMap.id,
      enemies: this.stageMap.enemies,
    })
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

    if (this.isBossStage) {
      for (const sprite of Object.values(bossPriestessSpriteAssets)) {
        this.load.spritesheet(sprite.key, sprite.assetRef, {
          frameWidth: sprite.frameWidth,
          frameHeight: sprite.frameHeight,
        })
      }
    }

    for (const definition of Object.values(hazardActorDefinitions)) {
      this.load.spritesheet(definition.sprite.key, definition.sprite.assetRef, {
        frameWidth: definition.sprite.frameWidth,
        frameHeight: definition.sprite.frameHeight,
      })
    }

    this.load.image(checkpointActorDefinition.sprite.key, checkpointActorDefinition.sprite.assetRef)
    this.load.spritesheet(goalActorDefinition.sprite.key, goalActorDefinition.sprite.assetRef, {
      frameWidth: goalActorDefinition.sprite.frameWidth,
      frameHeight: goalActorDefinition.sprite.frameHeight,
    })
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
    this.createGoalAnimation()
    this.createEnemyTextures()
    this.createAttackHitboxTexture()
    this.createHomingReticleTexture()
    this.createCoinTexture()
    this.createBossProjectileTexture()
    this.createEnemyAnimations()
    this.createBossPriestessAnimations()
    this.createEnemies()
    this.initializeBossPrototype()
    this.createHazards()
    this.createCheckpoints()
    this.createGoal()
    this.createCoins()
    this.playerKeys = this.createPlayerKeys()
    this.createPlayer()
    this.damageTaken = 0
    this.falls = 0
    this.enemiesDefeated = 0
    this.gameplayElapsedMs = 0
    this.gameplayStartGateState = createInitialGameplayStartGateState()
    this.emitHudPatch(createInitialGameplayHudState(this.stageMap))

    if (this.isBossStage) {
      this.emitBossHudPatch()
    }
  }

  update(_time?: number, delta?: number): void {
    this.updatePresentationOnlySystems()

    this.gameplayStartGateState = advanceGameplayStartGate(
      this.gameplayStartGateState,
      this.getGameplayStartInputSnapshot(),
    )

    if (!this.isGameplayRunning()) {
      this.emitHudPositionPatch()
      return
    }

    if (
      !this.isPlayerDead
      && this.bossPrototype
      && !this.bossPatternEvent
      && !this.bossPatternRestartPending
    ) {
      this.startBossPattern()
    }

    this.advanceGameplayElapsed(delta)

    this.updateEnemyPatrol()
    this.updateBossProjectiles()
    this.processActiveMeleeHitboxes()
    this.updateHomingAttack()
    this.updateCoins()
    this.updateCheckpoints()
    this.checkPlayerOutOfBounds()
    this.updatePlayerMovement()
    this.emitHudPositionPatch()
  }

  private updatePresentationOnlySystems(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }
  }

  private getGameplayStartInputSnapshot(): GameplayStartInputSnapshot {
    const keys = this.playerKeys

    if (!keys) {
      return {
        leftHeld: false,
        rightHeld: false,
        crouchHeld: false,
        jumpPressed: false,
        jumpHeld: false,
        attackPressed: false,
        attackHeld: false,
      }
    }

    const jumpHeld = keys.space.isDown || keys.up.isDown || keys.w.isDown
    const attackHeld = keys.j.isDown || keys.z.isDown

    return {
      leftHeld: keys.left.isDown || keys.a.isDown,
      rightHeld: keys.right.isDown || keys.d.isDown,
      crouchHeld: keys.down.isDown || keys.s.isDown,
      jumpPressed: jumpHeld && !this.wasJumpDown,
      jumpHeld,
      attackPressed: attackHeld && !this.wasAttackDown,
      attackHeld,
    }
  }

  private advanceGameplayElapsed(delta?: number): void {
    const elapsedDelta = Number.isFinite(delta)
      ? Number(delta)
      : this.time.now - this.gameplayElapsedMs

    this.gameplayElapsedMs += Math.max(0, elapsedDelta)
  }

  private emitHudPatch(patch: GameplayHudPatch): void {
    this.onHudUpdate?.(patch)
  }

  private emitHudPositionPatch(): void {
    if (!this.player || this.stageCleared) {
      return
    }

    this.emitHudPatch({
      playerProgress: getHudPositionProgress({
        position: this.player.x,
        worldSize: this.stageMap.world.width,
      }),
      playerProgressY: getHudPositionProgress({
        position: this.player.y,
        worldSize: this.stageMap.world.height,
      }),
      enemyMarkers: getHudEnemyMarkers({
        enemies: this.enemies.map((enemy) => ({
          x: enemy.sprite.x,
          y: enemy.sprite.y,
          defeated: enemy.defeated,
        })),
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      }),
      time: formatGameplayHudTime(this.gameplayElapsedMs),
    })
  }

  private isGameplayRunning(): boolean {
    return isGameplayStartGateRunning(this.gameplayStartGateState)
  }

  private createBackgroundLayers(): void {
    this.backgroundLayers = this.stageMap.backgroundLayers.map((layer) => {
      const sprite = this.add
        .tileSprite(0, 0, layer.width, layer.height, layer.id)
        .setOrigin(0)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(layer.depth)

      if (layer.alpha !== undefined) {
        sprite.setAlpha(layer.alpha)
      }

      if (layer.tint !== undefined) {
        sprite.setTint(layer.tint)
      }

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

  private createGoalAnimation(): void {
    this.anims.create({
      key: goalActorDefinition.animation.idleKey,
      frames: this.anims.generateFrameNumbers(goalActorDefinition.sprite.key, {
        start: goalActorDefinition.animation.frameStart,
        end: goalActorDefinition.animation.frameEnd,
      }),
      frameRate: goalActorDefinition.animation.frameRate,
      repeat: goalActorDefinition.animation.repeat,
      yoyo: goalActorDefinition.animation.yoyo,
    })
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

  private createBossProjectileTexture(): void {
    if (!this.isBossStage) return

    const graphics = this.make.graphics()
    graphics.fillStyle(0xffffff, 0.95)
    graphics.fillCircle(14, 14, 8)
    graphics.lineStyle(4, 0x8be7ff, 0.9)
    graphics.strokeCircle(14, 14, 10)
    graphics.lineStyle(2, 0x4be8ff, 0.8)
    graphics.strokeCircle(14, 14, 13)
    graphics.generateTexture('boss-projectile', 28, 28)
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

  private createCheckpoints(): void {
    this.checkpoints = this.stageMap.checkpoints.map((spawn, index) => {
      const bottomY = getCheckpointBottomY({ surfaceY: spawn.surfaceY })
      const glow = this.add
        .ellipse(
          spawn.x,
          bottomY + checkpointActorDefinition.glow.yOffset,
          checkpointActorDefinition.glow.width,
          checkpointActorDefinition.glow.height,
          checkpointInactiveTint,
          checkpointActorDefinition.glow.alpha,
        )
        .setDepth(checkpointActorDefinition.glow.depth)
        .setBlendMode(Phaser.BlendModes.ADD)
      const ring = this.add
        .ellipse(
          spawn.x,
          bottomY + checkpointActorDefinition.ring.yOffset,
          checkpointActorDefinition.ring.width,
          checkpointActorDefinition.ring.height,
          checkpointInactiveTint,
          0,
        )
        .setStrokeStyle(
          checkpointActorDefinition.ring.strokeWidth,
          checkpointInactiveTint,
          checkpointActorDefinition.ring.alpha,
        )
        .setDepth(checkpointActorDefinition.ring.depth)
        .setBlendMode(Phaser.BlendModes.ADD)
      const sprite = this.add
        .image(spawn.x, bottomY, checkpointActorDefinition.sprite.key)
        .setOrigin(checkpointActorDefinition.origin.x, checkpointActorDefinition.origin.y)
        .setDisplaySize(
          checkpointActorDefinition.displaySize.width,
          checkpointActorDefinition.displaySize.height,
        )
        .setAlpha(checkpointActorDefinition.inactiveAlpha)
        .setDepth(checkpointActorDefinition.depth)

      this.tweens.add({
        targets: [glow, ring],
        alpha: {
          from: checkpointActorDefinition.idleTween.alphaFrom,
          to: checkpointActorDefinition.idleTween.alphaTo,
        },
        scale: {
          from: checkpointActorDefinition.idleTween.scaleFrom,
          to: checkpointActorDefinition.idleTween.scaleTo,
        },
        duration:
          checkpointActorDefinition.idleTween.durationMs
          + index * checkpointActorDefinition.idleTween.indexDelayMs,
        ease: checkpointActorDefinition.idleTween.ease,
        yoyo: true,
        repeat: -1,
      })

      return {
        sprite,
        glow,
        ring,
        spawn,
        activated: false,
      }
    })
  }

  private createHazards(): void {
    this.hazards = this.stageMap.hazards.map((spawn) => {
      const definition = hazardActorDefinitions[spawn.type]
      const sprite = this.physics.add.staticImage(
        spawn.x,
        getGroundedHazardCenterY({
          surfaceY: spawn.surfaceY,
          height: spawn.height,
          type: spawn.type,
        }),
        definition.sprite.key,
        getHazardFrameIndex({ orientation: spawn.orientation }),
      )
      sprite.setOrigin(definition.origin.x, definition.origin.y)
      sprite.setDisplaySize(spawn.width, spawn.height)
      sprite.setDepth(8)
      sprite.refreshBody()

      const body = getHazardBodyPresentation({
        width: spawn.width,
        height: spawn.height,
        type: spawn.type,
      })
      sprite.body.setSize(body.width, body.height)
      sprite.body.setOffset(body.offsetX, body.offsetY)

      return { sprite, spawn }
    })
  }

  private createGoal(): void {
    const sprite = this.physics.add.staticSprite(
      this.stageMap.goal.x,
      getGoalBottomY({ surfaceY: this.stageMap.goal.surfaceY }),
      goalActorDefinition.sprite.key,
    )
    sprite.setOrigin(goalActorDefinition.origin.x, goalActorDefinition.origin.y)
    sprite.setDisplaySize(
      goalActorDefinition.displaySize.width,
      goalActorDefinition.displaySize.height,
    )
    sprite.refreshBody()
    sprite.body.setSize(goalActorDefinition.body.width, goalActorDefinition.body.height)
    sprite.body.setOffset(goalActorDefinition.body.offsetX, goalActorDefinition.body.offsetY)
    sprite.setDepth(goalActorDefinition.depth)
    sprite.play(goalActorDefinition.animation.idleKey)

    if (shouldLockGoalUntilBossDefeated({
      isBossStage: this.isBossStage,
      bossDefeated: this.bossPrototype?.defeated ?? false,
    })) {
      sprite.setVisible(false)
      sprite.body.enable = false
    }

    this.goal = {
      sprite,
      cleared: false,
    }
  }

  private updateCoins(): void {
    if (!this.player) return

    if (!shouldScanPlayerCoins({
      stageCleared: this.stageCleared,
      dead: this.isPlayerDead,
    })) {
      return
    }

    const playerCenter = this.player.getCenter()
    for (const coin of this.coins) {
      const pickupDecision = getPlayerCoinPickupDecision({
        collected: coin.collected,
        playerX: playerCenter.x,
        playerY: playerCenter.y,
        coinX: coin.sprite.x,
        coinY: coin.sprite.y,
      })
      if (pickupDecision === 'collect') {
        this.collectCoin(coin)
      }
    }
  }

  private updateCheckpoints(): void {
    if (!this.player || this.isPlayerDead || this.stageCleared) return

    const nextCheckpointIndex = findNextCheckpointIndex({
      checkpoints: this.stageMap.checkpoints,
      activeCheckpointIndex: this.activeCheckpointIndex,
      playerX: this.player.x,
    })
    if (nextCheckpointIndex === -1) {
      return
    }

    const checkpoint = this.checkpoints[nextCheckpointIndex]
    if (!checkpoint) {
      return
    }

    this.activateCheckpoint(nextCheckpointIndex, checkpoint)
  }

  private activateCheckpoint(index: number, checkpoint: CheckpointRuntime): void {
    if (checkpoint.activated) return

    this.activeCheckpointIndex = index
    this.emitHudPatch({
      activeCheckpointIndex: this.activeCheckpointIndex,
      checkpointsReached: this.getReachedCheckpointCount(),
    })
    checkpoint.activated = true
    this.currentRespawnPoint = getCheckpointRespawnState({
      checkpoint: checkpoint.spawn,
      currentGravity: this.currentRespawnPoint.gravity,
    })

    checkpoint.sprite
      .setAlpha(checkpointActorDefinition.activatedAlpha)
      .setTint(checkpointActorDefinition.activatedTint)
    checkpoint.glow.setFillStyle(checkpointActivatedTint, 0.7)
    checkpoint.ring.setStrokeStyle(4, checkpointActivatedTint, 1)

    this.tweens.add({
      targets: [checkpoint.glow, checkpoint.ring],
      alpha: 1,
      duration: checkpointActorDefinition.activationTween.durationMs,
      yoyo: true,
    })
  }

  private collectCoin(coin: CoinRuntime): void {
    if (coin.collected) return

    coin.collected = true
    this.collectedCoins += 1
    this.emitHudPatch({ coins: this.collectedCoins })
    this.tweens.killTweensOf(coin.sprite)
    this.tweens.add({
      targets: coin.sprite,
      y: coin.sprite.y - 34,
      scale: 1.8,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => {
        coin.sprite.setVisible(false)
      },
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

  private createBossPriestessAnimations(): void {
    if (!this.isBossStage) return

    for (const sprite of Object.values(bossPriestessSpriteAssets)) {
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
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      s: Phaser.Input.Keyboard.KeyCodes.S,
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
    this.collectedCoins = 0
    this.player = player
    this.createPlayerEnemyOverlaps(player)

    if (this.goal) {
      this.physics.add.overlap(player, this.goal.sprite, () => {
        if (!this.isGameplayRunning() || this.isPlayerDead) {
          return
        }

        this.completeStage()
      })
    }
  }

  private createPlayerEnemyOverlaps(player: Phaser.Physics.Arcade.Sprite): void {
    for (const enemy of this.enemies) {
      this.physics.add.overlap(player, enemy.sprite, () => {
        this.handlePlayerEnemyContact(enemy)
      })
    }

    for (const hazard of this.hazards) {
      this.physics.add.overlap(player, hazard.sprite, () => this.handlePlayerHazardContact(hazard))
    }
  }

  private completeStage(): void {
    if (
      this.isPlayerDead ||
      !canCompleteStage({
        stageCleared: this.stageCleared,
        bossDefeated: this.isBossStage ? (this.bossPrototype?.defeated ?? false) : undefined,
      })
    ) {
      return
    }

    const clearState = getStageClearState()
    this.stageCleared = clearState.stageCleared
    this.isAttacking = clearState.attacking
    this.isHomingAttacking = clearState.homingAttacking
    this.attackReady = clearState.attackReady
    this.isPlayerHurting = false
    this.isPlayerInvulnerable = false
    this.clearHomingState()
    this.clearActiveMeleeHitboxes()
    this.stopBossPattern('destroy')

    if (this.player) {
      this.tweens.killTweensOf(this.player)
      this.player.setVelocity(0, 0)
      this.player.setAccelerationX(0)
      this.player.setAlpha(1)
      this.playPlayerAnimation(this.player, 'idle')
    }

    for (const enemy of this.enemies) {
      enemy.sprite.setVelocityX(0)
      this.tweens.killTweensOf(enemy.sprite)
    }

    if (this.goal) {
      this.goal.cleared = true
      this.goal.sprite.setTint(goalActorDefinition.activatedTint)
    }

    const result = this.createClearResultSnapshot()
    this.emitHudPatch({ cleared: true, rank: result.rank, result })
  }

  private getReachedCheckpointCount(): number {
    return this.activeCheckpointIndex + 1
  }

  private createClearResultSnapshot() {
    const elapsedMs = Math.max(0, Math.floor(this.gameplayElapsedMs))
    const rank = calculateStageRank({
      elapsedMs,
      rankTargets: this.stageMap.rankTargets,
      coins: this.collectedCoins,
      coinTarget: this.stageMap.coins.length,
      enemiesDefeated: this.enemiesDefeated,
      enemyTarget: this.stageMap.enemies.length,
      checkpointsReached: this.getReachedCheckpointCount(),
      checkpointTarget: this.stageMap.checkpoints.length,
      damageTaken: this.damageTaken,
      falls: this.falls,
    })

    return {
      elapsedMs,
      time: formatGameplayHudTime(elapsedMs),
      coins: this.collectedCoins,
      coinTarget: this.stageMap.coins.length,
      damageTaken: this.damageTaken,
      falls: this.falls,
      enemiesDefeated: this.enemiesDefeated,
      enemyTarget: this.stageMap.enemies.length,
      checkpointsReached: this.getReachedCheckpointCount(),
      checkpointTarget: this.stageMap.checkpoints.length,
      rank,
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
        sprite.setVelocityX(0)
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

  private initializeBossPrototype(): void {
    if (!this.isBossStage) return

    this.bossPrototype = this.enemies.find((enemy) => enemy.spawn.id === 'boss-prototype') ?? null
    if (this.bossPrototype) {
      this.applyBossPriestessPresentation(this.bossPrototype, 'cast')
    }
  }

  private applyBossPriestessPresentation(
    boss: EnemyRuntime,
    state: keyof typeof bossPriestessSpriteAssets,
  ): void {
    const sprite = bossPriestessSpriteAssets[state]
    boss.sprite
      .setTexture(sprite.key, sprite.frameStart)
      .setScale(sprite.scale)
      .play(sprite.key, true)

    const body = boss.sprite.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.setSize(sprite.body.width, sprite.body.height)
      body.setOffset(sprite.body.offsetX, sprite.body.offsetY)
    }
  }

  private startBossPattern(): void {
    const boss = this.bossPrototype
    if (!this.player) {
      return
    }
    if (!canStartBossPattern({
      bossExists: boss !== null,
      bossType: boss?.spawn.type,
      bossPhase: this.bossPhase,
      stageCleared: this.stageCleared,
    }) || !boss) {
      return
    }

    this.stopBossPattern('fade')
    this.bossPatternRestartPending = false
    this.applyBossPriestessPresentation(boss, 'cast')
    const generation = ++this.bossPatternGeneration
    this.bossShotIndex = 0

    for (const enemy of this.enemies) {
      if (shouldResetBossSupportCore({ sameAsBoss: enemy === boss, enemyType: enemy.spawn.type })) {
        this.resetEnemyRuntime(enemy)
      }
    }

    this.emitBossHudPatch()
    this.fireBossVolley(this.bossPhase, this.bossShotIndex++)
    this.bossPatternEvent = this.time.addEvent({
      delay: getBossPatternDelayMs({ phase: this.bossPhase }),
      loop: true,
      callback: () => {
        if (!canRunBossPatternTick({
          generation,
          currentGeneration: this.bossPatternGeneration,
          stageCleared: this.stageCleared,
          playerDead: this.isPlayerDead,
        })) {
          return
        }

        this.fireBossVolley(this.bossPhase, this.bossShotIndex++)
      },
    })
  }

  private fireBossVolley(phase: number, shotIndex: number): void {
    const boss = this.bossPrototype
    if (!canFireBossVolley({
      bossExists: boss !== null,
      bossVisible: boss?.sprite.visible ?? false,
    }) || !boss || !this.player) {
      return
    }

    const aimedAngle = Phaser.Math.Angle.Between(
      boss.sprite.x,
      boss.sprite.y,
      this.player.x,
      this.player.y,
    )
    for (const shot of getBossVolleyShots({ phase, shotIndex, aimedAngle })) {
      this.spawnBossProjectile(boss.sprite.x, boss.sprite.y, shot.angle, shot.speed)
    }
  }

  private spawnBossProjectile(x: number, y: number, angle: number, speed: number): void {
    const projectile = this.physics.add.sprite(x, y, 'boss-projectile')
    projectile.body.allowGravity = false
    const velocity = getBossProjectileVelocity({ angle, speed })
    projectile.setVelocity(velocity.x, velocity.y)
    projectile.setDepth(16)
    projectile.setBlendMode(Phaser.BlendModes.ADD)
    projectile.setData('spawnedAt', this.time.now)
    this.bossProjectiles.push(projectile)
  }

  private resetEnemyRuntime(enemy: EnemyRuntime): void {
    const definition = enemyActorDefinitions[enemy.spawn.type]

    enemy.defeated = false
    enemy.sprite
      .setVisible(true)
      .setAlpha(1)
      .setScale(definition.scale)
      .setAngle(0)
      .setVelocity(0, 0)

    if (enemy.spawn.type === 'armor-guard') {
      const walk = enemyActorDefinitions['armor-guard'].sprites?.walk
      if (walk) {
        enemy.sprite.play(walk.key, true)
      }
    } else {
      const textureKey = enemyActorDefinitions['azure-core'].generatedTexture?.key
      if (textureKey) {
        enemy.sprite.setTexture(textureKey)
      }
    }

    const body = enemy.sprite.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.enable = true
    }
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

  private isPlayerCrouching(): boolean {
    if (!this.playerKeys) return false

    return this.isPlayerGrounded() && (this.playerKeys.down.isDown || this.playerKeys.s.isDown)
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
      if (this.stageCleared) return
      const end = getMeleeAttackEndState()
      this.isAttacking = end.attacking
    })
    this.time.delayedCall(meleeAttackTiming.readyDelayMs, () => {
      if (this.stageCleared) return
      const ready = getMeleeAttackReadyState()
      this.attackReady = ready.attackReady
    })
  }

  private tryHomingAttack(): boolean {
    if (!this.player || this.stageCleared) return false

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
    this.collectCoinsAlongLine(startX, startY, contact.x, contact.y)
    this.emitHomingTrail(startX, startY, contact.x, contact.y)
    this.player.setPosition(contact.x, contact.y)
    this.player.setVelocity(0, 0)

    const enemy = this.enemies.find((candidate) => candidate.sprite === target)
    const resetsBossRun = shouldResetBossRunAfterHomingHit({
      targetIsBoss: target === this.bossPrototype?.sprite,
      bossPhase: this.bossPhase,
    })
    if (enemy === this.bossPrototype) {
      this.handleBossPrototypeHit()
      if (!resetsBossRun) {
        this.finishHomingAttack(true)
      }
      return
    }

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
      if (this.stageCleared) return
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

  private collectCoinsAlongLine(startX: number, startY: number, endX: number, endY: number): void {
    for (const coin of this.coins) {
      const collectionDecision = getHomingLineCoinCollectionDecision({
        collected: coin.collected,
        startX,
        startY,
        endX,
        endY,
        pointX: coin.sprite.x,
        pointY: coin.sprite.y,
      })
      if (collectionDecision === 'collect') {
        this.collectCoin(coin)
      }
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

  private updateBossProjectiles(): void {
    if (!shouldUpdateBossProjectiles({ projectileCount: this.bossProjectiles.length })) return
    if (!this.player) return

    for (const projectile of [...this.bossProjectiles]) {
      const expired = isBossProjectileExpired({
        now: this.time.now,
        spawnedAt: Number(projectile.getData('spawnedAt')),
      })
      const outside = isBossProjectileOutOfBounds({
        x: projectile.x,
        y: projectile.y,
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      })
      const lifecycle = getBossProjectileLifecycleDecision({ outside, expired })
      if (lifecycle === 'destroy') {
        this.destroyBossProjectile(projectile)
        continue
      }
      if (lifecycle === 'fade') {
        this.fadeBossProjectile(projectile)
        continue
      }

      const hit = getBossProjectileHitDecision({
        playerDead: this.isPlayerDead,
        playerCrouching: this.isPlayerCrouching(),
        distanceToPlayer: Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          projectile.x,
          projectile.y,
        ),
      })
      if (hit === 'blocked-by-crouch') {
        this.destroyBossProjectile(projectile)
      } else if (hit === 'hit') {
        this.destroyBossProjectile(projectile)
        if (
          !canApplyPlayerHazardHit({
            invulnerable: this.isPlayerInvulnerable,
            hurting: this.isPlayerHurting,
            homingAttacking: this.isHomingAttacking,
            dead: this.isPlayerDead,
          })
        ) {
          continue
        }
        this.applyPlayerContactDamage(projectile.x)
      }
    }
  }

  private destroyBossProjectile(projectile: BossProjectileRuntime): void {
    this.bossProjectiles = this.bossProjectiles.filter((candidate) => candidate !== projectile)
    projectile.destroy()
  }

  private fadeBossProjectile(projectile: BossProjectileRuntime, durationMs = 220): void {
    this.bossProjectiles = this.bossProjectiles.filter((candidate) => candidate !== projectile)
    const body = projectile.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.enable = false
    }
    this.tweens.add({
      targets: projectile,
      alpha: 0,
      scale: projectile.scale * 0.72,
      duration: durationMs,
      onComplete: () => projectile.destroy(),
    })
  }

  private clearBossProjectiles(): void {
    for (const projectile of [...this.bossProjectiles]) {
      this.fadeBossProjectile(projectile, 160)
    }
  }

  private destroyBossProjectiles(): void {
    for (const projectile of [...this.bossProjectiles]) {
      this.destroyBossProjectile(projectile)
    }
  }

  private stopBossPattern(projectileCleanup: 'fade' | 'destroy'): void {
    this.bossPatternGeneration += 1
    this.bossPatternEvent?.remove(false)
    this.bossPatternEvent = undefined

    if (projectileCleanup === 'fade') {
      this.clearBossProjectiles()
      return
    }

    this.destroyBossProjectiles()
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
    if (enemy === this.bossPrototype && this.handleBossPrototypeHit()) {
      return
    }

    enemy.defeated = true
    this.enemiesDefeated += 1
    this.emitHudPatch({
      enemiesDefeated: this.enemiesDefeated,
      enemyMarkers: getHudEnemyMarkers({
        enemies: this.enemies.map((candidate) => ({
          x: candidate.sprite.x,
          y: candidate.sprite.y,
          defeated: candidate.defeated,
        })),
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      }),
    })
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

  private handleBossPrototypeHit(): boolean {
    const boss = this.bossPrototype
    if (
      !canHitBossPrototype({
        bossExists: boss !== null,
        bossDefeated: boss?.defeated ?? true,
      }) || !boss
    ) {
      return false
    }

    this.stopBossPattern('fade')

    const outcome = getBossHitOutcome({ currentPhase: this.bossPhase })
    this.bossPhase = outcome.nextPhase

    if (outcome.type === 'defeated') {
      this.defeatBossPrototype(boss)
      return true
    }

    this.advanceBossPhase(boss)
    return true
  }

  private advanceBossPhase(boss: EnemyRuntime): void {
    this.applyBossPriestessPresentation(boss, 'hurt')
    boss.sprite.setVelocity(0, 0)
    this.tweens.add({
      targets: boss.sprite,
      scale: boss.sprite.scale * 1.18,
      alpha: 0.5,
      duration: 160,
      yoyo: true,
    })

    const reset = getBossPhasePlayerResetState({ maxHealth: PLAYER_MAX_HEALTH })
    this.playerHealth = reset.health
    this.isAttacking = reset.attacking
    this.isHomingAttacking = reset.homingAttacking
    this.attackReady = reset.attackReady
    this.isPlayerHurting = false
    this.isPlayerInvulnerable = false
    this.wasAttackDown = false
    this.wasJumpDown = false
    this.clearActiveMeleeHitboxes()
    this.clearHomingState()
    this.respawnPlayerAtCurrentPoint()
    this.emitBossHudPatch()
    this.emitHudPatch({
      hp: this.playerHealth,
      statusMessageKey: 'status.bossPattern',
    })
    this.bossPatternRestartPending = true
    this.time.delayedCall(620, () => {
      this.bossPatternRestartPending = false
      if (this.isPlayerDead) return
      this.startBossPattern()
    })
  }

  private defeatBossPrototype(boss: EnemyRuntime): void {
    boss.defeated = true
    this.enemiesDefeated += 1
    this.applyBossPriestessPresentation(boss, 'death')
    boss.sprite.setVelocity(0, 0)
    const body = boss.sprite.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.enable = false
    }
    this.tweens.add({
      targets: boss.sprite,
      scale: boss.sprite.scale * 1.8,
      alpha: 0,
      angle: boss.sprite.angle + 90,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => boss.sprite.setVisible(false),
    })

    if (this.goal) {
      this.goal.sprite.setVisible(true)
      this.goal.sprite.body.enable = true
      this.goal.sprite.clearTint()
    }

    const phase = getBossHudPhaseDisplay({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })
    this.emitHudPatch({
      enemiesDefeated: this.enemiesDefeated,
      enemyMarkers: getHudEnemyMarkers({
        enemies: this.enemies.map((candidate) => ({
          x: candidate.sprite.x,
          y: candidate.sprite.y,
          defeated: candidate.defeated,
        })),
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      }),
      bossPhase: phase.phase,
      bossPhaseMax: phase.max,
      statusMessageKey: 'status.bossDefeated',
    })
  }

  private handlePlayerEnemyContact(enemy: EnemyRuntime): void {
    if (!this.player || this.stageCleared || !this.isGameplayRunning()) return

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

    this.applyPlayerContactDamage(enemy.sprite.x)
  }

  private applyPlayerContactDamage(sourceX: number): void {
    if (!this.player) return

    const damageOutcome = getPlayerDamageOutcome({ currentHealth: this.playerHealth })
    this.playerHealth = damageOutcome.nextHealth
    this.damageTaken += 1
    this.emitHudPatch({
      hp: Math.max(0, this.playerHealth),
      damageTaken: this.damageTaken,
    })
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
      sourceX,
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
      if (this.stageCleared) return
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

  private handlePlayerHazardContact(hazard: HazardRuntime): void {
    if (!this.player || this.stageCleared || !this.isGameplayRunning()) return

    if (
      !canApplyPlayerHazardHit({
        invulnerable: this.isPlayerInvulnerable,
        hurting: this.isPlayerHurting,
        homingAttacking: this.isHomingAttacking,
        dead: this.isPlayerDead,
      })
    ) {
      return
    }

    this.applyPlayerContactDamage(hazard.sprite.x)
  }

  private checkPlayerOutOfBounds(): void {
    if (!this.player || this.stageCleared) return

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
    this.stopBossPattern('destroy')
    if (reason === 'fall') {
      this.falls += 1
      this.emitHudPatch({ falls: this.falls })
    }

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
    if (!this.player || this.stageCleared) return

    this.stopBossPattern('destroy')

    const state = getPlayerRespawnState()
    this.playerHealth = state.health
    this.emitHudPatch({ hp: this.playerHealth })
    this.isPlayerHurting = state.hurting
    this.isPlayerInvulnerable = state.invulnerable
    this.isPlayerDead = state.dead
    this.isAttacking = state.attacking
    this.attackReady = state.attackReady
    this.wasAttackDown = false
    this.wasJumpDown = false

    this.clearHomingState()
    this.respawnPlayerAtCurrentPoint()

    if (shouldRestartBossPatternAfterRespawn({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })) {
      this.bossPatternRestartPending = true
      this.time.delayedCall(500, () => {
        this.bossPatternRestartPending = false
        if (this.isPlayerDead) return
        this.startBossPattern()
      })
    }
  }

  private respawnPlayerAtCurrentPoint(): void {
    if (!this.player) return

    this.player.x = this.currentRespawnPoint.x
    this.player.y = getPlayerCenterY({ surfaceY: this.currentRespawnPoint.surfaceY })
    this.player.setVelocity(0, 0)
    this.player.setAccelerationX(0)
    this.player.setAlpha(1)
    if (this.player.body) {
      this.player.body.enable = true
    }
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

  private emitBossHudPatch(): void {
    const phase = getBossHudPhaseDisplay({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })
    this.emitHudPatch({
      bossPhase: phase.phase,
      bossPhaseMax: phase.max,
      statusMessageKey: 'status.bossPattern',
    })
  }

  private updatePlayerMovement(): void {
    if (!this.player || !this.playerKeys || !this.playerJumpState) return

    if (this.stageCleared || this.isPlayerHurting || this.isPlayerDead) {
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
    if (this.stageCleared) {
      return
    }

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
      this.stageCleared ||
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
    scene: [new GameplayMapScene(input.stage, input.onHudUpdate)],
  }
}

export function createGameplayRenderer(input: GameplayRendererInput): GameplayRendererController {
  const sceneKey = `GameplayMapScene:${input.stage.id}`
  const game = new Phaser.Game(createGameplayRendererConfig(input))

  return {
    game,
    pause: () => {
      game.scene.pause(sceneKey)
    },
    resume: () => {
      game.scene.resume(sceneKey)
    },
    resetTiming: () => {
      game.loop.resetDelta()
    },
    destroy: () => {
      game.destroy(true)
    },
  }
}
