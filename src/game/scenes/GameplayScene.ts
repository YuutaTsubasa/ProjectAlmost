import * as Phaser from 'phaser'
import { IMAGE_ASSETS } from '../assets/assetManifest'
import { getEnemySpawnY, getHazardFrameIndex, getPlayerCenterY, groundedBottomY, groundedHazardCenterY, objectDefinitions } from '../objects/objectDefinitions'
import type { CoinPoint, EnemyPoint, GravityZone, HazardRect, MovingPlatformRect, PlatformRect, StageData, SurfaceZone } from '../stages/stageTypes'
import type { TranslationKey, TranslationParams } from '../../i18n'
import { findNextCheckpointIndex, getCheckpointTargetCount, getReachedCheckpointCount } from '../../domain/stage/checkpointRules'
import { getCoinTargetCount } from '../../domain/stage/coinRules'
import { canCompleteStage, getStageClearState } from '../../domain/stage/stageClearRules'
import { formatCoinLabel, formatHealthLabel } from '../../domain/stage/hudLabelRules'
import { getHudCheckpointMarkers, getHudEnemyMarkers, getHudGoalProgress, getHudPlatformMarkers } from '../../domain/stage/hudMapRules'
import { getHudProgress } from '../../domain/stage/hudProgressRules'
import { formatStageTimer, getStageInputArmedState, shouldAdvanceStageTimer, shouldStartStageAction } from '../../domain/stage/timerRules'
import { calculateStageRank } from '../../domain/scoring/scoringRules'
import type { ClearRank } from '../../domain/scoring/rank'
import { isOutOfBounds } from '../../domain/world/bounds'
import {
  findActiveGravityZone,
  getPlayerBodyGravityY,
  getVerticalGravitySign,
  shouldFlipPlayerYForGravity,
  shouldUpdateGravityZones,
} from '../../domain/world/gravityRules'
import {
  getMovingPlatformUpdateDecision,
  getMovingPlatformPosition,
  isMovingPlatformRider,
} from '../../domain/world/movingPlatformRules'
import { findActiveSurfaceZone } from '../../domain/world/surfaceRules'
import { getPlatformTileIndex, getTileColumnCount, getTileRowCount } from '../../domain/world/terrainRules'
import {
  getBossProjectileHitDecision,
  getBossProjectileLifecycleDecision,
  getBossProjectileVelocity,
  isBossProjectileExpired,
  isBossProjectileOutOfBounds,
  shouldUpdateBossProjectiles,
} from '../../domain/boss/projectileRules'
import {
  BOSS_PHASE_COUNT,
  canFireBossVolley,
  canHitBossPrototype,
  canRunBossPatternTick,
  canStartBossPattern,
  getBossPhasePlayerResetState,
  getBossHudPhaseDisplay,
  getBossPatternDelayMs,
  getBossHitOutcome,
  getBossVolleyShots,
  isBossStageDefinition,
  shouldRestartBossPatternAfterRespawn,
  shouldResetBossRunAfterHomingHit,
} from '../../domain/boss/bossRules'
import {
  INITIAL_PATROL_DIRECTION,
  getEnemyDefeatOutcome,
  getEnemyRegenerationDecision,
  getNextPatrolDirection,
  getEnemyRespawnDelayMs,
  getScoreEnemyTargetCount,
  hasActiveEnemy,
  shouldUpdateEnemyFreezeState,
  shouldUpdateEnemyPatrol,
  type PatrolDirection,
} from '../../domain/enemy/enemyRules'
import {
  COYOTE_TIME_MS,
  getJumpDecision,
} from '../../domain/player/jumpRules'
import {
  canStartMeleeAttack,
  getAttackInputDecision,
  getMeleeAttackEndState,
  getMeleeAttackEntryState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
} from '../../domain/player/attackRules'
import { canCrouch } from '../../domain/player/crouchRules'
import {
  getPlayerCoinPickupDecision,
  shouldScanPlayerCoins,
} from '../../domain/player/coinPickupRules'
import {
  getHorizontalMovementDecision,
  getMovementFootstepDecision,
  getPlayerControlFlowDecision,
} from '../../domain/player/movementRules'
import {
  getPlayerAnimationDecision,
  getPlayerVisualStatePresentation,
  shouldPlayPlayerAnimation,
  type PlayerVisualState,
} from '../../domain/player/animationRules'
import { isPlayerGroundedByContact } from '../../domain/player/groundRules'
import {
  PLAYER_MAX_HEALTH,
  canApplyPlayerDamage,
  canApplyPlayerEnemyHit,
  canApplyPlayerHazardHit,
  canEnterPlayerDefeat,
  getPlayerDamageOutcome,
  getPlayerDefeatEntryState,
  getPlayerDefeatOutcome,
  getPlayerHurtEntryState,
  getPlayerHurtRecoveryState,
  getPlayerInvulnerabilityRecoveryState,
  getPlayerKnockbackDirection,
  getPlayerRespawnState,
  type PlayerDefeatReason,
} from '../../domain/player/hurtRules'
import {
  HOMING_ATTACK_CONTACT_DISTANCE,
  HOMING_ATTACK_RANGE,
  canShowHomingReticle,
  canStartHomingAttack,
  getHomingAttackEntryState,
  getHomingContactPoint,
  getHomingFinishOutcome,
  getHomingLineCoinCollectionDecision,
  getHomingRecoveryState,
  getHomingTargetAcquisitionDecision,
  getHomingTrailSamples,
  isHomingTargetLost,
  isHomingTargetAvailable,
  selectNearestHomingTarget,
  shouldUpdateHomingAttack,
} from '../../domain/player/homingRules'

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
type TilemapLayer = Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer
type CoinRuntime = {
  sprite: Phaser.GameObjects.Image
  point: CoinPoint
  collected: boolean
}
type EnemyRuntime = {
  sprite: ArcadeSprite
  point: EnemyPoint
  defeated: boolean
  direction: PatrolDirection
}
type HazardRuntime = {
  sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody
  point: HazardRect
}
type MovingPlatformSprite = Phaser.GameObjects.TileSprite & { body: Phaser.Physics.Arcade.Body }
type MovingPlatformRuntime = {
  sprite: MovingPlatformSprite
  point: MovingPlatformRect
  startX: number
  startY: number
  previousX: number
  previousY: number
}
type GravityDirection = GravityZone['direction']
type BossProjectile = ArcadeSprite

const SOLID_TILE_INDEXES = [0, 1, 2]
const CAMERA_ZOOM = 1.25
const PLAYER_SCALE = 0.78
const PLAYER_ATTACK_SCALE = 0.98
const PLAYER_ATTACK_VISUAL_Y_OFFSET = -10
const PLAYER_CROUCH_VISUAL_Y_OFFSET = 10
const HOMING_ATTACK_RECOVERY_MS = 220
const HOMING_RETICLE_Y_OFFSET = -8
const HOMING_ATTACK_FRAME = 2
const HOMING_TRAIL_HOLD_MS = 70
const HOMING_TRAIL_FADE_MS = 260
const JUMP_BUFFER_MS = 140
const PLAYER_MAX_RUN_SPEED = 500
const WORLD_GRAVITY_Y = 1500
const THEME = {
  royalBlue: 0x2f6fb4,
  cyan: 0x33b5ff,
  gold: 0xd7a84f,
  white: 0xf8fdff,
}

export class GameplayScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'left' | 'right' | 'jump' | 'crouch' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>
  private player!: ArcadeSprite
  private enemies: EnemyRuntime[] = []
  private goal!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody
  private terrainLayer!: TilemapLayer
  private farBackground!: Phaser.GameObjects.TileSprite
  private midBackground!: Phaser.GameObjects.TileSprite
  private hazards: HazardRuntime[] = []
  private movingPlatforms: MovingPlatformRuntime[] = []
  private checkpointSprites: Phaser.GameObjects.Image[] = []
  private checkpointGlows: Phaser.GameObjects.Ellipse[] = []
  private checkpointRings: Phaser.GameObjects.Ellipse[] = []
  private attackReady = true
  private playerHealth = PLAYER_MAX_HEALTH
  private stageCleared = false
  private isAttacking = false
  private isHurting = false
  private isInvulnerable = false
  private isHomingAttacking = false
  private isCrouching = false
  private isDead = false
  private homingTarget?: ArcadeSprite
  private homingReticle?: Phaser.GameObjects.Image
  private hurtTween?: Phaser.Tweens.Tween
  private playerVisualYOffset = 0
  private coins: CoinRuntime[] = []
  private collectedCoins = 0
  private damageTaken = 0
  private falls = 0
  private enemiesDefeated = 0
  private stageTimeMs = 0
  private timerStarted = false
  private stageInputArmed = false
  private isAvgLocked = false
  private gamepadJumpDown = false
  private gamepadAttackDown = false
  private virtualMoveX = 0
  private virtualCrouch = false
  private virtualJumpPressed = false
  private virtualAttackPressed = false
  private wasGrounded = true
  private nextFootstepAt = 0
  private lastGroundedAt = 0
  private jumpBufferedUntil = 0
  private remainingAirJumps = 1
  private bossPrototype?: EnemyRuntime
  private bossProjectiles: BossProjectile[] = []
  private bossPhase = 0
  private bossPatternGeneration = 0
  private bossShotIndex = 0
  private bossPatternEvent?: Phaser.Time.TimerEvent
  private statusMessage: TranslationKey = 'status.initial'
  private statusParams: TranslationParams = {}
  private playerGravityDirection: GravityDirection = 'down'
  private activeCheckpointIndex = -1
  private respawnPoint = {
    x: 0,
    y: 0,
    gravity: 'down' as GravityDirection,
  }
  private readonly stage: StageData

  constructor(stage: StageData) {
    super('GameplayScene')
    this.stage = stage
    this.statusMessage = this.getInitialStatusMessage()
    this.playerGravityDirection = this.stage.playerSpawn.gravity ?? 'down'
    this.respawnPoint = {
      x: this.stage.playerSpawn.x,
      y: getPlayerCenterY({
        surfaceY: this.stage.playerSpawn.surfaceY,
        gravity: this.stage.playerSpawn.gravity ?? 'down',
      }),
      gravity: this.stage.playerSpawn.gravity ?? 'down',
    }
  }

  private get worldWidth(): number {
    return this.stage.world.width
  }

  private get worldHeight(): number {
    return this.stage.world.height
  }

  private get tileSize(): number {
    return this.stage.world.tileSize
  }

  private get tileColumns(): number {
    return getTileColumnCount({
      worldWidth: this.worldWidth,
      tileSize: this.tileSize,
    })
  }

  private get tileRows(): number {
    return getTileRowCount({
      worldHeight: this.worldHeight,
      tileSize: this.tileSize,
    })
  }

  private get stageTheme(): string {
    return this.stage.theme ?? 'white-palace'
  }

  private get terrainTilesKey(): string {
    return this.stageTheme === 'emerald-sanctuary' ? 'emerald-sanctuary-tiles' : 'palace-tiles'
  }

  private get guardTextureKey(): string {
    return this.stageTheme === 'emerald-sanctuary' ? 'forest-guardian' : 'enemy-guard-walk'
  }

  private get guardDeathTextureKey(): string {
    return this.stageTheme === 'emerald-sanctuary' ? 'forest-guardian-defeated' : 'enemy-guard-death'
  }

  private get gravitySign(): 1 | -1 {
    return getVerticalGravitySign({ direction: this.playerGravityDirection })
  }

  private get isOnIce(): boolean {
    return this.findSurfaceZone('ice') !== undefined
  }

  private get coinTargetCount(): number {
    return getCoinTargetCount({ coins: this.stage.coins })
  }

  private get scoreEnemyTargetCount(): number {
    return getScoreEnemyTargetCount({ enemies: this.stage.enemies })
  }

  private get isBossStage(): boolean {
    return isBossStageDefinition({
      stageId: this.stage.id,
      enemies: this.stage.enemies,
    })
  }

  preload(): void {
    this.load.image('white-palace-sky', IMAGE_ASSETS.palaceSky)
    this.load.image('white-palace-far-bg', IMAGE_ASSETS.palaceFarBackground)
    this.load.image('white-palace-mid-bg', IMAGE_ASSETS.palaceMidBackground)
    this.load.image('palace-tiles', IMAGE_ASSETS.palaceTiles)
    this.load.image('emerald-sanctuary-bg', IMAGE_ASSETS.emeraldSanctuaryGameplayBg)
    this.load.image('emerald-sanctuary-sky', IMAGE_ASSETS.emeraldSanctuarySky)
    this.load.image('emerald-sanctuary-far-bg', IMAGE_ASSETS.emeraldSanctuaryFarBackground)
    this.load.image('emerald-sanctuary-mid-bg', IMAGE_ASSETS.emeraldSanctuaryMidBackground)
    this.load.image('emerald-sanctuary-tiles', IMAGE_ASSETS.emeraldSanctuaryTiles)
    this.load.image('cerulean-depths-bg', IMAGE_ASSETS.ceruleanDepthsStageSelect)
    this.load.image('frostveil-peaks-bg', IMAGE_ASSETS.frostveilPeaksStageSelect)
    this.load.image('emberfall-caldera-bg', IMAGE_ASSETS.emberfallCalderaStageSelect)
    this.load.image('abyssal-hollow-bg', IMAGE_ASSETS.abyssalHollowStageSelect)
    this.load.spritesheet('emerald-sanctuary-spikes', IMAGE_ASSETS.emeraldSanctuarySpikes, {
      frameWidth: 512,
      frameHeight: 512,
    })
    this.load.image('checkpoint-beacon', IMAGE_ASSETS.checkpoint)
    this.load.spritesheet('stage-goal', IMAGE_ASSETS.goalIdle, {
      frameWidth: 256,
      frameHeight: 256,
    })
    this.load.spritesheet('player-idle', IMAGE_ASSETS.playerIdle, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-run', IMAGE_ASSETS.playerRun, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-attack', IMAGE_ASSETS.playerAttack, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-crouch', IMAGE_ASSETS.playerCrouch, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-jump', IMAGE_ASSETS.playerJump, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-hurt', IMAGE_ASSETS.playerHurt, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-death', IMAGE_ASSETS.playerDeath, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('enemy-guard-walk', IMAGE_ASSETS.enemyGuardWalk, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('enemy-guard-death', IMAGE_ASSETS.enemyGuardDeath, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('boss-priestess-cast', IMAGE_ASSETS.bossPriestessCast, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('boss-priestess-hurt', IMAGE_ASSETS.bossPriestessHurt, {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('boss-priestess-death', IMAGE_ASSETS.bossPriestessDeath, {
      frameWidth: 128,
      frameHeight: 128,
    })
  }

  create(): void {
    this.resetRuntimeState()
    this.createTextures()
    this.createAnimations()

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.physics.world.setBoundsCollision(true, true, false, false)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)

    this.createParallaxBackground()
    this.terrainLayer = this.createTerrainLayer()
    this.createMovingPlatforms()
    this.createHazards()
    this.createCoins()
    this.createEnemies()
    this.createCheckpoints()

    const playerDefinition = objectDefinitions.player
    this.player = this.physics.add.sprite(
      this.stage.playerSpawn.x,
      getPlayerCenterY({
        surfaceY: this.stage.playerSpawn.surfaceY,
        gravity: this.stage.playerSpawn.gravity ?? 'down',
      }),
      'player-idle',
    )
    this.player.setOrigin(playerDefinition.origin.x, playerDefinition.origin.y)
    this.player.setCollideWorldBounds(true)
    this.player.setDragX(1500)
    this.player.setMaxVelocity(PLAYER_MAX_RUN_SPEED, 900)
    this.applyPlayerGravityDirection(this.stage.playerSpawn.gravity ?? 'down', false)
    this.setPlayerVisualState('normal')
    this.player.play('player-idle')

    const goalDefinition = objectDefinitions.goal
    this.goal = this.physics.add.staticSprite(
      this.stage.goal.x,
      groundedBottomY(this.stage.goal.surfaceY, 'goal'),
      'stage-goal',
    )
    this.goal.setOrigin(goalDefinition.origin.x, goalDefinition.origin.y)
    this.goal.setDisplaySize(goalDefinition.displaySize.width, goalDefinition.displaySize.height)
    this.goal.refreshBody()
    this.goal.setSize(goalDefinition.body.width, goalDefinition.body.height)
    this.goal.setOffset(goalDefinition.body.offsetX, goalDefinition.body.offsetY)
    this.goal.setDepth(8)
    this.goal.play('stage-goal-idle')

    this.physics.add.collider(this.player, this.terrainLayer)
    for (const platform of this.movingPlatforms) {
      this.physics.add.collider(this.player, platform.sprite)
    }
    for (const hazard of this.hazards) {
      this.physics.add.overlap(this.player, hazard.sprite, () => this.hurtPlayerFromHazard(hazard.sprite.x))
    }
    for (const enemy of this.enemies) {
      if (enemy.point.type !== 'azure-core') {
        this.physics.add.collider(enemy.sprite, this.terrainLayer)
        for (const platform of this.movingPlatforms) {
          this.physics.add.collider(enemy.sprite, platform.sprite)
        }
      }
      this.physics.add.collider(this.player, enemy.sprite, () => this.hurtPlayer(enemy.sprite))
    }
    this.physics.add.overlap(this.player, this.goal, () => this.completeStage())
    this.initializeBossPrototype()
    this.stopEnemyMovement()

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      crouch: Phaser.Input.Keyboard.KeyCodes.S,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      attackAlt: Phaser.Input.Keyboard.KeyCodes.Z,
    }) as Record<'left' | 'right' | 'jump' | 'crouch' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>
    this.input.keyboard!.resetKeys()

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setZoom(CAMERA_ZOOM)
    this.cameras.main.setDeadzone(360, 240)

    this.dispatchHudState()
    window.addEventListener('projectrun:virtual-input', this.handleVirtualInput)
    window.addEventListener('projectrun:avg-state', this.handleAvgState)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('projectrun:virtual-input', this.handleVirtualInput)
      window.removeEventListener('projectrun:avg-state', this.handleAvgState)
    })
  }

  private handleAvgState = (event: Event): void => {
    this.isAvgLocked = Boolean((event as CustomEvent<{ active: boolean }>).detail.active)
    this.player.setAccelerationX(0)
    this.virtualMoveX = 0
    this.virtualCrouch = false
    this.virtualJumpPressed = false
    this.virtualAttackPressed = false
    this.input.keyboard?.resetKeys()
    if (!this.isAvgLocked) {
      this.stageInputArmed = false
      this.game.loop.resetDelta()
    }
  }

  private handleVirtualInput = (event: Event): void => {
    const detail = (event as CustomEvent<{ type: 'move' | 'crouch' | 'jump' | 'attack'; x?: number; active?: boolean }>).detail
    if (detail.type === 'move') this.virtualMoveX = detail.x ?? 0
    if (detail.type === 'crouch') this.virtualCrouch = Boolean(detail.active)
    if (detail.type === 'jump') this.virtualJumpPressed = true
    if (detail.type === 'attack') this.virtualAttackPressed = true
  }

  private resetRuntimeState(): void {
    this.enemies = []
    this.checkpointSprites = []
    this.checkpointGlows = []
    this.checkpointRings = []
    this.attackReady = true
    this.playerHealth = PLAYER_MAX_HEALTH
    this.stageCleared = false
    this.isAttacking = false
    this.isHurting = false
    this.isInvulnerable = false
    this.isHomingAttacking = false
    this.isCrouching = false
    this.isDead = false
    this.homingTarget = undefined
    this.homingReticle = undefined
    this.hurtTween = undefined
    this.playerVisualYOffset = 0
    this.coins = []
    this.hazards = []
    this.movingPlatforms = []
    this.collectedCoins = 0
    this.damageTaken = 0
    this.falls = 0
    this.enemiesDefeated = 0
    this.stageTimeMs = 0
    this.timerStarted = false
    this.stageInputArmed = false
    this.isAvgLocked = false
    this.gamepadJumpDown = false
    this.gamepadAttackDown = false
    this.virtualMoveX = 0
    this.virtualCrouch = false
    this.virtualJumpPressed = false
    this.virtualAttackPressed = false
    this.wasGrounded = true
    this.nextFootstepAt = 0
    this.lastGroundedAt = 0
    this.jumpBufferedUntil = 0
    this.remainingAirJumps = 1
    this.bossPrototype = undefined
    this.bossProjectiles = []
    this.bossPhase = 0
    this.bossPatternGeneration = 0
    this.bossShotIndex = 0
    this.bossPatternEvent = undefined
    this.statusMessage = this.getInitialStatusMessage()
    this.statusParams = {}
    this.playerGravityDirection = this.stage.playerSpawn.gravity ?? 'down'
    this.activeCheckpointIndex = -1
    this.respawnPoint = {
      x: this.stage.playerSpawn.x,
      y: getPlayerCenterY({
        surfaceY: this.stage.playerSpawn.surfaceY,
        gravity: this.stage.playerSpawn.gravity ?? 'down',
      }),
      gravity: this.stage.playerSpawn.gravity ?? 'down',
    }
  }

  update(): void {
    if (this.isAvgLocked) {
      this.player.setAccelerationX(0)
      this.updateParallaxBackground()
      return
    }

    const pad = Array.from(navigator.getGamepads?.() ?? []).find((candidate): candidate is Gamepad => candidate !== null)
    const padLeft = Boolean(pad && (pad.axes[0] < -0.35 || pad.buttons[14]?.pressed))
    const padRight = Boolean(pad && (pad.axes[0] > 0.35 || pad.buttons[15]?.pressed))
    const padDown = Boolean(pad && (pad.axes[1] > 0.5 || pad.buttons[13]?.pressed))
    const padJumpDown = Boolean(pad?.buttons[0]?.pressed)
    const padAttackDown = Boolean(pad?.buttons[2]?.pressed)
    const padJumpPressed = padJumpDown && !this.gamepadJumpDown
    const padAttackPressed = padAttackDown && !this.gamepadAttackDown
    this.gamepadJumpDown = padJumpDown
    this.gamepadAttackDown = padAttackDown

    const left = this.cursors.left.isDown || this.keys.left.isDown || padLeft || this.virtualMoveX < 0
    const right = this.cursors.right.isDown || this.keys.right.isDown || padRight || this.virtualMoveX > 0
    const crouchHeld = this.cursors.down.isDown || this.keys.crouch.isDown || padDown || this.virtualCrouch
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.jump) || padJumpPressed || this.virtualJumpPressed
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt) || padAttackPressed || this.virtualAttackPressed
    const gameplayInputHeld = left || right || crouchHeld || this.cursors.space.isDown || this.cursors.up.isDown || this.keys.jump.isDown || this.keys.attack.isDown || this.keys.attackAlt.isDown || padJumpDown || padAttackDown || this.virtualJumpPressed || this.virtualAttackPressed
    this.virtualJumpPressed = false
    this.virtualAttackPressed = false
    if (!this.stageInputArmed) {
      this.stageInputArmed = getStageInputArmedState({
        stageInputArmed: this.stageInputArmed,
        gameplayInputHeld,
      })
      this.player.setAccelerationX(0)
      this.updateParallaxBackground()
      return
    }
    if (shouldStartStageAction({
      timerStarted: this.timerStarted,
      left,
      right,
      crouchHeld,
      jumpPressed,
      attackPressed,
    })) {
      this.startStageAction()
    }

    if (this.timerStarted) {
      this.updateMovingPlatforms()
    }
    this.updateGravityZones()
    const grounded = this.isPlayerGrounded()
    if (grounded) {
      this.lastGroundedAt = this.time.now
      this.remainingAirJumps = 1
    }
    if (jumpPressed) this.jumpBufferedUntil = this.time.now + JUMP_BUFFER_MS

    const controlFlow = getPlayerControlFlowDecision({
      dead: this.isDead,
      stageCleared: this.stageCleared,
    })
    if (controlFlow === 'dead') {
      this.player.setAccelerationX(0)
      return
    }

    if (controlFlow === 'stage-cleared') {
      this.player.setAccelerationX(0)
      this.player.setVelocityX(0)
      this.updatePlayerAnimation(false, grounded)
      return
    }

    const shouldCrouch = canCrouch({
      crouchHeld,
      grounded,
      attacking: this.isAttacking,
      hurting: this.isHurting,
    })
    this.setCrouching(shouldCrouch)
    const onIce = grounded && this.isOnIce
    const horizontalMovement = getHorizontalMovementDecision({
      left,
      right,
      grounded,
      crouching: this.isCrouching,
      onIce,
    })
    this.player.setDragX(horizontalMovement.dragX)
    this.player.setAccelerationX(horizontalMovement.accelerationX)
    if (horizontalMovement.stopVelocityX) {
      this.player.setVelocityX(0)
    }
    if (horizontalMovement.direction === 'left') {
      this.timerStarted = true
      if (!this.isHurting) {
        this.player.setFlipX(true)
      }
    } else if (horizontalMovement.direction === 'right') {
      this.timerStarted = true
      if (!this.isHurting) {
        this.player.setFlipX(false)
      }
    }

    const jumpDecision = getJumpDecision({
      now: this.time.now,
      grounded,
      lastGroundedAt: this.lastGroundedAt,
      jumpBufferedUntil: this.jumpBufferedUntil,
      remainingAirJumps: this.remainingAirJumps,
    })
    if (jumpDecision.type !== 'none') {
      this.timerStarted = true
      this.setCrouching(false)
      if (jumpDecision.type === 'air-jump') {
        this.isAttacking = false
        this.setPlayerVisualState('normal')
        this.playPlayerAnimation('player-jump')
      }
      this.player.setVelocityY(-640 * this.gravitySign)
      if (jumpDecision.type === 'air-jump') this.remainingAirJumps -= 1
      this.jumpBufferedUntil = 0
      this.lastGroundedAt = 0
      this.dispatchSfx('armor-step')
      this.nextFootstepAt = this.time.now + 270
    }

    this.updateMovementSfx(grounded, left || right)
    this.updatePlayerAnimation(!this.isCrouching && (left || right), grounded)

    const attackInputDecision = getAttackInputDecision({
      attackPressed,
      crouching: this.isCrouching,
      grounded,
    })
    if (attackInputDecision !== 'none') {
      this.timerStarted = true
      if (attackInputDecision === 'homing-then-melee' && this.tryHomingAttack()) {
        return
      }

      this.tryAttack()
    }

    this.updateHomingReticle(grounded)
    this.updateHomingAttack()
    if (this.timerStarted) {
      this.updateEnemyPatrol()
      this.updateBossProjectiles()
    }
    this.updateCheckpoint()
    this.updateCoins()
    this.updateTimer()
    this.updateParallaxBackground()

    if (this.isPlayerOutOfBounds()) {
      this.defeatPlayer('fall')
    }
  }

  private isPlayerGrounded(): boolean {
    return isPlayerGroundedByContact({
      direction: this.playerGravityDirection,
      blockedDown: this.player.body.blocked.down,
      touchingDown: this.player.body.touching.down,
      blockedUp: this.player.body.blocked.up,
      touchingUp: this.player.body.touching.up,
    })
  }

  private updateGravityZones(): void {
    if (!shouldUpdateGravityZones({
      hasGravityZones: this.stage.gravityZones !== undefined,
      dead: this.isDead,
      stageCleared: this.stageCleared,
    })) return

    const zone = findActiveGravityZone({
      pointX: this.player.x,
      pointY: this.player.y,
      zones: this.stage.gravityZones ?? [],
    })

    if (zone && zone.direction !== this.playerGravityDirection) {
      this.applyPlayerGravityDirection(zone.direction)
    }
  }

  private applyPlayerGravityDirection(direction: GravityDirection, preserveVelocity = true): void {
    this.playerGravityDirection = direction
    if (!this.player) return

    const bodyGravityY = getPlayerBodyGravityY({ direction, worldGravityY: WORLD_GRAVITY_Y })
    this.player.body.setGravityY(bodyGravityY)
    this.player.setFlipY(shouldFlipPlayerYForGravity({ direction }))
    if (!preserveVelocity) this.player.setVelocityY(0)
    this.setCrouching(false)
    this.remainingAirJumps = 1
    this.lastGroundedAt = this.time.now
  }

  private isPlayerOutOfBounds(): boolean {
    return isOutOfBounds({
      playerY: this.player.y,
      worldHeight: this.worldHeight,
      isDownGravity: this.playerGravityDirection === 'down',
    })
  }

  private findSurfaceZone(type: SurfaceZone['type']): SurfaceZone | undefined {
    return findActiveSurfaceZone({
      pointX: this.player.x,
      pointY: this.player.y,
      surfaceType: type,
      zones: this.stage.surfaceZones ?? [],
    })
  }

  private createTextures(): void {
    this.makeRectTexture('attack', 56, 36, THEME.cyan, THEME.royalBlue)
    this.makeHomingReticleTexture()
    this.makeCoinTexture()
    this.makeAzureCoreTexture()
    this.makeBossProjectileTexture()
    this.makeLavaHazardTexture()
    this.makeForestGuardianTextures()
  }

  private createAnimations(): void {
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 3 }),
      frameRate: 9,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-attack',
      frames: this.anims.generateFrameNumbers('player-attack', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: 0,
    })

    this.anims.create({
      key: 'player-crouch',
      frames: this.anims.generateFrameNumbers('player-crouch', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-jump',
      frames: [{ key: 'player-jump', frame: 1 }],
      frameRate: 1,
      repeat: 0,
    })

    this.anims.create({
      key: 'player-hurt',
      frames: this.anims.generateFrameNumbers('player-hurt', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0,
    })

    this.anims.create({
      key: 'player-death',
      frames: this.anims.generateFrameNumbers('player-death', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: 0,
    })

    this.anims.create({
      key: 'enemy-guard-walk',
      frames: this.anims.generateFrameNumbers('enemy-guard-walk', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    })

    this.anims.create({
      key: 'enemy-guard-death',
      frames: this.anims.generateFrameNumbers('enemy-guard-death', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    })

    this.anims.create({
      key: 'boss-priestess-cast',
      frames: this.anims.generateFrameNumbers('boss-priestess-cast', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    })

    this.anims.create({
      key: 'boss-priestess-hurt',
      frames: this.anims.generateFrameNumbers('boss-priestess-hurt', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    })

    this.anims.create({
      key: 'boss-priestess-death',
      frames: this.anims.generateFrameNumbers('boss-priestess-death', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: 0,
    })

    this.anims.create({
      key: 'stage-goal-idle',
      frames: this.anims.generateFrameNumbers('stage-goal', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
      yoyo: true,
    })
  }

  private updatePlayerAnimation(isMoving: boolean, grounded: boolean): void {
    const decision = getPlayerAnimationDecision({
      moving: isMoving,
      grounded,
      crouching: this.isCrouching,
      attacking: this.isAttacking,
      hurting: this.isHurting,
      homingAttacking: this.isHomingAttacking,
      dead: this.isDead,
    })

    if (decision.type === 'preserve') {
      return
    }

    if (decision.visualState === 'normal') {
      this.setPlayerVisualState('normal')
    }

    this.playPlayerAnimation(decision.animation, true)
  }

  private playPlayerAnimation(key: string, respectAttackLock = false): void {
    if (shouldPlayPlayerAnimation({
      key,
      currentAnimationKey: this.player.anims.currentAnim?.key,
      currentTextureKey: this.player.texture.key,
      respectAttackLock,
      attacking: this.isAttacking,
      hurting: this.isHurting,
    })) {
      this.player.play(key)
    }
  }

  private makeRectTexture(key: string, width: number, height: number, fill: number, stroke: number): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(fill)
    graphics.fillRoundedRect(0, 0, width, height, 8)
    graphics.lineStyle(3, stroke)
    graphics.strokeRoundedRect(1.5, 1.5, width - 3, height - 3, 8)
    graphics.generateTexture(key, width, height)
    graphics.destroy()
  }

  private makeHomingReticleTexture(): void {
    const graphics = this.make.graphics()
    graphics.lineStyle(3, THEME.cyan, 1)
    graphics.strokeCircle(24, 24, 14)
    graphics.lineBetween(24, 3, 24, 13)
    graphics.lineBetween(24, 35, 24, 45)
    graphics.lineBetween(3, 24, 13, 24)
    graphics.lineBetween(35, 24, 45, 24)
    graphics.lineStyle(1, THEME.white, 0.9)
    graphics.strokeCircle(24, 24, 8)
    graphics.generateTexture('homing-reticle', 48, 48)
    graphics.destroy()
  }

  private makeCoinTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(THEME.gold)
    graphics.fillCircle(22, 22, 18)
    graphics.lineStyle(3, 0xfff3cf, 1)
    graphics.strokeCircle(22, 22, 18)
    graphics.lineStyle(2, THEME.gold, 0.85)
    graphics.fillStyle(THEME.white, 0.34)
    graphics.fillEllipse(17, 15, 12, 8)
    graphics.fillStyle(0xc5891f, 0.9)
    graphics.fillRoundedRect(18, 11, 8, 22, 3)
    graphics.generateTexture('coin', 44, 44)
    graphics.destroy()
  }

  private makeAzureCoreTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0xffffff, 0.88)
    graphics.fillCircle(38, 38, 28)
    graphics.lineStyle(6, 0xb7dfff, 0.95)
    graphics.strokeCircle(38, 38, 29)
    graphics.lineStyle(3, THEME.royalBlue, 0.9)
    graphics.strokeCircle(38, 38, 20)
    graphics.fillStyle(THEME.cyan, 0.95)
    graphics.fillCircle(38, 38, 13)
    graphics.fillStyle(THEME.white, 0.9)
    graphics.fillCircle(34, 34, 5)
    graphics.lineStyle(4, THEME.cyan, 0.7)
    graphics.lineBetween(4, 38, 16, 38)
    graphics.lineBetween(60, 38, 72, 38)
    graphics.generateTexture('azure-core', 76, 76)
    graphics.destroy()
  }

  private makeBossProjectileTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0xfff7ff, 0.95)
    graphics.fillCircle(14, 14, 10)
    graphics.lineStyle(4, 0x77bfff, 0.9)
    graphics.strokeCircle(14, 14, 11)
    graphics.fillStyle(0xff70c8, 0.9)
    graphics.fillCircle(14, 14, 5)
    graphics.generateTexture('boss-projectile', 28, 28)
    graphics.destroy()
  }

  private makeLavaHazardTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(0x5d160b, 0.92)
    graphics.fillRoundedRect(0, 16, 96, 64, 12)
    graphics.fillStyle(0xff4d18, 0.95)
    graphics.fillRoundedRect(7, 22, 82, 48, 10)
    graphics.fillStyle(0xffd36a, 0.92)
    graphics.fillEllipse(28, 38, 34, 18)
    graphics.fillEllipse(68, 52, 30, 14)
    graphics.lineStyle(4, 0xfff0a6, 0.7)
    graphics.lineBetween(10, 18, 20, 2)
    graphics.lineBetween(45, 18, 54, 0)
    graphics.lineBetween(80, 20, 88, 5)
    graphics.generateTexture('lava-hazard', 96, 96)
    graphics.destroy()
  }

  private makeForestGuardianTextures(): void {
    this.drawForestGuardianTexture('forest-guardian', false)
    this.drawForestGuardianTexture('forest-guardian-defeated', true)
  }

  private drawForestGuardianTexture(key: string, defeated: boolean): void {
    const graphics = this.make.graphics()
    const alpha = defeated ? 0.62 : 1
    const bark = defeated ? 0x2b241a : 0x4b321f
    const leaf = defeated ? 0x405335 : 0x8dcc4b
    const moss = defeated ? 0x526743 : 0xbfe36a
    const crystal = defeated ? 0x336773 : 0x36e8ff

    graphics.fillStyle(0x000000, defeated ? 0.22 : 0.18)
    graphics.fillEllipse(48, 92, 58, 12)
    graphics.lineStyle(10, bark, alpha)
    graphics.beginPath()
    graphics.moveTo(34, 86)
    graphics.lineTo(38, 60)
    graphics.lineTo(32, 40)
    graphics.strokePath()
    graphics.beginPath()
    graphics.moveTo(62, 86)
    graphics.lineTo(58, 60)
    graphics.lineTo(66, 38)
    graphics.strokePath()
    graphics.fillStyle(bark, alpha)
    graphics.fillRoundedRect(24, 28, 48, 48, 16)
    graphics.fillRoundedRect(18, 44, 14, 30, 8)
    graphics.fillRoundedRect(64, 44, 14, 30, 8)
    graphics.lineStyle(5, moss, alpha)
    graphics.beginPath()
    graphics.moveTo(18, 52)
    graphics.lineTo(36, 34)
    graphics.lineTo(58, 54)
    graphics.lineTo(78, 36)
    graphics.strokePath()
    graphics.fillStyle(leaf, alpha)
    graphics.fillEllipse(28, 24, 28, 14)
    graphics.fillEllipse(48, 18, 36, 16)
    graphics.fillEllipse(69, 26, 26, 14)
    graphics.fillStyle(crystal, defeated ? 0.55 : 0.95)
    graphics.fillTriangle(48, 36, 35, 60, 48, 76)
    graphics.fillTriangle(48, 36, 61, 60, 48, 76)
    graphics.lineStyle(3, defeated ? 0x86a6aa : 0xe6ffff, defeated ? 0.5 : 0.85)
    graphics.strokeTriangle(48, 36, 35, 60, 48, 76)
    graphics.strokeTriangle(48, 36, 61, 60, 48, 76)
    graphics.lineStyle(3, leaf, alpha)
    graphics.lineBetween(26, 76, 16, 90)
    graphics.lineBetween(70, 76, 82, 90)
    graphics.generateTexture(key, 96, 104)
    graphics.destroy()
  }

  private createParallaxBackground(): void {
    if (this.stageTheme === 'abyssal-hollow') {
      this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'abyssal-hollow-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-30)

      this.farBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'abyssal-hollow-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-20)
        .setAlpha(0.34)
        .setTint(0xb58cff)

      this.midBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'abyssal-hollow-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
        .setAlpha(0.22)
        .setTint(0xff8ee8)
      return
    }

    if (this.stageTheme === 'emberfall-caldera') {
      this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'emberfall-caldera-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-30)

      this.farBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'emberfall-caldera-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-20)
        .setAlpha(0.35)
        .setTint(0xff8a4b)

      this.midBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'emberfall-caldera-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
        .setAlpha(0.22)
        .setTint(0xffd19b)
      return
    }

    if (this.stageTheme === 'frostveil-peaks') {
      this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'frostveil-peaks-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-30)

      this.farBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'frostveil-peaks-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-20)
        .setAlpha(0.32)
        .setTint(0xccefff)

      this.midBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'frostveil-peaks-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
        .setAlpha(0.2)
        .setTint(0xf3fbff)
      return
    }

    if (this.stageTheme === 'cerulean-depths') {
      this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'cerulean-depths-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-30)

      this.farBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'cerulean-depths-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-20)
        .setAlpha(0.32)
        .setTint(0x8be7ff)

      this.midBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'cerulean-depths-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
        .setAlpha(0.2)
        .setTint(0xdff8ff)
      return
    }

    if (this.stageTheme === 'emerald-sanctuary') {
      this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'emerald-sanctuary-sky')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-30)

      this.farBackground = this.add
        .tileSprite(0, 0, 1920, this.worldHeight, 'emerald-sanctuary-far-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-20)

      this.midBackground = this.add
        .tileSprite(0, 0, 3840, this.worldHeight, 'emerald-sanctuary-mid-bg')
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
      return
    }

    this.add
      .tileSprite(0, 0, 1920, this.worldHeight, 'white-palace-sky')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-30)

    this.farBackground = this.add
      .tileSprite(0, 0, 1920, this.worldHeight, 'white-palace-far-bg')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-20)

    this.midBackground = this.add
      .tileSprite(0, 0, 1920, this.worldHeight, 'white-palace-mid-bg')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-10)
  }

  private updateParallaxBackground(): void {
    this.farBackground.setTilePosition(this.cameras.main.scrollX * 0.08, 0)
    this.midBackground.setTilePosition(this.cameras.main.scrollX * 0.18, 0)
  }

  private createTerrainLayer(): TilemapLayer {
    const map = this.make.tilemap({
      data: this.buildTerrainData(),
      tileWidth: this.tileSize,
      tileHeight: this.tileSize,
    })
    const tileset = map.addTilesetImage(this.terrainTilesKey, undefined, this.tileSize, this.tileSize, 0, 0)
    const layer = map.createLayer(0, tileset!, 0, 0)

    if (!layer) {
      throw new Error('Unable to create terrain tilemap layer.')
    }

    layer.setCollision(SOLID_TILE_INDEXES)
    layer.setDepth(5)

    return layer
  }

  private createMovingPlatforms(): void {
    this.movingPlatforms = (this.stage.movingPlatforms ?? []).map((point) => {
      const x = (point.col + point.width / 2) * this.tileSize
      const y = (point.row + point.height / 2) * this.tileSize
      const width = point.width * this.tileSize
      const height = point.height * this.tileSize
      const sprite = this.add.tileSprite(x, y, width, height, this.terrainTilesKey) as MovingPlatformSprite
      sprite.setDepth(7)

      this.physics.add.existing(sprite)
      sprite.body.allowGravity = false
      sprite.body.immovable = true
      sprite.body.moves = true
      sprite.body.setSize(width, height)
      sprite.body.setOffset(0, 0)

      return {
        sprite,
        point,
        startX: x,
        startY: y,
        previousX: x,
        previousY: y,
      }
    })
  }

  private createHazards(): void {
    this.hazards = (this.stage.hazards ?? []).map((point) => {
      const frame = getHazardFrameIndex({ orientation: point.orientation })
      const texture = point.type === 'lava' ? 'lava-hazard' : 'emerald-sanctuary-spikes'
      const centerY = groundedHazardCenterY(point.surfaceY, point.height, point.type)
      const sprite = point.type === 'lava'
        ? this.physics.add.staticImage(point.x, centerY, texture)
        : this.physics.add.staticImage(point.x, centerY, texture, frame)
      sprite.setDisplaySize(point.width, point.height)
      sprite.setDepth(8)
      sprite.refreshBody()
      if (point.type === 'lava') {
        sprite.body.setSize(point.width * 0.88, point.height * 0.68)
        sprite.body.setOffset(point.width * 0.06, point.height * 0.22)
      } else {
        sprite.body.setSize(point.width * 0.86, point.height * 0.56)
        sprite.body.setOffset(point.width * 0.07, point.height * 0.36)
      }

      return { sprite, point }
    })
  }

  private createCoins(): void {
    this.coins = this.stage.coins.map((point, index) => {
      const sprite = this.add.image(point.x, point.y, 'coin')
      sprite.setDepth(12)
      sprite.setData('baseY', point.y)

      this.tweens.add({
        targets: sprite,
        y: point.y - 8,
        duration: 900 + index * 35,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })

      return {
        sprite,
        point,
        collected: false,
      }
    })
  }

  private createEnemies(): void {
    this.enemies = this.stage.enemies.map((point) => {
      const isCore = point.type === 'azure-core'
      const definition = isCore ? objectDefinitions['azure-core'] : objectDefinitions.guard
      const spawnY = getEnemySpawnY(point)
      const sprite = this.physics.add.sprite(point.x, spawnY, isCore ? 'azure-core' : this.guardTextureKey)
      sprite.setOrigin(definition.origin.x, definition.origin.y)
      sprite.setCollideWorldBounds(true)
      if (isCore) {
        this.configureAzureCore(sprite, spawnY)
      } else {
        sprite.setScale(this.stageTheme === 'emerald-sanctuary' ? 0.9 : 0.82)
        sprite.setVelocityX(-80)
        sprite.body.setSize(definition.body.width, definition.body.height)
        sprite.body.setOffset(definition.body.offsetX, definition.body.offsetY)
        if (this.stageTheme === 'emerald-sanctuary') {
          sprite.setTexture('forest-guardian')
        } else {
          sprite.play('enemy-guard-walk')
        }
      }

      return {
        sprite,
        point,
        defeated: false,
        direction: INITIAL_PATROL_DIRECTION,
      }
    })
  }

  private configureAzureCore(sprite: ArcadeSprite, spawnY: number): void {
    sprite.setPosition(sprite.x, spawnY)
    sprite.setScale(1)
    sprite.setAlpha(1)
    sprite.setAngle(0)
    sprite.setVisible(true)
    sprite.body.enable = true
    sprite.body.allowGravity = false
    sprite.setImmovable(true)
    const definition = objectDefinitions['azure-core']
    sprite.body.setSize(definition.body.width, definition.body.height)
    sprite.body.setOffset(definition.body.offsetX, definition.body.offsetY)
    sprite.setDepth(9)
    this.tweens.add({
      targets: sprite,
      y: spawnY - 14,
      angle: 10,
      duration: 950,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  private initializeBossPrototype(): void {
    if (!this.isBossStage) return

    this.bossPrototype = this.enemies.find((enemy) => enemy.point.id === 'boss-prototype')
    if (!this.bossPrototype) return

    this.goal.setVisible(false)
    this.goal.body.enable = false
    this.tweens.killTweensOf(this.bossPrototype.sprite)
    this.bossPrototype.sprite.setTexture('boss-priestess-cast', 0)
    this.bossPrototype.sprite.setScale(1.2)
    this.bossPrototype.sprite.body.setSize(48, 92)
    this.bossPrototype.sprite.body.setOffset(40, 26)
    this.bossPrototype.sprite.clearTint()
    this.bossPrototype.sprite.setDepth(14)
  }

  private startStageAction(): void {
    if (this.timerStarted) return
    this.timerStarted = true
    this.game.loop.resetDelta()
    this.player.setVisible(true)
    this.player.body.enable = true
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.centerOn(this.player.x, this.player.y)
    if (this.isBossStage) {
      this.startBossPattern()
    }
  }

  private stopEnemyMovement(): void {
    for (const enemy of this.enemies) {
      enemy.sprite.setVelocity(0, 0)
      enemy.sprite.setAcceleration(0, 0)
    }
  }

  private startBossPattern(): void {
    const boss = this.bossPrototype
    if (!canStartBossPattern({
      bossExists: boss !== undefined,
      bossType: boss?.point.type,
      bossPhase: this.bossPhase,
      stageCleared: this.stageCleared,
    })) return
    if (!boss || boss.point.type !== 'azure-core') return

    const generation = ++this.bossPatternGeneration
    this.clearBossProjectiles()
    this.bossPatternEvent?.remove(false)
    this.bossShotIndex = 0
    this.tweens.killTweensOf(boss.sprite)
    boss.defeated = false
    boss.sprite.body.enable = true
    boss.sprite.setVisible(true)
    boss.sprite.setAlpha(1)
    boss.sprite.setScale(1.2)
    boss.sprite.clearTint()
    boss.sprite.setPosition(boss.point.x, boss.point.y)
    boss.sprite.play('boss-priestess-cast', true)
    this.setStatusMessage('status.bossPattern', { phase: this.bossPhase + 1, max: BOSS_PHASE_COUNT })
    for (const enemy of this.enemies) {
      if (enemy === boss || enemy.point.type !== 'azure-core') continue
      this.tweens.killTweensOf(enemy.sprite)
      enemy.defeated = false
      this.configureAzureCore(enemy.sprite, enemy.point.y)
    }
    this.fireBossVolley(this.bossPhase, this.bossShotIndex++)

    this.bossPatternEvent = this.time.addEvent({
      delay: getBossPatternDelayMs({ phase: this.bossPhase }),
      loop: true,
      callback: () => {
        if (!canRunBossPatternTick({
          generation,
          currentGeneration: this.bossPatternGeneration,
          stageCleared: this.stageCleared,
          playerDead: this.isDead,
        })) return
        this.fireBossVolley(this.bossPhase, this.bossShotIndex++)
      },
    })
  }

  private fireBossVolley(phase: number, shotIndex: number): void {
    const boss = this.bossPrototype?.sprite
    if (!canFireBossVolley({
      bossExists: Boolean(boss),
      bossVisible: boss?.visible ?? false,
    })) return

    const activeBoss = boss as NonNullable<typeof boss>
    const originX = activeBoss.x
    const originY = activeBoss.y
    const aimedAngle = Phaser.Math.Angle.Between(originX, originY, this.player.x, this.player.y)
    for (const shot of getBossVolleyShots({ phase, shotIndex, aimedAngle })) {
      this.spawnBossProjectile(originX, originY, shot.angle, shot.speed)
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

  private updateBossProjectiles(): void {
    if (!shouldUpdateBossProjectiles({ projectileCount: this.bossProjectiles.length })) return

    for (const projectile of [...this.bossProjectiles]) {
      const expired = isBossProjectileExpired({
        now: this.time.now,
        spawnedAt: Number(projectile.getData('spawnedAt')),
      })
      const outside = isBossProjectileOutOfBounds({
        x: projectile.x,
        y: projectile.y,
        worldWidth: this.worldWidth,
        worldHeight: this.worldHeight,
      })
      const lifecycleDecision = getBossProjectileLifecycleDecision({ outside, expired })
      if (lifecycleDecision === 'destroy') {
        this.destroyBossProjectile(projectile)
        continue
      }
      if (lifecycleDecision === 'fade') {
        this.fadeBossProjectile(projectile)
        continue
      }

      const hitDecision = getBossProjectileHitDecision({
        playerDead: this.isDead,
        playerCrouching: this.isCrouching,
        distanceToPlayer: Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.x, projectile.y),
      })
      if (hitDecision === 'hit') {
        this.destroyBossProjectile(projectile)
        this.applyPlayerHit(projectile.x)
      }
    }
  }

  private destroyBossProjectile(projectile: BossProjectile): void {
    this.bossProjectiles = this.bossProjectiles.filter((candidate) => candidate !== projectile)
    projectile.destroy()
  }

  private fadeBossProjectile(projectile: BossProjectile, duration = 220): void {
    this.bossProjectiles = this.bossProjectiles.filter((candidate) => candidate !== projectile)
    projectile.body.enable = false
    this.tweens.add({
      targets: projectile,
      alpha: 0,
      scale: projectile.scale * 0.72,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => projectile.destroy(),
    })
  }

  private clearBossProjectiles(): void {
    for (const projectile of [...this.bossProjectiles]) this.fadeBossProjectile(projectile, 160)
    this.bossProjectiles = []
  }

  private hitBossPrototype(): void {
    const boss = this.bossPrototype
    if (!canHitBossPrototype({
      bossExists: Boolean(boss),
      bossDefeated: boss?.defeated ?? false,
    })) return

    const activeBoss = boss as NonNullable<typeof boss>
    this.bossPatternGeneration += 1
    this.bossPatternEvent?.remove(false)
    this.bossPatternEvent = undefined
    this.dispatchSfx('hit')
    this.clearBossProjectiles()
    const outcome = getBossHitOutcome({ currentPhase: this.bossPhase })
    this.bossPhase = outcome.nextPhase
    this.dispatchHudState()
    activeBoss.defeated = true
    activeBoss.sprite.body.enable = false

    if (outcome.type === 'defeated') {
      this.enemiesDefeated = 1
      activeBoss.sprite.play('boss-priestess-death', true)
      this.time.delayedCall(800, () => {
        this.goal.setVisible(true)
        this.goal.body.enable = true
        this.goal.clearTint()
      })
      this.setStatusMessage('status.bossDefeated')
      return
    }

    activeBoss.sprite.play('boss-priestess-hurt', true)
    const playerResetState = getBossPhasePlayerResetState({
      maxHealth: PLAYER_MAX_HEALTH,
    })
    this.playerHealth = playerResetState.health
    this.updateHealthText()
    this.isAttacking = playerResetState.attacking
    this.isHomingAttacking = playerResetState.homingAttacking
    this.attackReady = playerResetState.attackReady
    this.homingTarget = undefined
    this.homingReticle?.setVisible(false)
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.applyPlayerGravityDirection(this.stage.playerSpawn.gravity ?? 'down', false)
    this.player.setPosition(this.stage.playerSpawn.x, getPlayerCenterY({
      surfaceY: this.stage.playerSpawn.surfaceY,
      gravity: this.stage.playerSpawn.gravity ?? 'down',
    }))
    this.player.setVelocity(0, 0)
    this.cameras.main.centerOn(this.player.x, this.player.y)
    this.cameras.main.flash(180, 245, 250, 255)
    this.time.delayedCall(620, () => this.startBossPattern())
  }

  private createCheckpoints(): void {
    const definition = objectDefinitions.checkpoint
    this.checkpointGlows = []
    this.checkpointRings = []
    this.checkpointSprites = this.stage.checkpoints.map((checkpoint, index) => {
      const bottomY = groundedBottomY(checkpoint.surfaceY, 'checkpoint')
      const glow = this.add.ellipse(checkpoint.x, bottomY - 3, 92, 20, THEME.cyan, 0.24)
      glow.setDepth(6)
      glow.setBlendMode(Phaser.BlendModes.ADD)
      this.checkpointGlows[index] = glow

      const ring = this.add.ellipse(checkpoint.x, bottomY - 52, 74, 74)
      ring.setStrokeStyle(3, THEME.cyan, 0.7)
      ring.setDepth(8)
      ring.setBlendMode(Phaser.BlendModes.ADD)
      this.checkpointRings[index] = ring

      const sprite = this.add.image(checkpoint.x, bottomY, 'checkpoint-beacon')
      sprite.setOrigin(definition.origin.x, definition.origin.y)
      sprite.setDisplaySize(definition.displaySize.width, definition.displaySize.height)
      sprite.setAlpha(0.82)
      sprite.setDepth(7)

      this.tweens.add({
        targets: [glow, ring],
        alpha: { from: 0.24, to: 0.68 },
        scaleX: { from: 0.92, to: 1.14 },
        scaleY: { from: 0.92, to: 1.14 },
        duration: 920 + index * 130,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })

      return sprite
    })
  }

  private buildTerrainData(): number[][] {
    const data = Array.from({ length: this.tileRows }, () => Array.from({ length: this.tileColumns }, () => -1))

    for (const rect of this.stage.platforms) {
      this.writePlatformTiles(data, rect.col, rect.row, rect.width, rect.height)
    }

    return data
  }

  private writePlatformTiles(data: number[][], col: PlatformRect['col'], row: PlatformRect['row'], width: PlatformRect['width'], height: PlatformRect['height']): void {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        data[row + y][col + x] = getPlatformTileIndex({ index: x, width })
      }
    }
  }

  private tryAttack(): void {
    if (!canStartMeleeAttack({
      attackReady: this.attackReady,
      hurting: this.isHurting,
      homingAttacking: this.isHomingAttacking,
    })) {
      return
    }

    const attackEntryState = getMeleeAttackEntryState()
    this.attackReady = attackEntryState.attackReady
    this.dispatchSfx('armor-step')
    this.nextFootstepAt = this.time.now + 270
    this.isAttacking = attackEntryState.attacking
    this.setPlayerVisualState('attack')
    this.playPlayerAnimation('player-attack')

    const hitboxGeometry = getMeleeHitboxGeometry({
      playerX: this.player.x,
      playerY: this.player.y,
      playerFlipX: this.player.flipX,
    })
    const hitbox = this.add.image(hitboxGeometry.x, hitboxGeometry.y, 'attack')
    hitbox.setFlipX(hitboxGeometry.flipX)
    hitbox.setVisible(false)

    const hitEnemy = this.enemies.find((enemy) => !enemy.defeated && Phaser.Geom.Intersects.RectangleToRectangle(hitbox.getBounds(), enemy.sprite.getBounds()))

    if (hitEnemy) {
      this.defeatEnemy(hitEnemy.sprite)
    }

    this.time.delayedCall(120, () => {
      hitbox.destroy()
    })

    this.time.delayedCall(340, () => {
      const attackEndState = getMeleeAttackEndState()
      this.isAttacking = attackEndState.attacking
      this.setPlayerVisualState('normal')
    })

    this.time.delayedCall(360, () => {
      const attackReadyState = getMeleeAttackReadyState()
      this.attackReady = attackReadyState.attackReady
    })
  }

  private hurtPlayer(enemy: ArcadeSprite): void {
    if (!canApplyPlayerEnemyHit({
      invulnerable: this.isInvulnerable,
      hurting: this.isHurting,
      enemyDefeated: this.isEnemyDefeated(enemy),
      homingAttacking: this.isHomingAttacking,
      dead: this.isDead,
    })) {
      return
    }

    this.applyPlayerHit(enemy.x)
  }

  private hurtPlayerFromHazard(sourceX: number): void {
    if (!canApplyPlayerHazardHit({
      invulnerable: this.isInvulnerable,
      hurting: this.isHurting,
      homingAttacking: this.isHomingAttacking,
      dead: this.isDead,
      stageCleared: this.stageCleared,
    })) {
      return
    }

    this.applyPlayerHit(sourceX)
  }

  private applyPlayerHit(sourceX: number): void {
    if (!canApplyPlayerDamage({
      invulnerable: this.isInvulnerable,
      hurting: this.isHurting,
      homingAttacking: this.isHomingAttacking,
      crouching: this.isCrouching,
      dead: this.isDead,
    })) {
      return
    }

    const damageOutcome = getPlayerDamageOutcome({ currentHealth: this.playerHealth })
    this.playerHealth = damageOutcome.nextHealth
    this.dispatchSfx('hit')
    this.damageTaken += 1
    this.updateHealthText()

    if (damageOutcome.type === 'defeated') {
      this.defeatPlayer('damage')
      return
    }

    const hurtEntryState = getPlayerHurtEntryState()
    this.isHurting = hurtEntryState.hurting
    this.isInvulnerable = hurtEntryState.invulnerable
    this.isAttacking = hurtEntryState.attacking
    this.isHomingAttacking = hurtEntryState.homingAttacking
    this.isCrouching = hurtEntryState.crouching
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.stopPlayerHurtBlink()
    this.attackReady = hurtEntryState.attackReady

    const knockbackDirection = getPlayerKnockbackDirection({
      playerX: this.player.x,
      sourceX,
    })
    this.player.setVelocity(knockbackDirection * 360, -360 * this.gravitySign)
    this.playPlayerAnimation('player-hurt')
    this.setStatusMessage('status.hurt', { hp: this.playerHealth, max: PLAYER_MAX_HEALTH })

    this.hurtTween = this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 4,
    })

    this.time.delayedCall(420, () => {
      const recoveryState = getPlayerHurtRecoveryState()
      this.isHurting = recoveryState.hurting
      this.attackReady = recoveryState.attackReady
    })

    this.time.delayedCall(900, () => {
      const recoveryState = getPlayerInvulnerabilityRecoveryState()
      this.isInvulnerable = recoveryState.invulnerable
      this.stopPlayerHurtBlink()
      this.setStatusMessage('status.stabilized')
    })
  }

  private defeatEnemy(sprite: ArcadeSprite): void {
    const enemy = this.enemies.find((candidate) => candidate.sprite === sprite)

    if (!enemy || enemy.defeated) {
      return
    }

    if (enemy === this.bossPrototype) {
      this.hitBossPrototype()
      return
    }

    enemy.defeated = true
    this.dispatchSfx('hit')
    const defeatOutcome = getEnemyDefeatOutcome(enemy.point)
    this.enemiesDefeated += defeatOutcome.scoreDelta
    this.homingReticle?.setVisible(false)
    enemy.sprite.setVelocity(0, 0)
    enemy.sprite.body.enable = false
    if (enemy.point.type === 'azure-core') {
      this.tweens.killTweensOf(enemy.sprite)
      this.tweens.add({
        targets: enemy.sprite,
        scale: 1.8,
        alpha: 0,
        angle: enemy.sprite.angle + 90,
        duration: 260,
        ease: 'Quad.easeOut',
      })
    } else {
      if (this.stageTheme === 'emerald-sanctuary') {
        enemy.sprite.setTexture(this.guardDeathTextureKey)
      } else {
        enemy.sprite.play('enemy-guard-death')
      }
    }
    this.setStatusMessage('status.enemyCleared')

    this.time.delayedCall(520, () => {
      enemy.sprite.setVisible(false)
    })

    if (defeatOutcome.shouldRegenerate) {
      this.scheduleEnemyRegeneration(enemy)
    }
  }

  private scheduleEnemyRegeneration(enemy: EnemyRuntime): void {
    const delay = getEnemyRespawnDelayMs(enemy.point)
    this.time.delayedCall(delay, () => this.tryRegenerateEnemy(enemy))
  }

  private tryRegenerateEnemy(enemy: EnemyRuntime): void {
    const spawnY = getEnemySpawnY(enemy.point)
    const playerDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.point.x, spawnY)
    const decision = getEnemyRegenerationDecision({
      stageCleared: this.stageCleared,
      enemyDefeated: enemy.defeated,
      playerDead: this.isDead,
      playerDistance,
    })

    if (decision === 'skip') return
    if (decision === 'delay') {
      this.time.delayedCall(300, () => this.tryRegenerateEnemy(enemy))
      return
    }

    this.tweens.killTweensOf(enemy.sprite)
    enemy.sprite.setPosition(enemy.point.x, spawnY)
    if (enemy.point.type === 'azure-core') {
      this.configureAzureCore(enemy.sprite, spawnY)
      enemy.sprite.body.enable = false
      enemy.sprite.setScale(0.35)
      enemy.sprite.setAlpha(0)
      this.tweens.add({
        targets: enemy.sprite,
        scale: 1,
        alpha: 1,
        duration: 320,
        ease: 'Back.easeOut',
        onComplete: () => {
          enemy.defeated = false
          enemy.sprite.body.enable = true
          this.setStatusMessage('status.coreRegenerated')
        },
      })
    } else {
      enemy.defeated = false
      enemy.sprite.setVisible(true)
      enemy.sprite.setAlpha(1)
      enemy.sprite.body.enable = true
      if (this.stageTheme === 'emerald-sanctuary') {
        enemy.sprite.setTexture(this.guardTextureKey)
      } else {
        enemy.sprite.play('enemy-guard-walk')
      }
    }
  }

  private updateEnemyPatrol(): void {
    for (const enemy of this.enemies) {
      if (!shouldUpdateEnemyPatrol({
        defeated: enemy.defeated,
        type: enemy.point.type,
      })) {
        continue
      }

      enemy.direction = getNextPatrolDirection({
        x: enemy.sprite.x,
        patrolMinX: enemy.point.patrolMinX,
        patrolMaxX: enemy.point.patrolMaxX,
        currentDirection: enemy.direction,
      })

      enemy.sprite.setVelocityX(enemy.direction * 80)
      enemy.sprite.setFlipX(enemy.direction > 0)
    }
  }

  private updateMovingPlatforms(): void {
    const updateDecision = getMovingPlatformUpdateDecision({
      dead: this.isDead,
      stageCleared: this.stageCleared,
    })
    if (updateDecision === 'stop') {
      for (const platform of this.movingPlatforms) platform.sprite.body.setVelocity(0, 0)
      return
    }

    for (const platform of this.movingPlatforms) {
      const carryingPlayer = this.isPlayerRidingMovingPlatform(platform)
      const nextPosition = getMovingPlatformPosition({
        startX: platform.startX,
        startY: platform.startY,
        axis: platform.point.axis,
        distance: platform.point.distance,
        durationMs: platform.point.durationMs,
        phase: platform.point.phase,
        nowMs: this.time.now,
      })
      const nextX = nextPosition.x
      const nextY = nextPosition.y
      const deltaSeconds = Math.max(this.game.loop.delta / 1000, 0.001)
      const deltaX = nextX - platform.previousX
      const deltaY = nextY - platform.previousY

      platform.sprite.body.setVelocity(deltaX / deltaSeconds, deltaY / deltaSeconds)
      platform.sprite.setPosition(nextX, nextY)
      platform.sprite.body.updateFromGameObject()
      if (carryingPlayer) {
        this.player.x += deltaX
        this.player.y += deltaY
        this.player.body.updateFromGameObject()
      }
      platform.previousX = nextX
      platform.previousY = nextY
    }
  }

  private isPlayerRidingMovingPlatform(platform: MovingPlatformRuntime): boolean {
    if (!this.player?.body || !platform.sprite.body || this.playerGravityDirection !== 'down') return false

    const playerBody = this.player.body
    const platformBody = platform.sprite.body
    return isMovingPlatformRider({
      playerGravityDown: this.playerGravityDirection === 'down',
      playerLeft: playerBody.left,
      playerRight: playerBody.right,
      playerBottom: playerBody.bottom,
      platformLeft: platformBody.left,
      platformRight: platformBody.right,
      platformTop: platformBody.top,
      touchingDown: playerBody.touching.down,
      blockedDown: playerBody.blocked.down,
    })
  }

  private isEnemyDefeated(sprite: ArcadeSprite): boolean {
    return this.enemies.find((enemy) => enemy.sprite === sprite)?.defeated ?? true
  }

  private updateCheckpoint(): void {
    const nextCheckpointIndex = findNextCheckpointIndex({
      checkpoints: this.stage.checkpoints,
      activeCheckpointIndex: this.activeCheckpointIndex,
      playerX: this.player.x,
    })

    if (nextCheckpointIndex === -1) {
      return
    }

    const checkpoint = this.stage.checkpoints[nextCheckpointIndex]
    this.activeCheckpointIndex = nextCheckpointIndex
    this.dispatchSfx('checkpoint')
    this.respawnPoint = {
      x: checkpoint.spawnX,
      y: getPlayerCenterY({
        surfaceY: checkpoint.spawnSurfaceY,
        gravity: checkpoint.spawnGravity ?? this.playerGravityDirection,
      }),
      gravity: checkpoint.spawnGravity ?? this.playerGravityDirection,
    }
    const sprite = this.checkpointSprites[nextCheckpointIndex]
    const glow = this.checkpointGlows[nextCheckpointIndex]
    const ring = this.checkpointRings[nextCheckpointIndex]
    sprite.setAlpha(1)
    sprite.setTint(0xfff0a8)
    glow.setFillStyle(THEME.gold, 0.7)
    ring.setStrokeStyle(4, THEME.gold, 1)
    this.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.12,
      scaleY: sprite.scaleY * 1.12,
      duration: 180,
      yoyo: true,
    })
    this.tweens.add({
      targets: [glow, ring],
      alpha: 1,
      duration: 180,
      yoyo: true,
    })
    this.setStatusMessage('status.checkpoint')
  }

  private respawnPlayer(): void {
    const respawnState = getPlayerRespawnState()
    this.isHurting = respawnState.hurting
    this.isInvulnerable = respawnState.invulnerable
    this.isAttacking = respawnState.attacking
    this.isHomingAttacking = respawnState.homingAttacking
    this.setCrouching(respawnState.crouching)
    this.isDead = respawnState.dead
    this.homingTarget = undefined
    this.attackReady = respawnState.attackReady
    this.playerHealth = respawnState.health
    this.jumpBufferedUntil = respawnState.jumpBufferedUntil
    this.remainingAirJumps = respawnState.remainingAirJumps
    this.lastGroundedAt = this.time.now
    this.updateHealthText()
    this.stopPlayerHurtBlink()
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.applyPlayerGravityDirection(this.respawnPoint.gravity, false)
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y)
    this.player.setVelocity(0, 0)
    this.player.body.enable = true
    this.playPlayerAnimation('player-idle')
    this.setEnemiesFrozen(false)
    this.setStatusMessage('status.restored')
    if (shouldRestartBossPatternAfterRespawn({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })) {
      this.time.delayedCall(500, () => this.startBossPattern())
    }
  }

  private defeatPlayer(reason: PlayerDefeatReason): void {
    if (!canEnterPlayerDefeat({
      dead: this.isDead,
      stageCleared: this.stageCleared,
    })) {
      return
    }

    const defeatOutcome = getPlayerDefeatOutcome({
      reason,
      gravitySign: this.gravitySign,
    })

    const defeatEntryState = getPlayerDefeatEntryState()
    this.isDead = defeatEntryState.dead
    this.dispatchSfx('death')
    this.falls += defeatOutcome.fallCountDelta
    this.isHurting = defeatEntryState.hurting
    this.isInvulnerable = defeatEntryState.invulnerable
    this.isAttacking = defeatEntryState.attacking
    this.isHomingAttacking = defeatEntryState.homingAttacking
    this.setCrouching(defeatEntryState.crouching)
    this.attackReady = defeatEntryState.attackReady
    this.homingTarget = undefined
    this.homingReticle?.setVisible(false)
    if (this.isBossStage) {
      this.bossPatternGeneration += 1
      this.bossPatternEvent?.remove(false)
      this.bossPatternEvent = undefined
      this.clearBossProjectiles()
    }
    this.stopPlayerHurtBlink()
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.player.setAccelerationX(0)
    this.player.setVelocity(0, defeatOutcome.velocityY)
    this.setEnemiesFrozen(true)
    this.playPlayerAnimation('player-death')
    this.setStatusMessage(defeatOutcome.statusKey)

    this.time.delayedCall(700, () => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.respawnPlayer()
        this.cameras.main.fadeIn(450, 245, 250, 255)
      })
      this.cameras.main.fadeOut(350, 245, 250, 255)
    })
  }

  private setEnemiesFrozen(frozen: boolean): void {
    for (const enemy of this.enemies) {
      if (!shouldUpdateEnemyFreezeState({
        defeated: enemy.defeated,
        active: enemy.sprite.active,
      })) continue

      enemy.sprite.setVelocity(0, 0)
      enemy.sprite.setAcceleration(0, 0)
      const definition = objectDefinitions[enemy.point.type ?? 'guard']
      enemy.sprite.body.allowGravity = !frozen && definition.gravity

      if (frozen) {
        enemy.sprite.anims.pause()
      } else {
        enemy.sprite.anims.resume()
        if (definition.behavior === 'patrol') {
          enemy.sprite.setVelocityX(enemy.direction * 80)
        }
      }
    }
  }

  private completeStage(): void {
    if (!canCompleteStage({ stageCleared: this.stageCleared })) {
      return
    }

    const clearState = getStageClearState()
    this.stageCleared = clearState.stageCleared
    this.dispatchSfx('goal')
    this.isAttacking = clearState.attacking
    this.isHomingAttacking = clearState.homingAttacking
    this.attackReady = clearState.attackReady
    this.homingTarget = undefined
    this.homingReticle?.setVisible(false)
    this.stopPlayerHurtBlink()
    this.player.setVelocity(0, 0)
    this.player.setAccelerationX(0)
    for (const enemy of this.enemies) {
      enemy.sprite.setVelocityX(0)
    }
    this.goal.setTint(THEME.cyan)
    this.setStatusMessage('status.goal', { coins: this.getCoinLabel(), time: this.getTimerLabel() })
    this.dispatchHudState({ cleared: true })
    this.setPlayerVisualState('normal')
    this.playPlayerAnimation('player-idle')
  }

  private setPlayerVisualState(state: PlayerVisualState): void {
    const { scale, visualOffsetY } = getPlayerVisualStatePresentation({
      state,
      normalScale: PLAYER_SCALE,
      attackScale: PLAYER_ATTACK_SCALE,
      attackVisualOffsetY: PLAYER_ATTACK_VISUAL_Y_OFFSET,
    })

    if (this.player.scaleX !== scale || this.player.scaleY !== scale) {
      this.player.setScale(scale)
    }

    if (this.playerVisualYOffset !== visualOffsetY) {
      this.player.y += visualOffsetY - this.playerVisualYOffset
      this.playerVisualYOffset = visualOffsetY
    }

    const body = objectDefinitions.player.body
    this.player.body.setSize(body.width, body.height)
    this.player.body.setOffset(body.offsetX, body.offsetY)
  }

  private setCrouching(crouching: boolean): void {
    if (this.isCrouching === crouching) return
    this.isCrouching = crouching
    const body = objectDefinitions.player.body
    if (crouching) {
      this.setPlayerVisualState('normal')
      this.player.y += PLAYER_CROUCH_VISUAL_Y_OFFSET
      this.playerVisualYOffset = PLAYER_CROUCH_VISUAL_Y_OFFSET
      this.player.body.setSize(body.width + 10, 38)
      this.player.body.setOffset(body.offsetX - 5, body.offsetY + 24)
      this.playPlayerAnimation('player-crouch')
    } else {
      this.setPlayerVisualState('normal')
    }
  }

  private tryHomingAttack(): boolean {
    if (!canStartHomingAttack({
      attackReady: this.attackReady,
      hurting: this.isHurting,
      homingAttacking: this.isHomingAttacking,
      dead: this.isDead,
    })) {
      return false
    }

    const target = this.findHomingTarget()

    const targetDecision = getHomingTargetAcquisitionDecision({ hasTarget: target !== undefined })
    if (targetDecision === 'fail') {
      return false
    }

    if (!target) {
      return false
    }

    const homingEntryState = getHomingAttackEntryState()
    this.attackReady = homingEntryState.attackReady
    this.isAttacking = homingEntryState.attacking
    this.isHomingAttacking = homingEntryState.homingAttacking
    this.homingTarget = target
    this.homingReticle?.setVisible(false)
    this.setPlayerVisualState('normal')
    this.player.anims.stop()
    this.player.setTexture('player-attack', HOMING_ATTACK_FRAME)
    this.resolveHomingAttack(target)

    return true
  }

  private findHomingTarget(): ArcadeSprite | undefined {
    const facing = this.player.flipX ? -1 : 1
    const candidates = this.enemies
      .filter((enemy) => isHomingTargetAvailable({
        defeated: enemy.defeated,
        active: enemy.sprite.active,
        visible: enemy.sprite.visible,
      }))
      .map((enemy) => ({
        target: enemy.sprite,
        targetX: enemy.sprite.x,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y),
      }))
    return selectNearestHomingTarget({
      playerX: this.player.x,
      facing,
      candidates,
    })
  }

  private updateHomingReticle(grounded: boolean): void {
    if (!canShowHomingReticle({
      grounded,
      stageCleared: this.stageCleared,
      dead: this.isDead,
      attacking: this.isAttacking,
      hurting: this.isHurting,
      homingAttacking: this.isHomingAttacking,
    })) {
      this.homingReticle?.setVisible(false)
      return
    }

    const target = this.findHomingTarget()

    if (!target) {
      this.homingReticle?.setVisible(false)
      return
    }

    if (!this.homingReticle) {
      this.homingReticle = this.add.image(target.x, target.y + HOMING_RETICLE_Y_OFFSET, 'homing-reticle')
      this.homingReticle.setDepth(20)
      this.homingReticle.setBlendMode(Phaser.BlendModes.ADD)
    }

    this.homingReticle.setPosition(target.x, target.y + HOMING_RETICLE_Y_OFFSET)
    this.homingReticle.setVisible(true)
    this.homingReticle.setAngle(this.homingReticle.angle + 3)
  }

  private updateHomingAttack(): void {
    const target = this.homingTarget
    if (!shouldUpdateHomingAttack({
      homingAttacking: this.isHomingAttacking,
      hasTarget: target !== undefined,
    })) {
      return
    }

    if (!target) {
      return
    }

    if (isHomingTargetLost({
      defeated: this.isEnemyDefeated(target),
      active: target.active,
      visible: target.visible,
    })) {
      this.finishHomingAttack(false)
      return
    }
  }

  private resolveHomingAttack(target: ArcadeSprite): void {
    const startX = this.player.x
    const startY = this.player.y
    const { x: contactX, y: contactY } = getHomingContactPoint({
      startX,
      startY,
      targetX: target.x,
      targetY: target.y,
      contactDistance: HOMING_ATTACK_CONTACT_DISTANCE,
    })

    this.player.setFlipX(target.x < startX)
    this.emitHomingTrail(startX, startY, contactX, contactY)
    this.collectCoinsAlongLine(startX, startY, contactX, contactY)
    this.player.setPosition(contactX, contactY)
    this.player.setVelocity(0, 0)
    this.dispatchSfx('armor-step')
    const resetsBossRun = shouldResetBossRunAfterHomingHit({
      targetIsBoss: target === this.bossPrototype?.sprite,
      bossPhase: this.bossPhase,
    })
    this.defeatEnemy(target)
    if (!resetsBossRun) {
      this.finishHomingAttack(true)
    }
  }

  private finishHomingAttack(hit: boolean): void {
    this.isHomingAttacking = false
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)

    const outcome = getHomingFinishOutcome({
      hit,
      gravitySign: this.gravitySign,
    })
    if (outcome.remainingAirJumps !== undefined) {
      this.remainingAirJumps = outcome.remainingAirJumps
    }
    this.player.setVelocity(0, outcome.velocityY)
    this.setStatusMessage(outcome.statusKey)

    this.time.delayedCall(HOMING_ATTACK_RECOVERY_MS, () => {
      const recoveryState = getHomingRecoveryState({ hurting: this.isHurting })
      this.isAttacking = recoveryState.attacking
      if (recoveryState.attackReady !== undefined) {
        this.attackReady = recoveryState.attackReady
      }
    })
  }

  private emitHomingTrail(startX: number, startY: number, endX: number, endY: number): void {
    for (const sample of getHomingTrailSamples({ startX, startY, endX, endY })) {
      const trail = this.add.sprite(
        sample.x,
        sample.y,
        'player-attack',
        HOMING_ATTACK_FRAME,
      )

      trail.setDepth(this.player.depth - 1)
      trail.setScale(Math.abs(this.player.scaleX), Math.abs(this.player.scaleY))
      trail.setFlipX(this.player.flipX)
      trail.setTint(THEME.cyan)
      trail.setAlpha(sample.alpha)
      trail.setBlendMode(Phaser.BlendModes.ADD)

      this.tweens.add({
        targets: trail,
        alpha: 0,
        duration: HOMING_TRAIL_FADE_MS,
        delay: HOMING_TRAIL_HOLD_MS,
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

  private setPlayerHomingCollision(enabled: boolean): void {
    this.player.body.allowGravity = enabled
    this.player.body.setGravityY(enabled
      ? getPlayerBodyGravityY({
          direction: this.playerGravityDirection,
          worldGravityY: WORLD_GRAVITY_Y,
        })
      : 0)
    this.player.body.checkCollision.none = !enabled
  }

  private stopPlayerHurtBlink(): void {
    this.hurtTween?.stop()
    this.hurtTween = undefined
    this.player.setAlpha(1)
  }

  private updateHealthText(): void {
    this.dispatchHudState()
  }

  private getHealthLabel(): string {
    return formatHealthLabel({ current: this.playerHealth, max: PLAYER_MAX_HEALTH })
  }

  private updateCoins(): void {
    if (!shouldScanPlayerCoins({
      stageCleared: this.stageCleared,
      dead: this.isDead,
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

  private collectCoin(coin: CoinRuntime): void {
    coin.collected = true
    this.dispatchSfx('coin')
    this.collectedCoins += 1
    this.updateCoinText()

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

    const pip = this.add.text(coin.point.x, coin.point.y - 22, '+1', {
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '18px',
      fontStyle: '700',
      color: '#ffe6a0',
      stroke: '#17324f',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(18)

    this.tweens.add({
      targets: pip,
      y: pip.y - 34,
      alpha: 0,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => pip.destroy(),
    })
  }

  private updateCoinText(): void {
    this.dispatchHudState()
  }

  private getCoinLabel(): string {
    return formatCoinLabel({ collected: this.collectedCoins, target: this.coinTargetCount })
  }

  private updateTimer(): void {
    if (!shouldAdvanceStageTimer({
      timerStarted: this.timerStarted,
      stageCleared: this.stageCleared,
      dead: this.isDead,
    })) {
      return
    }

    this.stageTimeMs += this.game.loop.delta
    this.dispatchHudState()
  }

  private getTimerLabel(): string {
    return `TIME ${formatStageTimer({ elapsedMs: this.stageTimeMs })}`
  }

  private getRank(): ClearRank {
    return calculateStageRank({
      elapsedMs: this.stageTimeMs,
      rankTargets: this.stage.rankTargets,
      coins: this.collectedCoins,
      coinTarget: this.coinTargetCount,
      enemiesDefeated: this.enemiesDefeated,
      enemyTarget: this.scoreEnemyTargetCount,
      checkpointsReached: this.getCheckpointReachedCount(),
      checkpointTarget: this.getCheckpointTargetCount(),
      damageTaken: this.damageTaken,
      falls: this.falls,
    })
  }

  private getCheckpointReachedCount(): number {
    return getReachedCheckpointCount({ activeCheckpointIndex: this.activeCheckpointIndex })
  }

  private getCheckpointTargetCount(): number {
    return getCheckpointTargetCount({ checkpoints: this.stage.checkpoints })
  }

  private setStatusMessage(message: TranslationKey, params: TranslationParams = {}): void {
    this.statusMessage = message
    this.statusParams = params
    this.dispatchHudState()
  }

  private dispatchHudState(overrides: Record<string, unknown> = {}): void {
    const bossHudPhase = getBossHudPhaseDisplay({
      isBossStage: this.isBossStage,
      bossPhase: this.bossPhase,
    })

    window.dispatchEvent(new CustomEvent('projectrun:hud', {
      detail: {
        hp: this.playerHealth,
        hpMax: PLAYER_MAX_HEALTH,
        coins: this.collectedCoins,
        coinTarget: this.coinTargetCount,
        damageTaken: this.damageTaken,
        falls: this.falls,
        enemiesDefeated: this.enemiesDefeated,
        enemyTarget: this.scoreEnemyTargetCount,
        checkpointsReached: this.getCheckpointReachedCount(),
        checkpointTarget: this.getCheckpointTargetCount(),
        rank: this.getRank(),
        time: this.getTimerValue(),
        objective: this.stage.objective,
        statusMessage: this.statusMessage,
        statusParams: this.statusParams,
        playerProgress: getHudProgress({ position: this.player.x, worldSize: this.worldWidth }),
        playerProgressY: getHudProgress({ position: this.player.y, worldSize: this.worldHeight }),
        goalProgress: getHudGoalProgress({ goalX: this.stage.goal.x, worldWidth: this.worldWidth }),
        enemyActive: hasActiveEnemy({ enemies: this.enemies }),
        enemyMarkers: getHudEnemyMarkers({
          enemies: this.enemies.map((enemy) => ({
            x: enemy.sprite.x,
            y: enemy.sprite.y,
            defeated: enemy.defeated,
          })),
          worldWidth: this.worldWidth,
          worldHeight: this.worldHeight,
        }),
        mapPlatforms: getHudPlatformMarkers({
          platforms: this.stage.platforms,
          tileColumns: this.tileColumns,
          tileSize: this.tileSize,
          worldHeight: this.worldHeight,
        }),
        checkpointMarkers: getHudCheckpointMarkers({
          checkpoints: this.stage.checkpoints,
          worldWidth: this.worldWidth,
          worldHeight: this.worldHeight,
        }),
        activeCheckpointIndex: this.activeCheckpointIndex,
        bossPhase: bossHudPhase.phase,
        bossPhaseMax: bossHudPhase.max,
        cleared: this.stageCleared,
        ...overrides,
      },
    }))
  }

  private dispatchSfx(name: string): void {
    window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: name }))
  }

  private getInitialStatusMessage(): TranslationKey {
    return this.stage.enemies.some((enemy) => enemy.type === 'azure-core')
      ? 'status.azureDetected'
      : 'status.initial'
  }

  private updateMovementSfx(grounded: boolean, moving: boolean): void {
    const decision = getMovementFootstepDecision({
      now: this.time.now,
      grounded,
      wasGrounded: this.wasGrounded,
      moving,
      velocityX: this.player.body.velocity.x,
      nextFootstepAt: this.nextFootstepAt,
    })
    if (decision.playSfx) {
      this.dispatchSfx('armor-step')
    }

    this.nextFootstepAt = decision.nextFootstepAt
    this.wasGrounded = decision.wasGrounded
  }

  private getTimerValue(): string {
    return this.getTimerLabel().replace('TIME ', '')
  }
}
