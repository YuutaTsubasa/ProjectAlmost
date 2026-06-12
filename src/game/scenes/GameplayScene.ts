import * as Phaser from 'phaser'
import { IMAGE_ASSETS } from '../assets/assetManifest'
import { groundedBottomY, groundedCenterY, objectDefinitions } from '../objects/objectDefinitions'
import { activeStage } from '../stages/stageRegistry'
import type { CoinPoint, EnemyPoint, PlatformRect } from '../stages/stageTypes'
import type { TranslationKey, TranslationParams } from '../../i18n'

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
  direction: number
}

const SOLID_TILE_INDEXES = [0, 1, 2]
const PLAYER_MAX_HEALTH = 3
const CAMERA_ZOOM = 1.25
const PLAYER_SCALE = 0.78
const PLAYER_ATTACK_SCALE = 0.98
const PLAYER_ATTACK_VISUAL_Y_OFFSET = -10
const HOMING_ATTACK_RANGE = 360
const HOMING_ATTACK_RECOVERY_MS = 220
const HOMING_ATTACK_BOUNCE_Y = -420
const HOMING_RETICLE_Y_OFFSET = -8
const HOMING_ATTACK_CONTACT_DISTANCE = 34
const HOMING_ATTACK_FRAME = 2
const HOMING_TRAIL_SPACING = 28
const HOMING_TRAIL_HOLD_MS = 70
const HOMING_TRAIL_FADE_MS = 260
const JUMP_BUFFER_MS = 140
const COYOTE_TIME_MS = 120
const GROUND_ACCELERATION = 950
const AIR_ACCELERATION = 720
const PLAYER_MAX_RUN_SPEED = 500
const DEFAULT_REGENERATE_DELAY_MS = 1400
const ENEMY_REGENERATE_SAFE_DISTANCE = 140
const THEME = {
  royalBlue: 0x2f6fb4,
  cyan: 0x33b5ff,
  gold: 0xd7a84f,
  white: 0xf8fdff,
}

export class GameplayScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'left' | 'right' | 'jump' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>
  private player!: ArcadeSprite
  private enemies: EnemyRuntime[] = []
  private goal!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody
  private terrainLayer!: TilemapLayer
  private farBackground!: Phaser.GameObjects.TileSprite
  private midBackground!: Phaser.GameObjects.TileSprite
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
  private gamepadJumpDown = false
  private gamepadAttackDown = false
  private virtualMoveX = 0
  private virtualJumpPressed = false
  private virtualAttackPressed = false
  private wasGrounded = true
  private nextFootstepAt = 0
  private lastGroundedAt = 0
  private jumpBufferedUntil = 0
  private statusMessage = this.getInitialStatusMessage()
  private statusParams: TranslationParams = {}
  private activeCheckpointIndex = -1
  private respawnPoint = {
    x: activeStage.playerSpawn.x,
    y: groundedCenterY(activeStage.playerSpawn.surfaceY, 'player'),
  }

  constructor() {
    super('GameplayScene')
  }

  private get worldWidth(): number {
    return activeStage.world.width
  }

  private get worldHeight(): number {
    return activeStage.world.height
  }

  private get tileSize(): number {
    return activeStage.world.tileSize
  }

  private get tileColumns(): number {
    return this.worldWidth / this.tileSize
  }

  private get tileRows(): number {
    return Math.ceil(this.worldHeight / this.tileSize)
  }

  private get coinTargetCount(): number {
    return activeStage.coins.length
  }

  private get scoreEnemyTargetCount(): number {
    return activeStage.enemies.filter((enemy) => this.enemyCountsForScore(enemy)).length
  }

  preload(): void {
    this.load.image('white-palace-sky', IMAGE_ASSETS.palaceSky)
    this.load.image('white-palace-far-bg', IMAGE_ASSETS.palaceFarBackground)
    this.load.image('white-palace-mid-bg', IMAGE_ASSETS.palaceMidBackground)
    this.load.image('palace-tiles', IMAGE_ASSETS.palaceTiles)
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
  }

  create(): void {
    this.resetRuntimeState()
    this.createTextures()
    this.createAnimations()

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.physics.world.setBoundsCollision(true, true, true, false)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)

    this.createParallaxBackground()
    this.terrainLayer = this.createTerrainLayer()
    this.createCoins()
    this.createEnemies()
    this.createCheckpoints()

    const playerDefinition = objectDefinitions.player
    this.player = this.physics.add.sprite(
      activeStage.playerSpawn.x,
      groundedCenterY(activeStage.playerSpawn.surfaceY, 'player'),
      'player-idle',
    )
    this.player.setOrigin(playerDefinition.origin.x, playerDefinition.origin.y)
    this.player.setCollideWorldBounds(true)
    this.player.setDragX(1500)
    this.player.setMaxVelocity(PLAYER_MAX_RUN_SPEED, 900)
    this.setPlayerVisualState('normal')
    this.player.play('player-idle')

    const goalDefinition = objectDefinitions.goal
    this.goal = this.physics.add.staticSprite(
      activeStage.goal.x,
      groundedBottomY(activeStage.goal.surfaceY, 'goal'),
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
    for (const enemy of this.enemies) {
      if (enemy.point.type !== 'azure-core') {
        this.physics.add.collider(enemy.sprite, this.terrainLayer)
      }
      this.physics.add.collider(this.player, enemy.sprite, () => this.hurtPlayer(enemy.sprite))
    }
    this.physics.add.overlap(this.player, this.goal, () => this.completeStage())

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      attackAlt: Phaser.Input.Keyboard.KeyCodes.Z,
    }) as Record<'left' | 'right' | 'jump' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setZoom(CAMERA_ZOOM)
    this.cameras.main.setDeadzone(360, 240)

    this.dispatchHudState()
    window.addEventListener('projectrun:virtual-input', this.handleVirtualInput)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('projectrun:virtual-input', this.handleVirtualInput)
    })
  }

  private handleVirtualInput = (event: Event): void => {
    const detail = (event as CustomEvent<{ type: 'move' | 'jump' | 'attack'; x?: number }>).detail
    if (detail.type === 'move') this.virtualMoveX = detail.x ?? 0
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
    this.isDead = false
    this.homingTarget = undefined
    this.homingReticle = undefined
    this.hurtTween = undefined
    this.playerVisualYOffset = 0
    this.coins = []
    this.collectedCoins = 0
    this.damageTaken = 0
    this.falls = 0
    this.enemiesDefeated = 0
    this.stageTimeMs = 0
    this.timerStarted = false
    this.gamepadJumpDown = false
    this.gamepadAttackDown = false
    this.virtualMoveX = 0
    this.virtualJumpPressed = false
    this.virtualAttackPressed = false
    this.wasGrounded = true
    this.nextFootstepAt = 0
    this.lastGroundedAt = 0
    this.jumpBufferedUntil = 0
    this.statusMessage = this.getInitialStatusMessage()
    this.statusParams = {}
    this.activeCheckpointIndex = -1
    this.respawnPoint = {
      x: activeStage.playerSpawn.x,
      y: groundedCenterY(activeStage.playerSpawn.surfaceY, 'player'),
    }
  }

  update(): void {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find((candidate): candidate is Gamepad => candidate !== null)
    const padLeft = Boolean(pad && (pad.axes[0] < -0.35 || pad.buttons[14]?.pressed))
    const padRight = Boolean(pad && (pad.axes[0] > 0.35 || pad.buttons[15]?.pressed))
    const padJumpDown = Boolean(pad?.buttons[0]?.pressed)
    const padAttackDown = Boolean(pad?.buttons[2]?.pressed)
    const padJumpPressed = padJumpDown && !this.gamepadJumpDown
    const padAttackPressed = padAttackDown && !this.gamepadAttackDown
    this.gamepadJumpDown = padJumpDown
    this.gamepadAttackDown = padAttackDown

    const left = this.cursors.left.isDown || this.keys.left.isDown || padLeft || this.virtualMoveX < 0
    const right = this.cursors.right.isDown || this.keys.right.isDown || padRight || this.virtualMoveX > 0
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.jump) || padJumpPressed || this.virtualJumpPressed
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt) || padAttackPressed || this.virtualAttackPressed
    this.virtualJumpPressed = false
    this.virtualAttackPressed = false

    const grounded = this.player.body.blocked.down || this.player.body.touching.down
    if (grounded) this.lastGroundedAt = this.time.now
    if (jumpPressed) this.jumpBufferedUntil = this.time.now + JUMP_BUFFER_MS

    if (this.isDead) {
      this.player.setAccelerationX(0)
      return
    }

    if (this.stageCleared) {
      this.player.setAccelerationX(0)
      this.player.setVelocityX(0)
      this.updatePlayerAnimation(false, grounded)
      return
    }

    if (left) {
      this.timerStarted = true
      this.player.setAccelerationX(-(grounded ? GROUND_ACCELERATION : AIR_ACCELERATION))
      if (!this.isHurting) {
        this.player.setFlipX(true)
      }
    } else if (right) {
      this.timerStarted = true
      this.player.setAccelerationX(grounded ? GROUND_ACCELERATION : AIR_ACCELERATION)
      if (!this.isHurting) {
        this.player.setFlipX(false)
      }
    } else {
      this.player.setAccelerationX(0)
    }

    const canUseGroundJump = grounded || this.time.now - this.lastGroundedAt <= COYOTE_TIME_MS
    if (this.jumpBufferedUntil >= this.time.now && canUseGroundJump) {
      this.timerStarted = true
      this.player.setVelocityY(-640)
      this.jumpBufferedUntil = 0
      this.lastGroundedAt = 0
      this.dispatchSfx('armor-step')
      this.nextFootstepAt = this.time.now + 270
    }

    this.updateMovementSfx(grounded, left || right)
    this.updatePlayerAnimation(left || right, grounded)

    if (attackPressed) {
      this.timerStarted = true
      if (!grounded && this.tryHomingAttack()) {
        return
      }

      this.tryAttack()
    }

    this.updateHomingReticle(grounded)
    this.updateHomingAttack()
    this.updateEnemyPatrol()
    this.updateCheckpoint()
    this.updateCoins()
    this.updateTimer()
    this.updateParallaxBackground()

    if (this.player.y > this.worldHeight + 80) {
      this.defeatPlayer('fall')
    }
  }

  private createTextures(): void {
    this.makeRectTexture('attack', 56, 36, THEME.cyan, THEME.royalBlue)
    this.makeHomingReticleTexture()
    this.makeCoinTexture()
    this.makeAzureCoreTexture()
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
      key: 'stage-goal-idle',
      frames: this.anims.generateFrameNumbers('stage-goal', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
      yoyo: true,
    })
  }

  private updatePlayerAnimation(isMoving: boolean, grounded: boolean): void {
    if (this.isAttacking || this.isHurting || this.isHomingAttacking || this.isDead) {
      return
    }

    if (!grounded) {
      this.setPlayerVisualState('normal')
      this.playPlayerAnimation('player-jump', true)
      return
    }

    this.setPlayerVisualState('normal')
    this.playPlayerAnimation(isMoving ? 'player-run' : 'player-idle', true)
  }

  private playPlayerAnimation(key: string, respectAttackLock = false): void {
    if (respectAttackLock && (this.isAttacking || this.isHurting)) {
      return
    }

    if (this.player.anims.currentAnim?.key !== key) {
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

  private createParallaxBackground(): void {
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
    const tileset = map.addTilesetImage('palace-tiles', undefined, this.tileSize, this.tileSize, 0, 0)
    const layer = map.createLayer(0, tileset!, 0, 0)

    if (!layer) {
      throw new Error('Unable to create terrain tilemap layer.')
    }

    layer.setCollision(SOLID_TILE_INDEXES)
    layer.setDepth(5)

    return layer
  }

  private createCoins(): void {
    this.coins = activeStage.coins.map((point, index) => {
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
    this.enemies = activeStage.enemies.map((point) => {
      const isCore = point.type === 'azure-core'
      const definition = isCore ? objectDefinitions['azure-core'] : objectDefinitions.guard
      const spawnY = isCore ? point.y : groundedCenterY(point.surfaceY, 'guard')
      const sprite = this.physics.add.sprite(point.x, spawnY, isCore ? 'azure-core' : 'enemy-guard-walk')
      sprite.setOrigin(definition.origin.x, definition.origin.y)
      sprite.setCollideWorldBounds(true)
      if (isCore) {
        this.configureAzureCore(sprite, spawnY)
      } else {
        sprite.setScale(0.82)
        sprite.setVelocityX(-80)
        sprite.body.setSize(definition.body.width, definition.body.height)
        sprite.body.setOffset(definition.body.offsetX, definition.body.offsetY)
        sprite.play('enemy-guard-walk')
      }

      return {
        sprite,
        point,
        defeated: false,
        direction: -1,
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

  private createCheckpoints(): void {
    const definition = objectDefinitions.checkpoint
    this.checkpointGlows = []
    this.checkpointRings = []
    this.checkpointSprites = activeStage.checkpoints.map((checkpoint, index) => {
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

    for (const rect of activeStage.platforms) {
      this.writePlatformTiles(data, rect.col, rect.row, rect.width, rect.height)
    }

    return data
  }

  private writePlatformTiles(data: number[][], col: PlatformRect['col'], row: PlatformRect['row'], width: PlatformRect['width'], height: PlatformRect['height']): void {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        data[row + y][col + x] = this.getPlatformTileIndex(x, width)
      }
    }
  }

  private getPlatformTileIndex(index: number, width: number): number {
    if (width === 1) {
      return 1
    }

    if (index === 0) {
      return 0
    }

    if (index === width - 1) {
      return 2
    }

    return 1
  }

  private tryAttack(): void {
    if (!this.attackReady || this.isHurting || this.isHomingAttacking) {
      return
    }

    this.attackReady = false
    this.dispatchSfx('armor-step')
    this.nextFootstepAt = this.time.now + 270
    this.isAttacking = true
    this.setPlayerVisualState('attack')
    this.playPlayerAnimation('player-attack')

    const direction = this.player.flipX ? -1 : 1
    const hitbox = this.add.image(this.player.x + direction * 48, this.player.y - 4, 'attack')
    hitbox.setFlipX(direction < 0)
    hitbox.setVisible(false)

    const hitEnemy = this.enemies.find((enemy) => !enemy.defeated && Phaser.Geom.Intersects.RectangleToRectangle(hitbox.getBounds(), enemy.sprite.getBounds()))

    if (hitEnemy) {
      this.defeatEnemy(hitEnemy.sprite)
    }

    this.time.delayedCall(120, () => {
      hitbox.destroy()
    })

    this.time.delayedCall(340, () => {
      this.isAttacking = false
      this.setPlayerVisualState('normal')
    })

    this.time.delayedCall(360, () => {
      this.attackReady = true
    })
  }

  private hurtPlayer(enemy: ArcadeSprite): void {
    if (this.isInvulnerable || this.isHurting || this.isEnemyDefeated(enemy) || this.isHomingAttacking || this.isDead) {
      return
    }

    this.playerHealth -= 1
    this.dispatchSfx('hit')
    this.damageTaken += 1
    this.updateHealthText()

    if (this.playerHealth <= 0) {
      this.defeatPlayer('damage')
      return
    }

    this.isHurting = true
    this.isInvulnerable = true
    this.isAttacking = false
    this.isHomingAttacking = false
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.stopPlayerHurtBlink()
    this.attackReady = false

    const knockbackDirection = this.player.x < enemy.x ? -1 : 1
    this.player.setVelocity(knockbackDirection * 360, -360)
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
      this.isHurting = false
      this.attackReady = true
    })

    this.time.delayedCall(900, () => {
      this.isInvulnerable = false
      this.stopPlayerHurtBlink()
      this.setStatusMessage('status.stabilized')
    })
  }

  private defeatEnemy(sprite: ArcadeSprite): void {
    const enemy = this.enemies.find((candidate) => candidate.sprite === sprite)

    if (!enemy || enemy.defeated) {
      return
    }

    enemy.defeated = true
    this.dispatchSfx('hit')
    if (this.enemyCountsForScore(enemy.point)) {
      this.enemiesDefeated += 1
    }
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
      enemy.sprite.play('enemy-guard-death')
    }
    this.setStatusMessage('status.enemyCleared')

    this.time.delayedCall(520, () => {
      enemy.sprite.setVisible(false)
    })

    if (this.enemyRespawnPolicy(enemy.point) === 'regenerate') {
      this.scheduleEnemyRegeneration(enemy)
    }
  }

  private enemyRespawnPolicy(point: EnemyPoint): 'persistent' | 'regenerate' {
    return point.respawnPolicy ?? (point.type === 'azure-core' ? 'regenerate' : 'persistent')
  }

  private enemyCountsForScore(point: EnemyPoint): boolean {
    return point.countsForScore ?? point.type !== 'azure-core'
  }

  private scheduleEnemyRegeneration(enemy: EnemyRuntime): void {
    const delay = enemy.point.respawnDelayMs ?? DEFAULT_REGENERATE_DELAY_MS
    this.time.delayedCall(delay, () => this.tryRegenerateEnemy(enemy))
  }

  private tryRegenerateEnemy(enemy: EnemyRuntime): void {
    if (this.stageCleared || !enemy.defeated) return

    const spawnY = enemy.point.type === 'azure-core' ? enemy.point.y : groundedCenterY(enemy.point.surfaceY, 'guard')
    const playerDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.point.x, spawnY)
    if (this.isDead || playerDistance < ENEMY_REGENERATE_SAFE_DISTANCE) {
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
      enemy.sprite.play('enemy-guard-walk')
    }
  }

  private updateEnemyPatrol(): void {
    for (const enemy of this.enemies) {
      if (enemy.defeated) {
        continue
      }
      if (enemy.point.type === 'azure-core') {
        continue
      }

      if (enemy.sprite.x < enemy.point.patrolMinX) {
        enemy.direction = 1
      } else if (enemy.sprite.x > enemy.point.patrolMaxX) {
        enemy.direction = -1
      }

      enemy.sprite.setVelocityX(enemy.direction * 80)
      enemy.sprite.setFlipX(enemy.direction > 0)
    }
  }

  private isEnemyDefeated(sprite: ArcadeSprite): boolean {
    return this.enemies.find((enemy) => enemy.sprite === sprite)?.defeated ?? true
  }

  private updateCheckpoint(): void {
    const nextCheckpointIndex = activeStage.checkpoints.findIndex((checkpoint, index) => index > this.activeCheckpointIndex && this.player.x >= checkpoint.x)

    if (nextCheckpointIndex === -1) {
      return
    }

    const checkpoint = activeStage.checkpoints[nextCheckpointIndex]
    this.activeCheckpointIndex = nextCheckpointIndex
    this.dispatchSfx('checkpoint')
    this.respawnPoint = {
      x: checkpoint.spawnX,
      y: groundedCenterY(checkpoint.spawnSurfaceY, 'player'),
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
    this.isHurting = false
    this.isInvulnerable = false
    this.isAttacking = false
    this.isHomingAttacking = false
    this.isDead = false
    this.homingTarget = undefined
    this.attackReady = true
    this.playerHealth = PLAYER_MAX_HEALTH
    this.jumpBufferedUntil = 0
    this.lastGroundedAt = this.time.now
    this.updateHealthText()
    this.stopPlayerHurtBlink()
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y)
    this.player.setVelocity(0, 0)
    this.player.body.enable = true
    this.playPlayerAnimation('player-idle')
    this.setEnemiesFrozen(false)
    this.setStatusMessage('status.restored')
  }

  private defeatPlayer(reason: 'damage' | 'fall'): void {
    if (this.isDead || this.stageCleared) {
      return
    }

    this.isDead = true
    this.dispatchSfx('death')
    if (reason === 'fall') {
      this.falls += 1
    }
    this.isHurting = false
    this.isInvulnerable = true
    this.isAttacking = false
    this.isHomingAttacking = false
    this.attackReady = false
    this.homingTarget = undefined
    this.homingReticle?.setVisible(false)
    this.stopPlayerHurtBlink()
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.player.setAccelerationX(0)
    this.player.setVelocity(0, reason === 'fall' ? 0 : -160)
    this.setEnemiesFrozen(true)
    this.playPlayerAnimation('player-death')
    this.setStatusMessage(reason === 'fall' ? 'status.fall' : 'status.critical')

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
      if (enemy.defeated || !enemy.sprite.active) continue

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
    if (this.stageCleared) {
      return
    }

    this.stageCleared = true
    this.dispatchSfx('goal')
    this.isAttacking = false
    this.isHomingAttacking = false
    this.attackReady = false
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

  private setPlayerVisualState(state: 'normal' | 'attack'): void {
    const scale = state === 'attack' ? PLAYER_ATTACK_SCALE : PLAYER_SCALE
    const offsetY = state === 'attack' ? PLAYER_ATTACK_VISUAL_Y_OFFSET : 0

    if (this.player.scaleX !== scale || this.player.scaleY !== scale) {
      this.player.setScale(scale)
    }

    if (this.playerVisualYOffset !== offsetY) {
      this.player.y += offsetY - this.playerVisualYOffset
      this.playerVisualYOffset = offsetY
    }

    const body = objectDefinitions.player.body
    this.player.body.setSize(body.width, body.height)
    this.player.body.setOffset(body.offsetX, body.offsetY)
  }

  private tryHomingAttack(): boolean {
    if (!this.attackReady || this.isHurting || this.isHomingAttacking || this.isDead) {
      return false
    }

    const target = this.findHomingTarget()

    if (!target) {
      return false
    }

    this.attackReady = false
    this.isAttacking = true
    this.isHomingAttacking = true
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
    return this.enemies
      .filter((enemy) => !enemy.defeated && enemy.sprite.active && enemy.sprite.visible)
      .map((enemy) => ({
        sprite: enemy.sprite,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y),
      }))
      .filter(({ sprite, distance }) => {
        const targetDirection = Math.sign(sprite.x - this.player.x) || facing
        return distance <= HOMING_ATTACK_RANGE && (targetDirection === facing || Math.abs(sprite.x - this.player.x) <= 48)
      })
      .sort((a, b) => a.distance - b.distance)[0]?.sprite
  }

  private updateHomingReticle(grounded: boolean): void {
    if (grounded || this.stageCleared || this.isDead || this.isAttacking || this.isHurting || this.isHomingAttacking) {
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
    if (!this.isHomingAttacking || !this.homingTarget) {
      return
    }

    if (this.isEnemyDefeated(this.homingTarget) || !this.homingTarget.active || !this.homingTarget.visible) {
      this.finishHomingAttack(false)
      return
    }
  }

  private resolveHomingAttack(target: ArcadeSprite): void {
    const startX = this.player.x
    const startY = this.player.y
    const angle = Phaser.Math.Angle.Between(startX, startY, target.x, target.y)
    const contactX = target.x - Math.cos(angle) * HOMING_ATTACK_CONTACT_DISTANCE
    const contactY = target.y - Math.sin(angle) * HOMING_ATTACK_CONTACT_DISTANCE

    this.player.setFlipX(target.x < startX)
    this.emitHomingTrail(startX, startY, contactX, contactY)
    this.collectCoinsAlongLine(startX, startY, contactX, contactY)
    this.player.setPosition(contactX, contactY)
    this.player.setVelocity(0, 0)
    this.dispatchSfx('armor-step')
    this.defeatEnemy(target)
    this.finishHomingAttack(true)
  }

  private finishHomingAttack(hit: boolean): void {
    this.isHomingAttacking = false
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)

    if (hit) {
      this.player.setVelocity(0, HOMING_ATTACK_BOUNCE_Y)
      this.setStatusMessage('status.homingHit')
    } else {
      this.player.setVelocity(0, 0)
      this.setStatusMessage('status.homingMiss')
    }

    this.time.delayedCall(HOMING_ATTACK_RECOVERY_MS, () => {
      this.isAttacking = false
      if (!this.isHurting) {
        this.attackReady = true
      }
    })
  }

  private emitHomingTrail(startX: number, startY: number, endX: number, endY: number): void {
    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY)
    const trailCount = Math.max(2, Math.ceil(distance / HOMING_TRAIL_SPACING))

    for (let index = 0; index < trailCount; index += 1) {
      const progress = index / trailCount
      const trail = this.add.sprite(
        Phaser.Math.Linear(startX, endX, progress),
        Phaser.Math.Linear(startY, endY, progress),
        'player-attack',
        HOMING_ATTACK_FRAME,
      )

      trail.setDepth(this.player.depth - 1)
      trail.setScale(Math.abs(this.player.scaleX), Math.abs(this.player.scaleY))
      trail.setFlipX(this.player.flipX)
      trail.setTint(THEME.cyan)
      trail.setAlpha(0.42 * (1 - progress * 0.35))
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
    const dx = endX - startX
    const dy = endY - startY
    const lengthSquared = dx * dx + dy * dy

    for (const coin of this.coins) {
      if (coin.collected) continue

      const projection = lengthSquared === 0
        ? 0
        : Phaser.Math.Clamp(((coin.sprite.x - startX) * dx + (coin.sprite.y - startY) * dy) / lengthSquared, 0, 1)
      const closestX = startX + dx * projection
      const closestY = startY + dy * projection

      if (Phaser.Math.Distance.Between(closestX, closestY, coin.sprite.x, coin.sprite.y) <= 52) {
        this.collectCoin(coin)
      }
    }
  }

  private setPlayerHomingCollision(enabled: boolean): void {
    this.player.body.allowGravity = enabled
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
    return `HP ${this.playerHealth}/${PLAYER_MAX_HEALTH}`
  }

  private updateCoins(): void {
    if (this.stageCleared || this.isDead) {
      return
    }

    const playerCenter = this.player.getCenter()

    for (const coin of this.coins) {
      if (coin.collected) {
        continue
      }

      const distance = Phaser.Math.Distance.Between(playerCenter.x, playerCenter.y, coin.sprite.x, coin.sprite.y)

      if (distance < 52) {
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
    return `COIN ${String(this.collectedCoins).padStart(3, '0')} / ${this.coinTargetCount}`
  }

  private updateTimer(): void {
    if (!this.timerStarted || this.stageCleared || this.isDead) {
      return
    }

    this.stageTimeMs += this.game.loop.delta
    this.dispatchHudState()
  }

  private getTimerLabel(): string {
    const totalCentiseconds = Math.floor(this.stageTimeMs / 10)
    const minutes = Math.floor(totalCentiseconds / 6000)
    const seconds = Math.floor((totalCentiseconds % 6000) / 100)
    const centiseconds = totalCentiseconds % 100

    return `TIME ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
  }

  private getRank(): string {
    const elapsedSeconds = this.stageTimeMs / 1000
    const { sTime, aTime, bTime, cTime } = activeStage.rankTargets

    let timeScore = 300
    if (elapsedSeconds > sTime && elapsedSeconds <= aTime) timeScore = 240
    else if (elapsedSeconds > aTime && elapsedSeconds <= bTime) timeScore = 170
    else if (elapsedSeconds > bTime && elapsedSeconds <= cTime) timeScore = 100
    else if (elapsedSeconds > cTime) timeScore = Math.max(0, 100 - (elapsedSeconds - cTime) * 3)

    const coinScore = (this.collectedCoins / this.coinTargetCount) * 200
    const enemyTarget = this.scoreEnemyTargetCount
    const enemyScore = enemyTarget > 0 ? (this.enemiesDefeated / enemyTarget) * 150 : 150
    const checkpointScore = ((this.activeCheckpointIndex + 1) / activeStage.checkpoints.length) * 50
    const score = 300 + timeScore + coinScore + enemyScore + checkpointScore - this.damageTaken * 80 - this.falls * 180

    if (score >= 850) return 'S'
    if (score >= 700) return 'A'
    if (score >= 550) return 'B'
    if (score >= 400) return 'C'
    return 'D'
  }

  private setStatusMessage(message: TranslationKey, params: TranslationParams = {}): void {
    this.statusMessage = message
    this.statusParams = params
    this.dispatchHudState()
  }

  private dispatchHudState(overrides: Record<string, unknown> = {}): void {
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
        checkpointsReached: this.activeCheckpointIndex + 1,
        checkpointTarget: activeStage.checkpoints.length,
        rank: this.getRank(),
        time: this.getTimerValue(),
        objective: activeStage.objective,
        statusMessage: this.statusMessage,
        statusParams: this.statusParams,
        playerProgress: Phaser.Math.Clamp(this.player.x / this.worldWidth, 0, 1),
        playerProgressY: Phaser.Math.Clamp(this.player.y / this.worldHeight, 0, 1),
        goalProgress: activeStage.goal.x / this.worldWidth,
        enemyActive: this.enemies.some((enemy) => !enemy.defeated),
        enemyMarkers: this.enemies.filter((enemy) => !enemy.defeated).map((enemy) => ({
          x: enemy.sprite.x / this.worldWidth,
          y: enemy.sprite.y / this.worldHeight,
        })),
        mapPlatforms: activeStage.platforms.map((platform) => ({
          x: platform.col / this.tileColumns,
          y: (platform.row * this.tileSize) / this.worldHeight,
          width: platform.width / this.tileColumns,
        })),
        checkpointMarkers: activeStage.checkpoints.map((checkpoint) => ({
          x: checkpoint.x / this.worldWidth,
          y: checkpoint.surfaceY / this.worldHeight,
        })),
        activeCheckpointIndex: this.activeCheckpointIndex,
        cleared: this.stageCleared,
        ...overrides,
      },
    }))
  }

  private dispatchSfx(name: string): void {
    window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: name }))
  }

  private getInitialStatusMessage(): TranslationKey {
    return activeStage.id === '1-2'
      ? 'status.azureDetected'
      : 'status.initial'
  }

  private updateMovementSfx(grounded: boolean, moving: boolean): void {
    if (grounded && !this.wasGrounded) {
      this.dispatchSfx('armor-step')
      this.nextFootstepAt = this.time.now + 180
    }

    if (grounded && moving && Math.abs(this.player.body.velocity.x) > 80 && this.time.now >= this.nextFootstepAt) {
      this.dispatchSfx('armor-step')
      this.nextFootstepAt = this.time.now + 270
    }

    this.wasGrounded = grounded
  }

  private getTimerValue(): string {
    return this.getTimerLabel().replace('TIME ', '')
  }
}
