import { afterEach, describe, expect, it, vi } from 'vitest'
import { enemyActorDefinitions } from '../../domain/gameplay/enemyActor'
import { getGameplayStageMap } from '../../domain/gameplay/gameplayStageMaps'
import { playerActorDefinition } from '../../domain/gameplay/playerActor'
import {
  PLAYER_OUT_OF_BOUNDS_MARGIN,
  playerHurtPresentation,
  playerLifeTiming,
} from '../../domain/gameplay/playerLife'
import { createGameplayRendererConfig } from './createGameplayRenderer'

vi.mock('phaser', () => {
  class Scene {
    constructor(public readonly key?: string) {}
  }

  return {
    default: {
      AUTO: 'AUTO',
      Geom: {
        Intersects: {
          RectangleToRectangle: (
            a: { x: number; y: number; width: number; height: number },
            b: { x: number; y: number; width: number; height: number },
          ) =>
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y,
        },
      },
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH',
      },
      Input: {
        Keyboard: {
          KeyCodes: {
            LEFT: 37,
            RIGHT: 39,
            A: 65,
            D: 68,
            J: 74,
            SPACE: 32,
            UP: 38,
            W: 87,
            Z: 90,
          },
        },
      },
      Scene,
      Game: class Game {
        constructor(public readonly config: unknown) {}
      },
    },
  }
})

type SpritesheetCall = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

type AnimationCreateCall = {
  key: string
  frames: Array<{ key: string; frame: number }>
  frameRate: number
  repeat: number
}

type GenerateTextureCall = {
  key: string
  width: number
  height: number
}

type TweenCall = {
  targets: unknown
  y?: number
  angle?: number
  duration: number
  ease?: string
  yoyo?: boolean
  repeat?: number
  scale?: number
  alpha?: number
}

type OverlapCall = {
  a: unknown
  b: unknown
  callback: () => void
}

type FakePlayerKeys = {
  left: { isDown: boolean }
  right: { isDown: boolean }
  a: { isDown: boolean }
  d: { isDown: boolean }
  j: { isDown: boolean }
  space: { isDown: boolean }
  up: { isDown: boolean }
  w: { isDown: boolean }
  z: { isDown: boolean }
}

type FakeRuntime = ReturnType<typeof createSceneRuntime>

const originalGravityY = playerActorDefinition.gravityY
const originalDepth = playerActorDefinition.depth

afterEach(() => {
  playerActorDefinition.gravityY = originalGravityY
  playerActorDefinition.depth = originalDepth
})

function createFakeTileSprite() {
  const sprite = {
    depth: 0,
    scrollFactor: 0,
    tilePositionX: 0,
    tilePositionY: 0,
    setOrigin: () => sprite,
    setScrollFactor: (value: number) => {
      sprite.scrollFactor = value
      return sprite
    },
    setDepth: (value: number) => {
      sprite.depth = value
      return sprite
    },
    setTilePosition: (x: number, y: number) => {
      sprite.tilePositionX = x
      sprite.tilePositionY = y
      return sprite
    },
  }

  return sprite
}

function createFakeTerrainLayer() {
  const layer = {
    collisionIndexes: [] as number[],
    depth: 0,
    setCollision: (indexes: number[]) => {
      layer.collisionIndexes = indexes
      return layer
    },
    setDepth: (value: number) => {
      layer.depth = value
      return layer
    },
  }

  return layer
}

function createFakeArcadeSprite(input: { x: number; y: number; texture: string }) {
  const sprite = {
    ...input,
    origin: { x: 0, y: 0 },
    scale: 1,
    collideWorldBounds: false,
    dragX: 0,
    velocityX: 0,
    velocityY: 0,
    maxVelocity: { x: 0, y: 0 },
    depth: 0,
    accelerationX: 0,
    flipX: false,
    angle: 0,
    alpha: 1,
    visible: true,
    destroyed: false,
    immovable: false,
    playCalls: [] as Array<{ key: string; ignoreIfPlaying?: boolean }>,
    body: {
      enable: true,
      allowGravity: true,
      blocked: { down: true },
      touching: { down: true },
      size: { width: 0, height: 0 },
      offset: { x: 0, y: 0 },
      setSize: (width: number, height: number) => {
        sprite.body.size = { width, height }
      },
      setOffset: (x: number, y: number) => {
        sprite.body.offset = { x, y }
      },
    },
    setOrigin: (x: number, y: number) => {
      sprite.origin = { x, y }
      return sprite
    },
    setScale: (value: number) => {
      sprite.scale = value
      return sprite
    },
    setCollideWorldBounds: (value: boolean) => {
      sprite.collideWorldBounds = value
      return sprite
    },
    setDragX: (value: number) => {
      sprite.dragX = value
      return sprite
    },
    setVelocityX: (value: number) => {
      sprite.velocityX = value
      return sprite
    },
    setVelocityY: (value: number) => {
      sprite.velocityY = value
      return sprite
    },
    setVelocity: (x: number, y: number) => {
      sprite.velocityX = x
      sprite.velocityY = y
      return sprite
    },
    setMaxVelocity: (x: number, y: number) => {
      sprite.maxVelocity = { x, y }
      return sprite
    },
    setDepth: (value: number) => {
      sprite.depth = value
      return sprite
    },
    setAccelerationX: (value: number) => {
      sprite.accelerationX = value
      return sprite
    },
    setFlipX: (value: boolean) => {
      sprite.flipX = value
      return sprite
    },
    setVisible: (value: boolean) => {
      sprite.visible = value
      return sprite
    },
    setAlpha: (value: number) => {
      sprite.alpha = value
      return sprite
    },
    setAngle: (value: number) => {
      sprite.angle = value
      return sprite
    },
    setImmovable: (value: boolean) => {
      sprite.immovable = value
      return sprite
    },
    play: (key: string, ignoreIfPlaying?: boolean) => {
      sprite.playCalls.push({ key, ignoreIfPlaying })
      return sprite
    },
    destroy: () => {
      sprite.destroyed = true
    },
    getBounds: () => ({
      x: sprite.x - sprite.body.size.width / 2,
      y: sprite.y - sprite.body.size.height / 2,
      width: sprite.body.size.width,
      height: sprite.body.size.height,
    }),
  }

  return sprite
}

function createFakeImage(input: { x: number; y: number; texture: string }) {
  const image = {
    ...input,
    width: 56,
    height: 36,
    visible: true,
    flipX: false,
    destroyed: false,
    setVisible: (value: boolean) => {
      image.visible = value
      return image
    },
    setFlipX: (value: boolean) => {
      image.flipX = value
      return image
    },
    destroy: () => {
      image.destroyed = true
    },
    getBounds: () => ({
      x: image.x - image.width / 2,
      y: image.y - image.height / 2,
      width: image.width,
      height: image.height,
    }),
  }

  return image
}

function createSceneRuntime() {
  const stage = getGameplayStageMap('1-1')

  expect(stage).toBeDefined()
  if (!stage) {
    throw new Error('Missing gameplay stage map 1-1.')
  }

  const config = createGameplayRendererConfig({ parent: {} as HTMLElement, stage })
  const configuredScenes = Array.isArray(config.scene) ? config.scene : [config.scene]
  const scene = configuredScenes[0] as {
    preload: () => void
    create: () => void
    update: () => void
    load: {
      image: (key: string, assetRef: string) => void
      spritesheet: (key: string, assetRef: string, options: { frameWidth: number; frameHeight: number }) => void
    }
    physics: {
      world: { setBounds: (...args: number[]) => void }
      add: {
        sprite: (x: number, y: number, texture: string) => ReturnType<typeof createFakeArcadeSprite>
        collider: (a: unknown, b: unknown) => void
        overlap: (a: unknown, b: unknown, callback: () => void) => void
      }
    }
    cameras: {
      main: {
        scrollX: number
        setBounds: (...args: number[]) => void
        startFollow: (target: unknown, roundPixels?: boolean, lerpX?: number, lerpY?: number) => void
      }
    }
    add: {
      tileSprite: (
        x: number,
        y: number,
        width: number,
        height: number,
        key: string,
      ) => ReturnType<typeof createFakeTileSprite>
      image: (x: number, y: number, texture: string) => ReturnType<typeof createFakeImage>
    }
    make: {
      graphics: () => {
        fillStyle: () => void
        fillCircle: () => void
        lineStyle: () => void
        strokeCircle: () => void
        lineBetween: () => void
        generateTexture: (key: string, width: number, height: number) => void
        destroy: () => void
      }
      tilemap: (options: unknown) => {
        addTilesetImage: (...args: unknown[]) => unknown
        createLayer: (...args: unknown[]) => ReturnType<typeof createFakeTerrainLayer>
      }
    }
    anims: {
      create: (config: unknown) => void
      generateFrameNumbers: (key: string, range: { start: number; end: number }) => Array<{ key: string; frame: number }>
    }
    time: {
      now: number
      delayedCall: (delay: number, callback: () => void) => void
    }
    tweens: {
      add: (config: TweenCall) => void
      killTweensOf: (target: unknown) => void
    }
    input: {
      keyboard: {
        addKeys: (mapping: Record<string, number>) => {
          left: { isDown: boolean }
          right: { isDown: boolean }
          a: { isDown: boolean }
          d: { isDown: boolean }
          j: { isDown: boolean }
          space: { isDown: boolean }
          up: { isDown: boolean }
          w: { isDown: boolean }
          z: { isDown: boolean }
        }
      } | null
    }
  }

  const imageCalls: Array<{ key: string; assetRef: string }> = []
  const spritesheetCalls: SpritesheetCall[] = []
  const animationCreateCalls: AnimationCreateCall[] = []
  const generateTextureCalls: GenerateTextureCall[] = []
  const tweenCalls: TweenCall[] = []
  const images: Array<ReturnType<typeof createFakeImage>> = []
  const delayedCalls: Array<{ delay: number; callback: () => void }> = []
  const killedTweenTargets: unknown[] = []
  const colliderCalls: Array<{ a: unknown; b: unknown }> = []
  const overlapCalls: OverlapCall[] = []
  const sprites: Array<ReturnType<typeof createFakeArcadeSprite>> = []
  const terrainLayer = createFakeTerrainLayer()
  const playerKeys: FakePlayerKeys = {
    left: { isDown: false },
    right: { isDown: false },
    a: { isDown: false },
    d: { isDown: false },
    j: { isDown: false },
    space: { isDown: false },
    up: { isDown: false },
    w: { isDown: false },
    z: { isDown: false },
  }
  let playerSprite: ReturnType<typeof createFakeArcadeSprite> | null = null
  let cameraFollowTarget: unknown = null

  scene.load = {
    image: (key, assetRef) => {
      imageCalls.push({ key, assetRef })
    },
    spritesheet: (key, assetRef, options) => {
      spritesheetCalls.push({
        key,
        assetRef,
        frameWidth: options.frameWidth,
        frameHeight: options.frameHeight,
      })
    },
  }

  scene.physics = {
    world: {
      setBounds: () => {},
    },
    add: {
      sprite: (x, y, texture) => {
        const sprite = createFakeArcadeSprite({ x, y, texture })
        sprites.push(sprite)
        if (texture === playerActorDefinition.sprites.idle.key) {
          playerSprite = sprite
        }
        return sprite
      },
      collider: (a, b) => {
        colliderCalls.push({ a, b })
      },
      overlap: (a, b, callback) => {
        overlapCalls.push({ a, b, callback })
      },
    },
  }

  scene.cameras = {
    main: {
      scrollX: 0,
      setBounds: () => {},
      startFollow: (target) => {
        cameraFollowTarget = target
      },
    },
  }

  scene.add = {
    tileSprite: () => createFakeTileSprite(),
    image: (x, y, texture) => {
      const image = createFakeImage({ x, y, texture })
      images.push(image)
      return image
    },
  }

  scene.make = {
    graphics: () => ({
      fillStyle: () => {},
      fillCircle: () => {},
      lineStyle: () => {},
      strokeCircle: () => {},
      lineBetween: () => {},
      generateTexture: (key, width, height) => {
        generateTextureCalls.push({ key, width, height })
      },
      destroy: () => {},
    }),
    tilemap: () => ({
      addTilesetImage: () => ({}),
      createLayer: () => terrainLayer,
    }),
  }

  scene.anims = {
    create: (config) => {
      animationCreateCalls.push(config as AnimationCreateCall)
    },
    generateFrameNumbers: (key, range) =>
      Array.from({ length: range.end - range.start + 1 }, (_, index) => ({
        key,
        frame: range.start + index,
      })),
  }

  scene.time = {
    now: 0,
    delayedCall: (delay, callback) => {
      delayedCalls.push({ delay, callback })
    },
  }

  scene.tweens = {
    add: (config) => {
      tweenCalls.push(config)
    },
    killTweensOf: (target) => {
      killedTweenTargets.push(target)
    },
  }

  scene.input = {
    keyboard: {
      addKeys: () => playerKeys,
    },
  }

  return {
    stage,
    config,
    scene,
    imageCalls,
    spritesheetCalls,
    animationCreateCalls,
    sprites,
    generateTextureCalls,
    tweenCalls,
    images,
    delayedCalls,
    killedTweenTargets,
    colliderCalls,
    overlapCalls,
    terrainLayer,
    playerKeys,
    runDelayedCalls: (delay: number) => {
      for (const call of delayedCalls.filter((candidate) => candidate.delay === delay)) {
        call.callback()
      }
    },
    triggerEnemyOverlap: (enemy: ReturnType<typeof createFakeArcadeSprite>) => {
      const overlap = overlapCalls.find((candidate) => candidate.a === playerSprite && candidate.b === enemy)
      if (!overlap) {
        throw new Error(`Missing player overlap for enemy texture ${enemy.texture}.`)
      }
      overlap.callback()
    },
    get enemySprites() {
      return sprites.filter((sprite) => sprite !== playerSprite)
    },
    get playerSprite() {
      return playerSprite
    },
    get cameraFollowTarget() {
      return cameraFollowTarget
    },
  }
}

function recoverFromSurvivedHurt(runtime: FakeRuntime): void {
  runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
  runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)
}

describe('createGameplayRendererConfig', () => {
  it('uses the domain player gravity in Phaser config', () => {
    const stage = getGameplayStageMap('1-1')

    expect(stage).toBeDefined()
    if (!stage) return

    playerActorDefinition.gravityY = 1725

    const parent = {} as HTMLElement
    const config = createGameplayRendererConfig({ parent, stage })

    expect(config.parent).toBe(parent)
    expect(config.width).toBe(1280)
    expect(config.height).toBe(720)
    expect(config.backgroundColor).toBe('#05070d')
    expect(config.physics).toEqual({
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1725 },
        debug: false,
      },
    })
    expect(config.scene).toHaveLength(1)
  })

  it('preloads player spritesheets from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    for (const sprite of Object.values(playerActorDefinition.sprites)) {
      expect(runtime.spritesheetCalls).toContainEqual({
        key: sprite.key,
        assetRef: sprite.assetRef,
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight,
      })
    }
  })

  it('preloads Armor Guard spritesheets from the domain enemy definitions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    const guardSprites = Object.values(enemyActorDefinitions['armor-guard'].sprites ?? {})
    for (const sprite of guardSprites) {
      expect(runtime.spritesheetCalls).toContainEqual({
        key: sprite.key,
        assetRef: sprite.assetRef,
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight,
      })
    }
  })

  it('creates the player with domain-owned depth and terrain collision wiring', () => {
    const runtime = createSceneRuntime()

    playerActorDefinition.depth = 17

    runtime.scene.create()

    expect(runtime.playerSprite).not.toBeNull()
    expect(runtime.playerSprite?.depth).toBe(17)
    expect(runtime.playerSprite?.collideWorldBounds).toBe(false)
    expect(runtime.colliderCalls).toContainEqual({ a: runtime.playerSprite, b: runtime.terrainLayer })
    expect(runtime.cameraFollowTarget).toBe(runtime.playerSprite)
  })

  it('registers idle and run animations from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    for (const sprite of Object.values(playerActorDefinition.sprites)) {
      expect(runtime.animationCreateCalls).toContainEqual({
        key: sprite.key,
        frames: Array.from({ length: sprite.frameEnd - sprite.frameStart + 1 }, (_, index) => ({
          key: sprite.key,
          frame: sprite.frameStart + index,
        })),
        frameRate: sprite.frameRate,
        repeat: sprite.repeat,
      })
    }
  })

  it('registers Armor Guard animations from the domain enemy definitions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const guardSprites = Object.values(enemyActorDefinitions['armor-guard'].sprites ?? {})
    for (const sprite of guardSprites) {
      expect(runtime.animationCreateCalls).toContainEqual({
        key: sprite.key,
        frames: Array.from({ length: sprite.frameEnd - sprite.frameStart + 1 }, (_, index) => ({
          key: sprite.key,
          frame: sprite.frameStart + index,
        })),
        frameRate: sprite.frameRate,
        repeat: sprite.repeat,
      })
    }
  })

  it('generates the Azure Core texture from the domain enemy definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.generateTextureCalls).toContainEqual({
      key: enemyActorDefinitions['azure-core'].generatedTexture?.key,
      width: enemyActorDefinitions['azure-core'].generatedTexture?.width,
      height: enemyActorDefinitions['azure-core'].generatedTexture?.height,
    })
  })

  it('preloads and registers the player jump animation from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()
    runtime.scene.create()

    expect(runtime.spritesheetCalls).toContainEqual({
      key: playerActorDefinition.sprites.jump.key,
      assetRef: playerActorDefinition.sprites.jump.assetRef,
      frameWidth: playerActorDefinition.sprites.jump.frameWidth,
      frameHeight: playerActorDefinition.sprites.jump.frameHeight,
    })
    expect(runtime.animationCreateCalls).toContainEqual({
      key: playerActorDefinition.sprites.jump.key,
      frames: [{ key: playerActorDefinition.sprites.jump.key, frame: 1 }],
      frameRate: playerActorDefinition.sprites.jump.frameRate,
      repeat: playerActorDefinition.sprites.jump.repeat,
    })
  })

  it('preloads and registers the player attack animation', () => {
    const runtime = createSceneRuntime()
    const attackSprite = playerActorDefinition.sprites.attack

    runtime.scene.preload()
    runtime.scene.create()

    expect(runtime.spritesheetCalls).toContainEqual({
      key: attackSprite.key,
      assetRef: attackSprite.assetRef,
      frameWidth: attackSprite.frameWidth,
      frameHeight: attackSprite.frameHeight,
    })
    expect(runtime.animationCreateCalls).toContainEqual({
      key: attackSprite.key,
      frames: [
        { key: attackSprite.key, frame: attackSprite.frameStart + 0 },
        { key: attackSprite.key, frame: attackSprite.frameStart + 1 },
        { key: attackSprite.key, frame: attackSprite.frameStart + 2 },
        { key: attackSprite.key, frame: attackSprite.frameStart + 3 },
      ],
      frameRate: attackSprite.frameRate,
      repeat: attackSprite.repeat,
    })
  })

  it('creates Armor Guard with grounded spawn, body setup, animation, velocity, and terrain collider', () => {
    const runtime = createSceneRuntime()
    const guardDefinition = enemyActorDefinitions['armor-guard']

    runtime.scene.create()

    const guard = runtime.enemySprites.find((sprite) => sprite.texture === guardDefinition.sprites?.walk?.key)
    expect(guard).toBeDefined()
    if (!guard) return

    expect(guard.x).toBe(720)
    expect(guard.y).toBe(432)
    expect(guard.origin).toEqual(guardDefinition.origin)
    expect(guard.scale).toBe(guardDefinition.scale)
    expect(guard.depth).toBe(guardDefinition.depth)
    expect(guard.collideWorldBounds).toBe(true)
    expect(guard.body.size).toEqual({
      width: guardDefinition.body.width,
      height: guardDefinition.body.height,
    })
    expect(guard.body.offset).toEqual({
      x: guardDefinition.body.offsetX,
      y: guardDefinition.body.offsetY + guardDefinition.visualLiftY,
    })
    expect(guard.velocityX).toBe(-80)
    expect(guard.playCalls).toContainEqual({
      key: guardDefinition.sprites?.walk?.key,
      ignoreIfPlaying: undefined,
    })
    expect(runtime.colliderCalls).toContainEqual({ a: guard, b: runtime.terrainLayer })
  })

  it('creates Azure Core with authored position, no gravity, immovable body, no terrain collider, and floating tween', () => {
    const runtime = createSceneRuntime()
    const coreDefinition = enemyActorDefinitions['azure-core']

    runtime.scene.create()

    const core = runtime.enemySprites.find((sprite) => sprite.texture === coreDefinition.generatedTexture?.key)
    expect(core).toBeDefined()
    if (!core) return

    expect(core.x).toBe(1760)
    expect(core.y).toBe(320)
    expect(core.origin).toEqual(coreDefinition.origin)
    expect(core.scale).toBe(coreDefinition.scale)
    expect(core.depth).toBe(coreDefinition.depth)
    expect(core.collideWorldBounds).toBe(true)
    expect(core.body.allowGravity).toBe(false)
    expect(core.immovable).toBe(true)
    expect(core.body.size).toEqual({
      width: coreDefinition.body.width,
      height: coreDefinition.body.height,
    })
    expect(core.body.offset).toEqual({
      x: coreDefinition.body.offsetX,
      y: coreDefinition.body.offsetY,
    })
    expect(runtime.colliderCalls).not.toContainEqual({ a: core, b: runtime.terrainLayer })
    expect(runtime.tweenCalls).toContainEqual({
      targets: core,
      y: 306,
      angle: 10,
      duration: 950,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  })

  it('updates Armor Guard patrol direction, velocity, and flip', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    const guard = runtime.enemySprites.find((sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key)
    expect(guard).toBeDefined()
    if (!guard) return

    guard.x = 607
    runtime.scene.update()
    expect(guard.velocityX).toBe(80)
    expect(guard.flipX).toBe(true)

    guard.x = 833
    runtime.scene.update()
    expect(guard.velocityX).toBe(-80)
    expect(guard.flipX).toBe(false)
  })

  it('does not apply patrol velocity updates to Azure Core', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    const core = runtime.enemySprites.find((sprite) => sprite.texture === enemyActorDefinitions['azure-core'].generatedTexture?.key)
    expect(core).toBeDefined()
    if (!core) return

    core.velocityX = 12
    runtime.scene.update()

    expect(core.velocityX).toBe(12)
  })

  it('creates an invisible melee hitbox and keeps attack animation priority on J press', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.images[0]).toMatchObject({
      x: 304,
      y: 432,
      texture: 'attack-hitbox',
      visible: false,
      flipX: false,
    })
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: 'player-attack',
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite?.scale).toBe(playerActorDefinition.sprites.attack.scale)
  })

  it('faces and spawns the melee hitbox left when left and J are pressed on the same frame', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    runtime.playerKeys.left.isDown = true
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.images[0]).toMatchObject({
      x: 208,
      y: 432,
      texture: 'attack-hitbox',
      visible: false,
      flipX: true,
    })
    expect(runtime.playerSprite?.flipX).toBe(true)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: 'player-attack',
      ignoreIfPlaying: true,
    })
  })

  it('destroys the hitbox, ends attack, and restores readiness on prototype delays', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    const hitbox = runtime.images[0]

    runtime.runDelayedCalls(120)
    expect(hitbox.destroyed).toBe(true)

    runtime.runDelayedCalls(340)
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()
    expect(runtime.playerSprite?.playCalls.at(-1)?.key).toBe('player-idle')
    expect(runtime.playerSprite?.scale).toBe(playerActorDefinition.sprites.idle.scale)

    runtime.runDelayedCalls(360)
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    expect(runtime.images).toHaveLength(2)
  })

  it('defeats an enemy that moves into an active melee hitbox before the lifetime ends', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 540
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(guard.body.enable).toBe(true)

    guard.x = 610
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()

    expect(guard.body.enable).toBe(false)
    expect(guard.playCalls.at(-1)).toEqual({ key: 'enemy-guard-death', ignoreIfPlaying: true })
  })

  it('allows only one defeat from a single melee hitbox across frames', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(guard).toBeDefined()
    expect(core).toBeDefined()
    if (!guard || !core || !runtime.playerSprite) return

    runtime.playerSprite.x = 540
    runtime.playerSprite.y = guard.y
    guard.x = 610
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(guard.body.enable).toBe(false)
    expect(guard.playCalls.at(-1)).toEqual({ key: 'enemy-guard-death', ignoreIfPlaying: true })

    runtime.playerKeys.j.isDown = false
    core.x = 610
    core.y = guard.y
    runtime.scene.update()

    expect(core.body.enable).toBe(true)
    expect(
      runtime.tweenCalls.filter(
        (call) => call.targets === core && 'scale' in call && call.scale === 1.8,
      ),
    ).toHaveLength(0)
  })

  it('stops checking a melee hitbox after its delayed destroy runs', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 540
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    runtime.runDelayedCalls(120)
    guard.x = 610
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()

    expect(guard.body.enable).toBe(true)
    expect(guard.playCalls.at(-1)).not.toEqual({ key: 'enemy-guard-death', ignoreIfPlaying: true })
  })

  it('defeats Armor Guard with the guard death presentation and stops patrol updates', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.playerSprite!.x = 672
    runtime.playerSprite!.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(guard.body.enable).toBe(false)
    expect(guard.velocityX).toBe(0)
    expect(guard.playCalls.at(-1)).toEqual({ key: 'enemy-guard-death', ignoreIfPlaying: true })

    guard.x = 999
    runtime.scene.update()
    expect(guard.velocityX).toBe(0)

    runtime.runDelayedCalls(520)
    expect(guard.visible).toBe(false)
  })

  it('defeats Azure Core with a burst tween and ignores defeated enemies on later attacks', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core) return

    runtime.playerSprite!.x = 1712
    runtime.playerSprite!.y = core.y
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()

    expect(core.body.enable).toBe(false)
    expect(runtime.killedTweenTargets).toContain(core)
    expect(runtime.tweenCalls.at(-1)).toMatchObject({
      targets: core,
      scale: 1.8,
      alpha: 0,
      angle: 90,
      duration: 260,
      ease: 'Quad.easeOut',
    })

    runtime.runDelayedCalls(360)
    runtime.playerKeys.z.isDown = false
    runtime.scene.update()
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()
    expect(
      runtime.tweenCalls.filter(
        (call) => call.targets === core && 'scale' in call && call.scale === 1.8,
      ),
    ).toHaveLength(1)
  })

  it('applies survived enemy contact damage with hurt knockback, animation, and blink', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.velocityX).toBe(-360)
    expect(runtime.playerSprite.velocityY).toBe(-360)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite.scale).toBe(playerActorDefinition.sprites.hurt.scale)
    expect(runtime.tweenCalls.at(-1)).toMatchObject({
      targets: runtime.playerSprite,
      alpha: playerHurtPresentation.blinkAlpha,
      duration: playerHurtPresentation.blinkDurationMs,
      yoyo: playerHurtPresentation.blinkYoyo,
      repeat: playerHurtPresentation.blinkRepeat,
    })
  })

  it('applies enemy contact damage from Azure Core overlaps', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return

    runtime.playerSprite.x = 1810
    core.x = 1760
    runtime.triggerEnemyOverlap(core)

    expect(runtime.playerSprite.velocityX).toBe(360)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('ignores repeated enemy contact while invulnerable and restores attack after hurt recovery', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)
    runtime.playerSprite.velocityX = 0
    runtime.playerSprite.velocityY = 0
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite && call.alpha === 0.35)).toHaveLength(1)

    runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.images[0]).toMatchObject({ texture: 'attack-hitbox' })
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.attack.key,
      ignoreIfPlaying: true,
    })
  })

  it('restores player alpha after invulnerability recovery', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.triggerEnemyOverlap(guard)
    runtime.playerSprite.alpha = 0.35
    runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)

    expect(runtime.playerSprite.alpha).toBe(1)
  })

  it('ignores defeated enemy contact damage', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 672
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    expect(guard.body.enable).toBe(false)

    runtime.playerSprite.velocityX = 0
    runtime.playerSprite.velocityY = 0
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.playCalls.at(-1)).not.toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('clears an active melee hitbox when enemy contact hurts the player', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(guard).toBeDefined()
    expect(core).toBeDefined()
    if (!guard || !core || !runtime.playerSprite) return

    runtime.playerSprite.x = 540
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    const hitbox = runtime.images[0]
    expect(hitbox.destroyed).toBe(false)

    runtime.triggerEnemyOverlap(core)
    guard.x = 610
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()

    expect(hitbox.destroyed).toBe(true)
    expect(guard.body.enable).toBe(true)
  })

  it('plays death on the third enemy hit and respawns at the stage spawn with full health', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(-160)
    expect(runtime.playerSprite.accelerationX).toBe(0)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.death.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite.scale).toBe(playerActorDefinition.sprites.death.scale)

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)

    expect(runtime.playerSprite.x).toBe(runtime.stage.player.spawn.x)
    expect(runtime.playerSprite.y).toBe(436)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.alpha).toBe(1)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })

    runtime.triggerEnemyOverlap(guard)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('prevents movement, attack, and repeated contact damage while dead before respawn', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)

    runtime.playerSprite.velocityX = 0
    runtime.playerSprite.velocityY = 0
    runtime.playerKeys.right.isDown = true
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.images).toHaveLength(0)
    expect(runtime.playerSprite.accelerationX).toBe(0)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.playCalls.filter((call) => call.key === playerActorDefinition.sprites.death.key)).toHaveLength(1)
  })

  it('kills and respawns the player after leaving any side of the world bounds', () => {
    const cases = [
      { x: -PLAYER_OUT_OF_BOUNDS_MARGIN - 1, y: 500 },
      { x: 9600 + PLAYER_OUT_OF_BOUNDS_MARGIN + 1, y: 500 },
      { x: 500, y: -PLAYER_OUT_OF_BOUNDS_MARGIN - 1 },
      { x: 500, y: 1080 + PLAYER_OUT_OF_BOUNDS_MARGIN + 1 },
    ]

    for (const position of cases) {
      const runtime = createSceneRuntime()
      runtime.scene.create()
      expect(runtime.playerSprite).toBeDefined()
      if (!runtime.playerSprite) return

      runtime.playerSprite.x = position.x
      runtime.playerSprite.y = position.y
      runtime.scene.update()

      expect(runtime.playerSprite.velocityX).toBe(0)
      expect(runtime.playerSprite.velocityY).toBe(0)
      expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
        key: playerActorDefinition.sprites.death.key,
        ignoreIfPlaying: true,
      })

      runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)

      expect(runtime.playerSprite.x).toBe(runtime.stage.player.spawn.x)
      expect(runtime.playerSprite.y).toBe(436)
      expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
        key: playerActorDefinition.sprites.idle.key,
        ignoreIfPlaying: true,
      })
    }
  })

  it('updates left movement with drag, negative acceleration, flip, and run animation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.left.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.dragX).toBe(playerActorDefinition.movement.idleDragX)
    expect(runtime.playerSprite?.accelerationX).toBe(-playerActorDefinition.movement.groundAcceleration)
    expect(runtime.playerSprite?.flipX).toBe(true)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.run.key,
      ignoreIfPlaying: true,
    })
  })

  it('updates right movement with drag, positive acceleration, flip, and run animation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.right.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.dragX).toBe(playerActorDefinition.movement.idleDragX)
    expect(runtime.playerSprite?.accelerationX).toBe(playerActorDefinition.movement.groundAcceleration)
    expect(runtime.playerSprite?.flipX).toBe(false)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.run.key,
      ignoreIfPlaying: true,
    })
  })

  it('updates A-key movement as left movement', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.a.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.accelerationX).toBe(-playerActorDefinition.movement.groundAcceleration)
    expect(runtime.playerSprite?.flipX).toBe(true)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.run.key,
      ignoreIfPlaying: true,
    })
  })

  it('updates D-key movement as right movement', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.d.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.accelerationX).toBe(playerActorDefinition.movement.groundAcceleration)
    expect(runtime.playerSprite?.flipX).toBe(false)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.run.key,
      ignoreIfPlaying: true,
    })
  })

  it('keeps left priority when both horizontal directions are active', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.left.isDown = true
    runtime.playerKeys.right.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.accelerationX).toBe(-playerActorDefinition.movement.groundAcceleration)
    expect(runtime.playerSprite?.flipX).toBe(true)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.run.key,
      ignoreIfPlaying: true,
    })
  })

  it('updates idle movement with drag, zero acceleration, and idle animation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    runtime.scene.update()

    expect(runtime.playerSprite?.dragX).toBe(playerActorDefinition.movement.idleDragX)
    expect(runtime.playerSprite?.accelerationX).toBe(0)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('applies jump velocity for a grounded Space press', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.space.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  })

  it('plays the jump animation on the grounded jump launch frame', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.space.isDown = true

    runtime.scene.update()

    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.jump.key,
      ignoreIfPlaying: true,
    })
  })

  it('maps ArrowUp and W to jump press rising edges', () => {
    const upRuntime = createSceneRuntime()
    upRuntime.scene.create()
    upRuntime.playerKeys.up.isDown = true
    upRuntime.scene.update()

    const wRuntime = createSceneRuntime()
    wRuntime.scene.create()
    wRuntime.playerKeys.w.isDown = true
    wRuntime.scene.update()

    expect(upRuntime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
    expect(wRuntime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  })

  it('allows one air jump and rejects a third jump until landing', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerKeys.space.isDown = true
    runtime.scene.update()
    expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)

    runtime.playerSprite!.velocityY = 0
    runtime.playerSprite!.body.blocked.down = false
    runtime.playerSprite!.body.touching.down = false
    runtime.playerKeys.space.isDown = false
    runtime.scene.update()

    runtime.playerKeys.space.isDown = true
    runtime.scene.time.now += playerActorDefinition.jump.coyoteTimeMs + 1
    runtime.scene.update()
    expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)

    runtime.playerSprite!.velocityY = 0
    runtime.playerKeys.space.isDown = false
    runtime.scene.update()
    runtime.playerKeys.space.isDown = true
    runtime.scene.update()
    expect(runtime.playerSprite?.velocityY).toBe(0)

    runtime.playerSprite!.body.blocked.down = true
    runtime.playerSprite!.body.touching.down = true
    runtime.playerKeys.space.isDown = false
    runtime.scene.update()
    runtime.playerKeys.space.isDown = true
    runtime.scene.update()
    expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  })

  it('uses jump animation while airborne and idle animation when grounded without movement', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.playerSprite!.body.blocked.down = false
    runtime.playerSprite!.body.touching.down = false
    runtime.scene.update()
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.jump.key,
      ignoreIfPlaying: true,
    })

    runtime.playerSprite!.body.blocked.down = true
    runtime.playerSprite!.body.touching.down = true
    runtime.scene.update()
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })
})
