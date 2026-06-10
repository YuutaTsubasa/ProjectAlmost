import * as Phaser from 'phaser'
import { type CoinPoint, type PlatformRect, prototypeStage } from '../stages/prototypeStage'

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
type TilemapLayer = Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer
type CoinRuntime = {
  sprite: Phaser.GameObjects.Image
  point: CoinPoint
  collected: boolean
}

const { width: WORLD_WIDTH, height: WORLD_HEIGHT, tileSize: TILE_SIZE } = prototypeStage.world
const TILE_COLUMNS = WORLD_WIDTH / TILE_SIZE
const TILE_ROWS = Math.ceil(WORLD_HEIGHT / TILE_SIZE)
const SOLID_TILE_INDEXES = [0, 1, 2]
const PLAYER_MAX_HEALTH = 3
const COIN_TARGET_COUNT = 100
const FALL_DEFEAT_Y = WORLD_HEIGHT + 80
const CAMERA_ZOOM = 1.25
const PLAYER_SCALE = 0.78
const PLAYER_ATTACK_SCALE = 0.98
const PLAYER_BODY_SIZE = { width: 34, height: 72 }
const PLAYER_BODY_OFFSET = { x: 47, y: 42 }
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
const THEME = {
  deepBlue: 0x17324f,
  royalBlue: 0x2f6fb4,
  skyBlue: 0x86cdf8,
  paleBlue: 0xdaf3ff,
  cyan: 0x33b5ff,
  marbleShade: 0xd7e8f4,
  gold: 0xd7a84f,
  white: 0xf8fdff,
}

export class PrototypeScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'left' | 'right' | 'jump' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>
  private player!: ArcadeSprite
  private enemy!: ArcadeSprite
  private goal!: Phaser.Types.Physics.Arcade.ImageWithStaticBody
  private goalLabel!: Phaser.GameObjects.Text
  private terrainLayer!: TilemapLayer
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
  private enemyDefeated = false
  private enemyDirection = -1
  private playerVisualYOffset = 0
  private coins: CoinRuntime[] = []
  private collectedCoins = 0
  private stageTimeMs = 0
  private timerStarted = false
  private objectiveMessage = 'Move: A/D or arrows  Jump: W/Space  Attack: J/Z  Homing: jump + attack'

  constructor() {
    super('PrototypeScene')
  }

  preload(): void {
    this.load.image('white-palace-sky', '/assets/maps/white_palace_sky.png')
    this.load.image('white-palace-far-bg', '/assets/maps/white_palace_far_bg.png')
    this.load.image('white-palace-mid-bg', '/assets/maps/white_palace_mid_bg.png')
    this.load.image('palace-tiles', '/assets/tiles/white_palace_platform_tiles.png')
    this.load.spritesheet('player-idle', '/assets/sprites/player_idle/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-run', '/assets/sprites/player_run/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-attack', '/assets/sprites/player_attack/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-jump', '/assets/sprites/player_jump/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-hurt', '/assets/sprites/player_hurt/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('player-death', '/assets/sprites/player_death/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('enemy-guard-walk', '/assets/sprites/enemy_guard_walk/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet('enemy-guard-death', '/assets/sprites/enemy_guard_death/sheet-transparent.png', {
      frameWidth: 128,
      frameHeight: 128,
    })
  }

  create(): void {
    this.createTextures()
    this.createAnimations()

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.physics.world.setBoundsCollision(true, true, true, false)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.createParallaxBackground()
    this.terrainLayer = this.createTerrainLayer()
    this.createCoins()

    this.player = this.physics.add.sprite(prototypeStage.playerSpawn.x, prototypeStage.playerSpawn.y, 'player-idle')
    this.player.setCollideWorldBounds(true)
    this.player.setDragX(1500)
    this.player.setMaxVelocity(420, 900)
    this.setPlayerVisualState('normal')
    this.player.play('player-idle')

    this.enemy = this.physics.add.sprite(prototypeStage.enemy.x, prototypeStage.enemy.y, 'enemy-guard-walk')
    this.enemy.setCollideWorldBounds(true)
    this.enemy.setScale(0.82)
    this.enemy.setVelocityX(-80)
    this.enemy.body.setSize(46, 54)
    this.enemy.body.setOffset(41, 54)
    this.enemy.play('enemy-guard-walk')

    this.goal = this.physics.add.staticImage(prototypeStage.goal.x, prototypeStage.goal.y, 'stage-goal')
    this.goal.setSize(42, 88)
    this.goal.setOffset(11, 8)
    this.goal.setDepth(8)
    this.goalLabel = this.add.text(prototypeStage.goal.x + 17, prototypeStage.goal.y - 27, 'GOAL', {
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '11px',
      fontStyle: '700',
      color: '#17324f',
    })
    this.goalLabel.setOrigin(0.5)
    this.goalLabel.setDepth(9)

    this.physics.add.collider(this.player, this.terrainLayer)
    this.physics.add.collider(this.enemy, this.terrainLayer)
    this.physics.add.collider(this.player, this.enemy, () => this.hurtPlayer())
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
  }

  update(): void {
    const left = this.cursors.left.isDown || this.keys.left.isDown
    const right = this.cursors.right.isDown || this.keys.right.isDown
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.jump)
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt)

    const grounded = this.player.body.blocked.down

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
      this.player.setAccelerationX(-1800)
      if (!this.isHurting) {
        this.player.setFlipX(true)
      }
    } else if (right) {
      this.timerStarted = true
      this.player.setAccelerationX(1800)
      if (!this.isHurting) {
        this.player.setFlipX(false)
      }
    } else {
      this.player.setAccelerationX(0)
    }

    if (jumpPressed && grounded) {
      this.timerStarted = true
      this.player.setVelocityY(-640)
    }

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
    this.updateCoins()
    this.updateTimer()

    if (this.player.y > FALL_DEFEAT_Y) {
      this.defeatPlayer('fall')
    }
  }

  private createTextures(): void {
    this.makeRectTexture('attack', 56, 36, THEME.cyan, THEME.royalBlue)
    this.makeHomingReticleTexture()
    this.makeStageGoalTexture()
    this.makeCoinTexture()
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

  private makeStageGoalTexture(): void {
    const graphics = this.make.graphics()
    graphics.fillStyle(THEME.deepBlue)
    graphics.fillRoundedRect(18, 10, 10, 82, 4)
    graphics.fillStyle(THEME.white)
    graphics.fillTriangle(28, 12, 28, 52, 66, 32)
    graphics.fillStyle(THEME.skyBlue)
    graphics.fillTriangle(28, 52, 28, 72, 54, 58)
    graphics.lineStyle(2, THEME.royalBlue, 0.9)
    graphics.strokeTriangle(28, 12, 28, 52, 66, 32)
    graphics.strokeTriangle(28, 52, 28, 72, 54, 58)
    graphics.fillStyle(THEME.marbleShade)
    graphics.fillRoundedRect(9, 86, 28, 8, 3)
    graphics.fillStyle(THEME.gold)
    graphics.fillCircle(23, 10, 5)
    graphics.generateTexture('stage-goal', 72, 96)
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

  private createParallaxBackground(): void {
    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'white-palace-sky')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setScrollFactor(0)
      .setDepth(-30)

    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'white-palace-far-bg')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setScrollFactor(0.08)
      .setDepth(-20)

    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'white-palace-mid-bg')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setScrollFactor(0.18)
      .setDepth(-10)
  }

  private createTerrainLayer(): TilemapLayer {
    const map = this.make.tilemap({
      data: this.buildTerrainData(),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    })
    const tileset = map.addTilesetImage('palace-tiles', undefined, TILE_SIZE, TILE_SIZE, 0, 0)
    const layer = map.createLayer(0, tileset!, 0, 0)

    if (!layer) {
      throw new Error('Unable to create terrain tilemap layer.')
    }

    layer.setCollision(SOLID_TILE_INDEXES)
    layer.setDepth(5)

    return layer
  }

  private createCoins(): void {
    this.coins = prototypeStage.coins.map((point, index) => {
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

  private buildTerrainData(): number[][] {
    const data = Array.from({ length: TILE_ROWS }, () => Array.from({ length: TILE_COLUMNS }, () => -1))

    for (const rect of prototypeStage.platforms) {
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
    this.isAttacking = true
    this.setPlayerVisualState('attack')
    this.playPlayerAnimation('player-attack')

    const direction = this.player.flipX ? -1 : 1
    const hitbox = this.add.image(this.player.x + direction * 48, this.player.y - 4, 'attack')
    hitbox.setFlipX(direction < 0)
    hitbox.setAlpha(0.35)

    if (!this.enemyDefeated && Phaser.Geom.Intersects.RectangleToRectangle(hitbox.getBounds(), this.enemy.getBounds())) {
      this.defeatEnemy()
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

  private hurtPlayer(): void {
    if (this.isInvulnerable || this.isHurting || this.enemyDefeated || this.isHomingAttacking || this.isDead) {
      return
    }

    this.playerHealth -= 1
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

    const knockbackDirection = this.player.x < this.enemy.x ? -1 : 1
    this.player.setVelocity(knockbackDirection * 360, -360)
    this.playPlayerAnimation('player-hurt')
    this.setObjectiveText(`Hit taken. Health: ${this.playerHealth}/${PLAYER_MAX_HEALTH}.`)

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
      this.setObjectiveText('Move: A/D or arrows  Jump: W/Space  Attack: J/Z  Homing: jump + attack')
    })
  }

  private defeatEnemy(): void {
    this.enemyDefeated = true
    this.homingReticle?.setVisible(false)
    this.enemy.setVelocity(0, 0)
    this.enemy.body.enable = false
    this.enemy.play('enemy-guard-death')
    this.setObjectiveText('Enemy defeated. Reach the GOAL flag.')

    this.time.delayedCall(520, () => {
      this.enemy.setVisible(false)
    })
  }

  private updateEnemyPatrol(): void {
    if (this.enemyDefeated) {
      return
    }

    if (this.enemy.x < prototypeStage.enemy.patrolMinX) {
      this.enemyDirection = 1
    } else if (this.enemy.x > prototypeStage.enemy.patrolMaxX) {
      this.enemyDirection = -1
    }

    this.enemy.setVelocityX(this.enemyDirection * 80)
    this.enemy.setFlipX(this.enemyDirection > 0)
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
    this.updateHealthText()
    this.stopPlayerHurtBlink()
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.player.setPosition(prototypeStage.playerSpawn.x, prototypeStage.playerSpawn.y)
    this.player.setVelocity(0, 0)
    this.player.body.enable = true
    this.playPlayerAnimation('player-idle')
    this.setObjectiveText('Move: A/D or arrows  Jump: W/Space  Attack: J/Z  Homing: jump + attack')
  }

  private defeatPlayer(reason: 'damage' | 'fall'): void {
    if (this.isDead || this.stageCleared) {
      return
    }

    this.isDead = true
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
    this.playPlayerAnimation('player-death')
    this.setObjectiveText(reason === 'fall' ? 'Fell out. Respawning.' : 'Player defeated. Respawning.')

    this.time.delayedCall(1100, () => {
      this.respawnPlayer()
    })
  }

  private completeStage(): void {
    if (this.stageCleared) {
      return
    }

    this.stageCleared = true
    this.isAttacking = false
    this.isHomingAttacking = false
    this.attackReady = false
    this.homingTarget = undefined
    this.homingReticle?.setVisible(false)
    this.stopPlayerHurtBlink()
    this.player.setVelocity(0, 0)
    this.player.setAccelerationX(0)
    this.enemy.setVelocityX(0)
    this.goal.setTint(THEME.cyan)
    this.goalLabel.setColor('#f8fafc')
    this.setObjectiveText(`Stage Clear. ${this.getCoinLabel()}  ${this.getTimerLabel()}`)
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

    this.player.body.setSize(PLAYER_BODY_SIZE.width, PLAYER_BODY_SIZE.height)
    this.player.body.setOffset(PLAYER_BODY_OFFSET.x, PLAYER_BODY_OFFSET.y)
  }

  private tryHomingAttack(): boolean {
    if (!this.attackReady || this.isHurting || this.isHomingAttacking || this.enemyDefeated || this.isDead) {
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
    if (this.enemyDefeated || !this.enemy.active || !this.enemy.visible) {
      return undefined
    }

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y)

    if (distance > HOMING_ATTACK_RANGE) {
      return undefined
    }

    const facing = this.player.flipX ? -1 : 1
    const targetDirection = Math.sign(this.enemy.x - this.player.x) || facing

    if (targetDirection !== facing && Math.abs(this.enemy.x - this.player.x) > 48) {
      return undefined
    }

    return this.enemy
  }

  private updateHomingReticle(grounded: boolean): void {
    if (grounded || this.stageCleared || this.isDead || this.isAttacking || this.isHurting || this.isHomingAttacking || this.enemyDefeated) {
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

    if (this.enemyDefeated || !this.homingTarget.active || !this.homingTarget.visible) {
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
    this.player.setPosition(contactX, contactY)
    this.player.setVelocity(0, 0)
    this.defeatEnemy()
    this.finishHomingAttack(true)
  }

  private finishHomingAttack(hit: boolean): void {
    this.isHomingAttacking = false
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)

    if (hit) {
      this.player.setVelocity(0, HOMING_ATTACK_BOUNCE_Y)
      this.setObjectiveText('Homing Attack hit. Reach the GOAL flag.')
    } else {
      this.player.setVelocity(0, 0)
      this.setObjectiveText('Move: A/D or arrows  Jump: W/Space  Attack: J/Z  Homing: jump + attack')
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
    return `COIN ${String(this.collectedCoins).padStart(3, '0')} / ${COIN_TARGET_COUNT}`
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

  private setObjectiveText(message: string): void {
    this.objectiveMessage = message
    this.dispatchHudState()
  }

  private dispatchHudState(overrides: Record<string, unknown> = {}): void {
    window.dispatchEvent(new CustomEvent('projectrun:hud', {
      detail: {
        hp: this.playerHealth,
        hpMax: PLAYER_MAX_HEALTH,
        coins: this.collectedCoins,
        coinTarget: COIN_TARGET_COUNT,
        time: this.getTimerValue(),
        objective: this.objectiveMessage,
        cleared: this.stageCleared,
        ...overrides,
      },
    }))
  }

  private getTimerValue(): string {
    return this.getTimerLabel().replace('TIME ', '')
  }
}
