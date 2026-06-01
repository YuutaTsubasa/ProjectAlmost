import * as Phaser from 'phaser'

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
type StaticGroup = Phaser.Physics.Arcade.StaticGroup

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
const HOMING_TRAIL_GHOSTS = 5

export class PrototypeScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'left' | 'right' | 'jump' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>
  private player!: ArcadeSprite
  private enemy!: ArcadeSprite
  private platforms!: StaticGroup
  private attackReady = true
  private isAttacking = false
  private isHurting = false
  private isInvulnerable = false
  private isHomingAttacking = false
  private homingTarget?: ArcadeSprite
  private homingReticle?: Phaser.GameObjects.Image
  private enemyDefeated = false
  private enemyDirection = -1
  private playerVisualYOffset = 0
  private objectiveText!: Phaser.GameObjects.Text

  constructor() {
    super('PrototypeScene')
  }

  preload(): void {
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

    this.physics.world.setBounds(0, 0, 1920, 720)
    this.cameras.main.setBounds(0, 0, 1920, 720)

    this.platforms = this.physics.add.staticGroup()
    this.addPlatform(480, 670, 960, 48)
    this.addPlatform(1180, 670, 640, 48)
    this.addPlatform(470, 510, 220, 28)
    this.addPlatform(820, 420, 240, 28)
    this.addPlatform(1230, 530, 280, 28)
    this.addPlatform(1600, 430, 260, 28)

    this.player = this.physics.add.sprite(140, 560, 'player-idle')
    this.player.setCollideWorldBounds(true)
    this.player.setDragX(1500)
    this.player.setMaxVelocity(420, 900)
    this.setPlayerVisualState('normal')
    this.player.play('player-idle')

    this.enemy = this.physics.add.sprite(1260, 470, 'enemy-guard-walk')
    this.enemy.setCollideWorldBounds(true)
    this.enemy.setScale(0.82)
    this.enemy.setVelocityX(-80)
    this.enemy.body.setSize(46, 54)
    this.enemy.body.setOffset(41, 54)
    this.enemy.play('enemy-guard-walk')

    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemy, this.platforms)
    this.physics.add.collider(this.player, this.enemy, () => this.hurtPlayer())

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      attackAlt: Phaser.Input.Keyboard.KeyCodes.Z,
    }) as Record<'left' | 'right' | 'jump' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(180, 120)

    this.add.text(36, 28, 'ProjectRun Prototype', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#f5d78e',
    }).setScrollFactor(0)

    this.objectiveText = this.add.text(36, 66, 'Move: A/D or arrows  Jump: W/Space  Attack: J/Z', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '16px',
      color: '#c8d3dc',
    }).setScrollFactor(0)

    this.add.rectangle(960, 706, 1920, 28, 0x0b1017)
  }

  update(): void {
    const left = this.cursors.left.isDown || this.keys.left.isDown
    const right = this.cursors.right.isDown || this.keys.right.isDown
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.jump)
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt)

    const grounded = this.player.body.blocked.down

    if (left) {
      this.player.setAccelerationX(-1800)
      if (!this.isHurting) {
        this.player.setFlipX(true)
      }
    } else if (right) {
      this.player.setAccelerationX(1800)
      if (!this.isHurting) {
        this.player.setFlipX(false)
      }
    } else {
      this.player.setAccelerationX(0)
    }

    if (jumpPressed && grounded) {
      this.player.setVelocityY(-640)
    }

    this.updatePlayerAnimation(left || right, grounded)

    if (attackPressed) {
      if (!grounded && this.tryHomingAttack()) {
        return
      }

      this.tryAttack()
    }

    this.updateHomingReticle(grounded)
    this.updateHomingAttack()
    this.updateEnemyPatrol()

    if (this.player.y > 760) {
      this.respawnPlayer()
    }
  }

  private createTextures(): void {
    this.makeRectTexture('platform', 64, 32, 0x4d7c0f, 0x1f2937)
    this.makeRectTexture('attack', 56, 36, 0xfacc15, 0xf97316)
    this.makeHomingReticleTexture()
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
    if (this.isAttacking || this.isHurting || this.isHomingAttacking) {
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
    graphics.lineStyle(3, 0x67e8f9, 1)
    graphics.strokeCircle(24, 24, 14)
    graphics.lineBetween(24, 3, 24, 13)
    graphics.lineBetween(24, 35, 24, 45)
    graphics.lineBetween(3, 24, 13, 24)
    graphics.lineBetween(35, 24, 45, 24)
    graphics.lineStyle(1, 0xf8fafc, 0.9)
    graphics.strokeCircle(24, 24, 8)
    graphics.generateTexture('homing-reticle', 48, 48)
    graphics.destroy()
  }

  private addPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.physics.add.staticImage(x, y, 'platform')
    platform.setDisplaySize(width, height)
    platform.refreshBody()
    this.platforms.add(platform)
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
    if (this.isInvulnerable || this.isHurting || this.enemyDefeated || this.isHomingAttacking) {
      return
    }

    this.isHurting = true
    this.isInvulnerable = true
    this.isAttacking = false
    this.isHomingAttacking = false
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.attackReady = false

    const knockbackDirection = this.player.x < this.enemy.x ? -1 : 1
    this.player.setVelocity(knockbackDirection * 360, -360)
    this.playPlayerAnimation('player-hurt')
    this.objectiveText.setText('Hit taken. Invulnerable briefly after knockback.')

    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 7,
    })

    this.time.delayedCall(420, () => {
      this.isHurting = false
      this.attackReady = true
    })

    this.time.delayedCall(900, () => {
      this.isInvulnerable = false
      this.player.setAlpha(1)
      this.objectiveText.setText('Move: A/D or arrows  Jump: W/Space  Attack: J/Z')
    })
  }

  private defeatEnemy(): void {
    this.enemyDefeated = true
    this.enemy.setVelocity(0, 0)
    this.enemy.body.enable = false
    this.enemy.play('enemy-guard-death')
    this.objectiveText.setText('Enemy defeated. Next: add a stage goal.')

    this.time.delayedCall(520, () => {
      this.enemy.setVisible(false)
    })
  }

  private updateEnemyPatrol(): void {
    if (this.enemyDefeated) {
      return
    }

    if (this.enemy.x < 1140) {
      this.enemyDirection = 1
    } else if (this.enemy.x > 1360) {
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
    this.homingTarget = undefined
    this.attackReady = true
    this.player.setAlpha(1)
    this.setPlayerHomingCollision(true)
    this.setPlayerVisualState('normal')
    this.player.setPosition(140, 560)
    this.player.setVelocity(0, 0)
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
    if (!this.attackReady || this.isHurting || this.isHomingAttacking || this.enemyDefeated) {
      return false
    }

    const target = this.findHomingTarget()

    if (!target) {
      return false
    }

    this.attackReady = false
    this.isHomingAttacking = true
    this.homingTarget = target
    this.homingReticle?.setVisible(false)
    this.setPlayerVisualState('normal')
    this.playPlayerAnimation('player-attack')
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
    if (grounded || this.isAttacking || this.isHurting || this.isHomingAttacking) {
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

    this.emitHomingTrail(startX, startY, contactX, contactY)
    this.player.setPosition(contactX, contactY)
    this.player.setVelocity(0, 0)
    this.player.setFlipX(target.x < startX)
    this.defeatEnemy()
    this.finishHomingAttack(true)
  }

  private finishHomingAttack(hit: boolean): void {
    this.isHomingAttacking = false
    this.homingTarget = undefined
    this.setPlayerHomingCollision(true)

    if (hit) {
      this.player.setVelocity(0, HOMING_ATTACK_BOUNCE_Y)
      this.objectiveText.setText('Homing Attack hit. Next: add a stage goal.')
    } else {
      this.player.setVelocity(0, 0)
      this.objectiveText.setText('Move: A/D or arrows  Jump: W/Space  Attack: J/Z')
    }

    this.time.delayedCall(HOMING_ATTACK_RECOVERY_MS, () => {
      if (!this.isHurting) {
        this.attackReady = true
      }
    })
  }

  private emitHomingTrail(startX: number, startY: number, endX: number, endY: number): void {
    for (let index = 1; index <= HOMING_TRAIL_GHOSTS; index += 1) {
      const progress = index / (HOMING_TRAIL_GHOSTS + 1)
      const trail = this.add.sprite(
        Phaser.Math.Linear(startX, endX, progress),
        Phaser.Math.Linear(startY, endY, progress),
        this.player.texture.key,
        this.player.frame.name,
      )

      trail.setDepth(this.player.depth - 1)
      trail.setScale(Math.abs(this.player.scaleX), Math.abs(this.player.scaleY))
      trail.setFlipX(this.player.flipX)
      trail.setTint(0x67e8f9)
      trail.setAlpha(0.3 * (1 - progress * 0.45))
      trail.setBlendMode(Phaser.BlendModes.ADD)

      this.tweens.add({
        targets: trail,
        alpha: 0,
        duration: 180,
        delay: index * 12,
        onComplete: () => trail.destroy(),
      })
    }
  }

  private setPlayerHomingCollision(enabled: boolean): void {
    this.player.body.allowGravity = enabled
    this.player.body.checkCollision.none = !enabled
  }
}
