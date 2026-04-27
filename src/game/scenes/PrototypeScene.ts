import * as Phaser from 'phaser'

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
type StaticGroup = Phaser.Physics.Arcade.StaticGroup

export class PrototypeScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'left' | 'right' | 'jump' | 'attack' | 'attackAlt', Phaser.Input.Keyboard.Key>
  private player!: ArcadeSprite
  private enemy!: ArcadeSprite
  private platforms!: StaticGroup
  private attackReady = true
  private enemyDirection = -1
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
    this.player.setScale(0.78)
    this.player.body.setSize(34, 72)
    this.player.body.setOffset(47, 42)
    this.player.play('player-idle')

    this.enemy = this.physics.add.sprite(1260, 470, 'enemy')
    this.enemy.setCollideWorldBounds(true)
    this.enemy.setVelocityX(-80)
    this.enemy.body.setSize(38, 30)

    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemy, this.platforms)
    this.physics.add.collider(this.player, this.enemy, () => this.respawnPlayer())

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

    if (left) {
      this.player.setAccelerationX(-1800)
      this.player.setFlipX(true)
      this.playPlayerAnimation('player-run')
    } else if (right) {
      this.player.setAccelerationX(1800)
      this.player.setFlipX(false)
      this.playPlayerAnimation('player-run')
    } else {
      this.player.setAccelerationX(0)
      this.playPlayerAnimation('player-idle')
    }

    if (jumpPressed && this.player.body.blocked.down) {
      this.player.setVelocityY(-640)
    }

    if (attackPressed) {
      this.tryAttack()
    }

    this.updateEnemyPatrol()

    if (this.player.y > 760) {
      this.respawnPlayer()
    }
  }

  private createTextures(): void {
    this.makeRectTexture('enemy', 48, 34, 0xf97316, 0x9a3412)
    this.makeRectTexture('platform', 64, 32, 0x4d7c0f, 0x1f2937)
    this.makeRectTexture('attack', 56, 36, 0xfacc15, 0xf97316)
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
  }

  private playPlayerAnimation(key: string): void {
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

  private addPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.physics.add.staticImage(x, y, 'platform')
    platform.setDisplaySize(width, height)
    platform.refreshBody()
    this.platforms.add(platform)
  }

  private tryAttack(): void {
    if (!this.attackReady) {
      return
    }

    this.attackReady = false

    const direction = this.player.flipX ? -1 : 1
    const hitbox = this.add.image(this.player.x + direction * 48, this.player.y - 4, 'attack')
    hitbox.setFlipX(direction < 0)
    hitbox.setAlpha(0.85)

    if (this.enemy.active && Phaser.Geom.Intersects.RectangleToRectangle(hitbox.getBounds(), this.enemy.getBounds())) {
      this.enemy.disableBody(true, true)
      this.objectiveText.setText('Enemy defeated. Next: replace placeholders with generated sprites.')
    }

    this.time.delayedCall(120, () => {
      hitbox.destroy()
    })

    this.time.delayedCall(360, () => {
      this.attackReady = true
    })
  }

  private updateEnemyPatrol(): void {
    if (!this.enemy.active) {
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
    this.player.setPosition(140, 560)
    this.player.setVelocity(0, 0)
  }
}
