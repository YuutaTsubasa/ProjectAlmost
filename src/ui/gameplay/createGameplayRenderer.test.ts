import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  enemyActorDefinitions,
  enemyRegenerationPresentation,
  getScoreEnemyTargetCount,
} from '../../domain/gameplay/enemyActor'
import { checkpointActorDefinition, getCheckpointBottomY } from '../../domain/gameplay/checkpointActor'
import { bossPriestessSpriteAssets, getBossPatternDelayMs } from '../../domain/gameplay/bossBattle'
import { getGoalBottomY, goalActorDefinition } from '../../domain/gameplay/goalActor'
import {
  getGroundedHazardCenterY,
  getHazardBodyPresentation,
  getHazardFrameIndex,
  hazardActorDefinitions,
} from '../../domain/gameplay/hazardActor'
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import { getGameplayStageMap } from '../../domain/gameplay/gameplayStageMaps'
import { playerActorDefinition } from '../../domain/gameplay/playerActor'
import {
  PLAYER_OUT_OF_BOUNDS_MARGIN,
  playerDeathTransitionPresentation,
  playerHurtPresentation,
  playerLifeTiming,
} from '../../domain/gameplay/playerLife'
import {
  createInitialGameplayHudState,
  formatGameplayHudTime,
  getHudEnemyMarkers,
  getHudPositionProgress,
  type GameplayHudPatch,
} from '../../domain/gameplay/gameplayHud'
import {
  meleeAttackTiming,
} from '../../domain/gameplay/playerAttack'
import {
  homingAttackPresentation,
  homingAttackTiming,
} from '../../domain/gameplay/playerHomingAttack'
import { calculateStageRank } from '../../domain/gameplay/stageResult'
import { createGameplayRendererConfig } from './createGameplayRenderer'
import rendererSource from './createGameplayRenderer.ts?raw'
import Phaser from 'phaser'

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
            DOWN: 40,
            A: 65,
            D: 68,
            S: 83,
            J: 74,
            SPACE: 32,
            UP: 38,
            W: 87,
            Z: 90,
          },
        },
      },
      Cameras: {
        Scene2D: {
          Events: {
            FADE_OUT_COMPLETE: 'fadeoutcomplete',
          },
        },
      },
      Math: {
        Angle: {
          Between: (x1: number, y1: number, x2: number, y2: number) =>
            Math.atan2(y2 - y1, x2 - x1),
        },
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) =>
            Math.hypot(x2 - x1, y2 - y1),
        },
      },
      BlendModes: {
        ADD: 'ADD',
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
  yoyo?: boolean
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
  scaleX?: number | { from: number; to: number }
  scaleY?: number | { from: number; to: number }
  alpha?: number
  delay?: number
  onComplete?: () => void
}

type OverlapCall = {
  a: unknown
  b: unknown
  callback: () => void
}

type CameraFadeCall = {
  duration: number
  red: number
  green: number
  blue: number
}

type TimerEventCall = {
  delay: number
  loop: boolean
  callback: () => void
  active: boolean
  nextFireAt: number
}

type DelayedCall = {
  delay: number
  callback: () => void
  scheduledAt: number
  fired: boolean
}

type FakePlayerKeys = {
  left: { isDown: boolean }
  right: { isDown: boolean }
  down: { isDown: boolean }
  a: { isDown: boolean }
  d: { isDown: boolean }
  s: { isDown: boolean }
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

function createEnemyFixtureStage(): GameplayStageMap {
  return {
    id: '1-1',
    theme: 'white-palace',
    world: {
      width: 9_600,
      height: 1_080,
      tileSize: 64,
    },
    rankTargets: {
      sTime: 30,
      aTime: 42,
      bTime: 58,
      cTime: 78,
    },
    backgroundLayers: [
      {
        id: 'sky',
        assetRef: '/assets/maps/white_palace_sky.webp',
        width: 9_600,
        height: 1_080,
        depth: -30,
        scrollFactor: 0,
        parallaxFactor: 0.12,
      },
      {
        id: 'far',
        assetRef: '/assets/maps/white_palace_far_bg.webp',
        width: 9_600,
        height: 1_080,
        depth: -20,
        scrollFactor: 0.18,
        parallaxFactor: 0.28,
      },
      {
        id: 'mid',
        assetRef: '/assets/maps/white_palace_mid_bg_loop.webp',
        width: 9_600,
        height: 1_080,
        depth: -10,
        scrollFactor: 0.38,
        parallaxFactor: 0.52,
      },
    ],
    player: {
      actorId: 'player',
      spawn: {
        x: 256,
        surfaceY: 512,
      },
    },
    enemies: [
      {
        id: 'test-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 512,
        patrolMinX: 608,
        patrolMaxX: 832,
      },
      {
        id: 'test-core',
        type: 'azure-core',
        x: 1_760,
        y: 320,
        patrolMinX: 1_760,
        patrolMaxX: 1_760,
      },
    ],
    movingPlatforms: [],
    coins: [
      {
        id: 'test-first-coin',
        x: 420,
        y: 456,
      },
      {
        id: 'test-second-coin',
        x: 560,
        y: 456,
      },
      {
        id: 'test-homing-off-line-coin',
        x: 1_504,
        y: 256,
      },
      {
        id: 'test-homing-line-coin',
        x: 1_680,
        y: 320,
      },
    ],
    hazards: [],
    checkpoints: [
      {
        id: 'combat-gate',
        x: 2_540,
        surfaceY: 512,
        spawnX: 2_600,
        spawnSurfaceY: 512,
      },
      {
        id: 'final-ascent',
        x: 4_320,
        surfaceY: 512,
        spawnX: 4_380,
        spawnSurfaceY: 512,
      },
      {
        id: 'final-trial',
        x: 7_300,
        surfaceY: 512,
        spawnX: 7_360,
        spawnSurfaceY: 512,
      },
    ],
    goal: {
      x: 9_340,
      surfaceY: 512,
    },
    terrain: {
      tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
      solidTileIndexes: [0, 1, 2],
      platforms: [
        { col: 2, row: 8, width: 12, height: 1 },
        { col: 16, row: 8, width: 5, height: 1 },
      ],
    },
  }
}

function createFakeTileSprite(input: { texture: string }) {
  const sprite = {
    texture: input.texture,
    depth: 0,
    scrollFactor: 0,
    tilePositionX: 0,
    tilePositionY: 0,
    alpha: 1,
    tint: undefined as number | undefined,
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
    setAlpha: (value: number) => {
      sprite.alpha = value
      return sprite
    },
    setTint: (value: number) => {
      sprite.tint = value
      return sprite
    },
    clearTint: () => {
      sprite.tint = undefined
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
    frame: undefined as number | undefined,
    tint: undefined as number | undefined,
    blendMode: undefined as string | undefined,
    dragX: 0,
    velocityX: 0,
    velocityY: 0,
    maxVelocity: { x: 0, y: 0 },
    depth: 0,
    accelerationX: 0,
    flipX: false,
    scaleX: 1,
    scaleY: 1,
    active: true,
    angle: 0,
    alpha: 1,
    visible: true,
    destroyed: false,
    immovable: false,
    data: {} as Record<string, unknown>,
    displaySize: { width: 0, height: 0 },
    refreshedBody: false,
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
      sprite.scaleX = value
      sprite.scaleY = value
      return sprite
    },
    setDisplaySize: (width: number, height: number) => {
      sprite.displaySize = { width, height }
      return sprite
    },
    setPosition: (x: number, y: number) => {
      sprite.x = x
      sprite.y = y
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
    setTexture: (texture: string, frame?: number) => {
      sprite.texture = texture
      sprite.frame = frame
      return sprite
    },
    setTint: (value: number) => {
      sprite.tint = value
      return sprite
    },
    clearTint: () => {
      sprite.tint = undefined
      return sprite
    },
    setBlendMode: (value: string) => {
      sprite.blendMode = value
      return sprite
    },
    setData: (key: string, value: unknown) => {
      sprite.data[key] = value
      return sprite
    },
    getData: (key: string) => sprite.data[key],
    setImmovable: (value: boolean) => {
      sprite.immovable = value
      return sprite
    },
    play: (key: string, ignoreIfPlaying?: boolean) => {
      sprite.playCalls.push({ key, ignoreIfPlaying })
      sprite.texture = key
      sprite.frame = undefined
      return sprite
    },
    destroy: () => {
      sprite.destroyed = true
    },
    refreshBody: () => {
      sprite.refreshedBody = true
      return sprite
    },
    getBounds: () => ({
      x: sprite.x - sprite.body.size.width / 2,
      y: sprite.y - sprite.body.size.height / 2,
      width: sprite.body.size.width,
      height: sprite.body.size.height,
    }),
    getCenter: () => ({
      x: sprite.x,
      y: sprite.y,
    }),
  }

  return sprite
}

function createFakeImage(input: { x: number; y: number; texture: string }) {
  const image = {
    ...input,
    width: 56,
    height: 36,
    origin: { x: 0, y: 0 },
    displaySize: { width: 0, height: 0 },
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    alpha: 1,
    flipX: false,
    depth: 0,
    angle: 0,
    tint: undefined as number | undefined,
    blendMode: undefined as string | undefined,
    destroyed: false,
    setDepth: (value: number) => {
      image.depth = value
      return image
    },
    setBlendMode: (value: string) => {
      image.blendMode = value
      return image
    },
    setScale: (value: number) => {
      image.scale = value
      image.scaleX = value
      image.scaleY = value
      return image
    },
    setOrigin: (x: number, y: number) => {
      image.origin = { x, y }
      return image
    },
    setDisplaySize: (width: number, height: number) => {
      image.displaySize = { width, height }
      image.scaleX = width / image.width
      image.scaleY = height / image.height
      return image
    },
    setAlpha: (value: number) => {
      image.alpha = value
      return image
    },
    setTint: (value: number) => {
      image.tint = value
      return image
    },
    setPosition: (x: number, y: number) => {
      image.x = x
      image.y = y
      return image
    },
    setAngle: (value: number) => {
      image.angle = value
      return image
    },
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
    getCenter: () => ({
      x: image.x,
      y: image.y,
    }),
  }

  return image
}

function createFakeEllipse(input: {
  x: number
  y: number
  width: number
  height: number
  fillColor?: number
  fillAlpha?: number
}) {
  const ellipse = {
    ...input,
    depth: 0,
    alpha: input.fillAlpha ?? 1,
    scale: 1,
    blendMode: undefined as string | undefined,
    strokeStyle: undefined as { width: number; color: number; alpha?: number } | undefined,
    fillStyle: undefined as { color: number; alpha?: number } | undefined,
    setDepth: (value: number) => {
      ellipse.depth = value
      return ellipse
    },
    setBlendMode: (value: string) => {
      ellipse.blendMode = value
      return ellipse
    },
    setAlpha: (value: number) => {
      ellipse.alpha = value
      return ellipse
    },
    setScale: (value: number) => {
      ellipse.scale = value
      return ellipse
    },
    setStrokeStyle: (width: number, color: number, alpha?: number) => {
      ellipse.strokeStyle = { width, color, alpha }
      return ellipse
    },
    setFillStyle: (color: number, alpha?: number) => {
      ellipse.fillStyle = { color, alpha }
      ellipse.fillColor = color
      ellipse.fillAlpha = alpha
      return ellipse
    },
  }

  return ellipse
}

function createSceneRuntime(input: {
  stage?: GameplayStageMap
  onHudUpdate?: (patch: GameplayHudPatch) => void
} = {}) {
  const stage = input.stage ?? createEnemyFixtureStage()

  const hudUpdates: GameplayHudPatch[] = []
  const config = createGameplayRendererConfig({
    parent: {} as HTMLElement,
    stage,
    onHudUpdate: (patch) => {
      hudUpdates.push(patch)
      input.onHudUpdate?.(patch)
    },
  })
  const configuredScenes = Array.isArray(config.scene) ? config.scene : [config.scene]
  const scene = configuredScenes[0] as {
    preload: () => void
    create: () => void
    update: (time?: number, delta?: number) => void
    load: {
      image: (key: string, assetRef: string) => void
      spritesheet: (key: string, assetRef: string, options: { frameWidth: number; frameHeight: number }) => void
    }
    physics: {
      world: { setBounds: (...args: number[]) => void }
      add: {
        sprite: (x: number, y: number, texture: string) => ReturnType<typeof createFakeArcadeSprite>
        staticSprite: (
          x: number,
          y: number,
          texture: string,
          frame?: number,
        ) => ReturnType<typeof createFakeArcadeSprite>
        staticImage: (
          x: number,
          y: number,
          texture: string,
          frame?: number,
        ) => ReturnType<typeof createFakeArcadeSprite>
        collider: (a: unknown, b: unknown) => void
        overlap: (a: unknown, b: unknown, callback: () => void) => void
      }
    }
    cameras: {
      main: {
        scrollX: number
        setBounds: (...args: number[]) => void
        startFollow: (target: unknown, roundPixels?: boolean, lerpX?: number, lerpY?: number) => void
        once: (event: string, callback: () => void) => void
        fadeOut: (duration: number, red: number, green: number, blue: number) => void
        fadeIn: (duration: number, red: number, green: number, blue: number) => void
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
      ellipse: (
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor?: number,
        fillAlpha?: number,
      ) => ReturnType<typeof createFakeEllipse>
      sprite: (x: number, y: number, texture: string, frame?: number) => ReturnType<typeof createFakeArcadeSprite>
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
      addEvent: (config: {
        delay: number
        loop?: boolean
        callback: () => void
      }) => { remove: (dispatchCallback?: boolean) => void }
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
          down: { isDown: boolean }
          a: { isDown: boolean }
          d: { isDown: boolean }
          s: { isDown: boolean }
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
  const ellipses: Array<ReturnType<typeof createFakeEllipse>> = []
  const delayedCalls: DelayedCall[] = []
  let delayedTimeNow = 0
  const timerEvents: TimerEventCall[] = []
  const killedTweenTargets: unknown[] = []
  const colliderCalls: Array<{ a: unknown; b: unknown }> = []
  const overlapCalls: OverlapCall[] = []
  const cameraFadeOutCalls: CameraFadeCall[] = []
  const cameraFadeInCalls: CameraFadeCall[] = []
  const sprites: Array<ReturnType<typeof createFakeArcadeSprite>> = []
  const spriteCalls: Array<ReturnType<typeof createFakeArcadeSprite>> = []
  const staticSpriteCalls: Array<ReturnType<typeof createFakeArcadeSprite>> = []
  const staticImageCalls: Array<ReturnType<typeof createFakeArcadeSprite>> = []
  const tileSprites: Array<ReturnType<typeof createFakeTileSprite>> = []
  const terrainLayer = createFakeTerrainLayer()
  const playerKeys: FakePlayerKeys = {
    left: { isDown: false },
    right: { isDown: false },
    down: { isDown: false },
    a: { isDown: false },
    d: { isDown: false },
    s: { isDown: false },
    j: { isDown: false },
    space: { isDown: false },
    up: { isDown: false },
    w: { isDown: false },
    z: { isDown: false },
  }
  let playerSprite: ReturnType<typeof createFakeArcadeSprite> | null = null
  let cameraFollowTarget: unknown = null
  let fadeOutCompleteCallback: (() => void) | null = null
  const internalScene = scene as typeof scene & {
    applyPlayerContactDamage: (sourceX: number) => void
    bossPrototype?: { sprite: ReturnType<typeof createFakeArcadeSprite> } | null
  }

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
        spriteCalls.push(sprite)
        sprites.push(sprite)
        if (texture === playerActorDefinition.sprites.idle.key) {
          playerSprite = sprite
        }
        return sprite
      },
      staticSprite: (x, y, texture, frame) => {
        const sprite = createFakeArcadeSprite({ x, y, texture })
        sprite.frame = frame
        sprite.play = (key, ignoreIfPlaying) => {
          sprite.playCalls.push({ key, ignoreIfPlaying })
          return sprite
        }
        staticSpriteCalls.push(sprite)
        return sprite
      },
      staticImage: (x, y, texture, frame) => {
        const sprite = createFakeArcadeSprite({ x, y, texture })
        sprite.frame = frame
        staticImageCalls.push(sprite)
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
      once: (event, callback) => {
        if (event === 'fadeoutcomplete') {
          fadeOutCompleteCallback = callback
        }
      },
      fadeOut: (duration, red, green, blue) => {
        cameraFadeOutCalls.push({ duration, red, green, blue })
      },
      fadeIn: (duration, red, green, blue) => {
        cameraFadeInCalls.push({ duration, red, green, blue })
      },
    },
  }

  scene.add = {
    tileSprite: (_x, _y, _width, _height, texture) => {
      const sprite = createFakeTileSprite({ texture })
      tileSprites.push(sprite)
      return sprite
    },
    image: (x, y, texture) => {
      const image = createFakeImage({ x, y, texture })
      images.push(image)
      return image
    },
    ellipse: (x, y, width, height, fillColor, fillAlpha) => {
      const ellipse = createFakeEllipse({ x, y, width, height, fillColor, fillAlpha })
      ellipses.push(ellipse)
      return ellipse
    },
    sprite: (x, y, texture, frame) => {
      const sprite = createFakeArcadeSprite({ x, y, texture })
      sprite.frame = frame
      spriteCalls.push(sprite)
      return sprite
    },
  }

  scene.make = {
    graphics: () => ({
      fillStyle: () => {},
      fillCircle: () => {},
      fillEllipse: () => {},
      lineStyle: () => {},
      strokeCircle: () => {},
      fillRoundedRect: () => {},
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
      delayedCalls.push({
        delay,
        callback,
        scheduledAt: delayedTimeNow + delay,
        fired: false,
      })
    },
    addEvent: ({ delay, loop, callback }) => {
      const event: TimerEventCall = {
        delay,
        loop: Boolean(loop),
        callback,
        active: true,
        nextFireAt: scene.time.now + delay,
      }
      timerEvents.push(event)

      return {
        remove: () => {
          event.active = false
        },
      }
    },
  }

  function advanceTime(ms: number): void {
    const targetTime = scene.time.now + ms

    while (true) {
      const nextEvent = timerEvents
        .filter((event) => event.active && event.nextFireAt <= targetTime)
        .sort((left, right) => left.nextFireAt - right.nextFireAt)[0]

      if (!nextEvent) {
        break
      }

      scene.time.now = nextEvent.nextFireAt
      nextEvent.callback()

      if (nextEvent.loop && nextEvent.active) {
        nextEvent.nextFireAt += nextEvent.delay
      } else {
        nextEvent.active = false
      }
    }

    scene.time.now = targetTime
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
    Phaser,
    stage,
    config,
    scene,
    hudUpdates,
    imageCalls,
    spritesheetCalls,
    animationCreateCalls,
    sprites,
    spriteCalls,
    staticSpriteCalls,
    staticImageCalls,
    tileSprites,
    generateTextureCalls,
    generatedTextures: generateTextureCalls,
    tweenCalls,
    images,
    ellipses,
    delayedCalls,
    timerEvents,
    killedTweenTargets,
    colliderCalls,
    overlapCalls,
    cameraFadeOutCalls,
    cameraFadeInCalls,
    terrainLayer,
    playerKeys,
    runDelayedCalls: (delay: number) => {
      const targetTime = delayedTimeNow + delay

      while (true) {
        const nextCall = delayedCalls
          .filter((candidate) => !candidate.fired && candidate.scheduledAt <= targetTime)
          .sort((left, right) => left.scheduledAt - right.scheduledAt)[0]

        if (!nextCall) {
          break
        }

        nextCall.fired = true
        delayedTimeNow = nextCall.scheduledAt
        nextCall.callback()
      }

      delayedTimeNow = targetTime
    },
    advanceTime,
    triggerEnemyOverlap: (enemy: ReturnType<typeof createFakeArcadeSprite>) => {
      const overlap = overlapCalls.find((candidate) => candidate.a === playerSprite && candidate.b === enemy)
      if (!overlap) {
        throw new Error(`Missing player overlap for enemy texture ${enemy.texture}.`)
      }
      overlap.callback()
    },
    triggerHazardOverlap: (hazard: ReturnType<typeof createFakeArcadeSprite>) => {
      const overlap = overlapCalls.find((candidate) => candidate.a === playerSprite && candidate.b === hazard)
      if (!overlap) {
        throw new Error(`Missing player overlap for hazard texture ${hazard.texture}.`)
      }
      overlap.callback()
    },
    triggerGoalOverlap: (goal: ReturnType<typeof createFakeArcadeSprite>) => {
      const overlap = overlapCalls.find((candidate) => candidate.a === playerSprite && candidate.b === goal)
      if (!overlap) {
        throw new Error(`Missing player overlap for goal texture ${goal.texture}.`)
      }
      overlap.callback()
    },
    triggerFadeOutComplete: () => {
      if (!fadeOutCompleteCallback) {
        throw new Error('Missing fade-out completion callback.')
      }
      fadeOutCompleteCallback()
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
    getBossSprite: () => internalScene.bossPrototype?.sprite ?? null,
    placePlayerNear: (x: number, y: number) => {
      if (!playerSprite) return
      playerSprite.x = x
      playerSprite.y = y
    },
    pressAttack: () => {
      playerKeys.j.isDown = true
    },
    releaseAttack: () => {
      playerKeys.j.isDown = false
    },
    hitBossWithMelee: () => {
      const boss = internalScene.bossPrototype?.sprite
      if (!boss || !playerSprite) return
      playerSprite.x = boss.x - 48
      playerSprite.y = boss.y
      playerKeys.j.isDown = true
      scene.update(16, 16)
      playerKeys.j.isDown = false
      scene.update(32, 16)
    },
    killPlayerWithDamage: () => {
      const sourceX = playerSprite ? playerSprite.x + 16 : 16
      internalScene.applyPlayerContactDamage(sourceX)
      internalScene.applyPlayerContactDamage(sourceX)
      internalScene.applyPlayerContactDamage(sourceX)
    },
  }
}

function recoverFromSurvivedHurt(runtime: FakeRuntime): void {
  runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
  runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)
}

function getBossProjectileSprites(runtime: FakeRuntime) {
  return runtime.sprites.filter((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)
}

function startGameplay(runtime: FakeRuntime): void {
  runtime.scene.update(0, 0)
  runtime.playerKeys.right.isDown = true
  runtime.scene.update(16, 16)
  runtime.playerKeys.right.isDown = false
}

function createHazardStage(): GameplayStageMap {
  const stage = createEnemyFixtureStage()

  return {
    ...stage,
    hazards: [
      {
        id: 'test-spike-bed',
        type: 'spikes',
        x: 760,
        surfaceY: 512,
        width: 180,
        height: 62,
        orientation: 'floor',
      },
    ],
  }
}

function getCheckpointSprite(runtime: FakeRuntime, checkpointId: string) {
  const checkpoint = runtime.stage.checkpoints.find((candidate) => candidate.id === checkpointId)
  expect(checkpoint).toBeDefined()
  if (!checkpoint) {
    throw new Error(`Missing checkpoint ${checkpointId}.`)
  }

  const sprite = runtime.images.find(
    (image) => image.texture === checkpointActorDefinition.sprite.key && image.x === checkpoint.x,
  )
  expect(sprite).toBeDefined()
  if (!sprite) {
    throw new Error(`Missing checkpoint sprite ${checkpointId}.`)
  }

  return { checkpoint, sprite }
}

function getGoalSprite(runtime: FakeRuntime) {
  const goal = runtime.staticSpriteCalls.find(
    (sprite) => sprite.texture === goalActorDefinition.sprite.key,
  )
  expect(goal).toBeDefined()
  if (!goal) {
    throw new Error('Missing stage goal sprite.')
  }

  return goal
}

function getEnemySpriteAt(runtime: FakeRuntime, x: number) {
  const enemy = runtime.enemySprites.find((sprite) => sprite.x === x)
  expect(enemy).toBeDefined()
  if (!enemy) {
    throw new Error(`Missing enemy sprite at ${x}.`)
  }

  return enemy
}

describe('createGameplayRendererConfig', () => {
  it('emits initial gameplay HUD state during scene creation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.hudUpdates[0]).toEqual(createInitialGameplayHudState(runtime.stage))
  })

  it('emits player gameplay HUD progress and elapsed time during scene update before clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.playerSprite.x = 640
    runtime.playerSprite.y = 320
    runtime.scene.time.now = 65_432
    runtime.scene.update(65_432, 65_432)
    runtime.playerKeys.right.isDown = false

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      playerProgress: getHudPositionProgress({
        position: 640,
        worldSize: runtime.stage.world.width,
      }),
      playerProgressY: getHudPositionProgress({
        position: 320,
        worldSize: runtime.stage.world.height,
      }),
      enemyMarkers: getHudEnemyMarkers({
        enemies: runtime.enemySprites.map((enemy) => ({
          x: enemy.x,
          y: enemy.y,
          defeated: false,
        })),
        worldWidth: runtime.stage.world.width,
        worldHeight: runtime.stage.world.height,
      }),
      time: formatGameplayHudTime(65_432),
    })
  })

  it('tracks gameplay HUD elapsed time from update delta so paused wall-clock gaps are excluded', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.scene.time.now = 1_000
    runtime.scene.update(1_000, 1_000)
    runtime.playerKeys.right.isDown = false
    runtime.scene.time.now = 18_000
    runtime.scene.update(18_000, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(1_016),
    })
  })

  it('keeps gameplay elapsed time at zero before the first armed gameplay input', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.time.now = 65_432
    runtime.scene.update(65_432, 65_432)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(0),
    })
  })

  it('keeps Armor Guard still before gameplay starts', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    const guard = runtime.enemySprites.find(
      (sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key,
    )
    expect(guard).toBeDefined()
    if (!guard) return

    expect(guard.velocityX).toBe(0)

    runtime.scene.update(16, 16)

    expect(guard.velocityX).toBe(0)
  })

  it('does not start from held entry input until gameplay input is released and pressed again', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerKeys.right.isDown = true
    runtime.scene.update(1_000, 1_000)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(0),
    })
    expect(runtime.playerSprite.accelerationX).toBe(0)

    runtime.playerKeys.right.isDown = false
    runtime.scene.update(1_016, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(0),
    })

    runtime.playerKeys.right.isDown = true
    runtime.scene.update(1_032, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(16),
    })
    expect(runtime.playerSprite.accelerationX).toBeGreaterThan(0)
  })

  it('honors the first valid start input in the same update frame', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.left.isDown = true
    runtime.scene.update(16, 16)

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      time: formatGameplayHudTime(16),
    })
    expect(runtime.playerSprite.accelerationX).toBeLessThan(0)
  })

  it('starts Armor Guard patrol after the start gate is running', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()

    const guard = runtime.enemySprites.find(
      (sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key,
    )
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.scene.update(16, 16)

    expect(guard.velocityX).toBe(-enemyActorDefinitions['armor-guard'].patrol.speed)
  })

  it('does not clear the stage before the start gate is running', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const goal = getGoalSprite(runtime)

    const hudUpdatesBefore = runtime.hudUpdates.length
    runtime.triggerGoalOverlap(goal)

    expect(runtime.hudUpdates).toHaveLength(hudUpdatesBefore)
    expect(runtime.hudUpdates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ cleared: true })]),
    )
    expect(goal.tint).toBeUndefined()
  })

  it('does not apply spike hazard damage before the start gate is running', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    const hudUpdatesBefore = runtime.hudUpdates.length
    runtime.triggerHazardOverlap(spike)

    expect(runtime.hudUpdates).toHaveLength(hudUpdatesBefore)
    expect(runtime.hudUpdates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ hp: 2, damageTaken: 1 })]),
    )
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
  })

  it('does not apply enemy contact damage before the start gate is running', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const guard = runtime.enemySprites.find(
      (sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key,
    )
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    const hudUpdatesBefore = runtime.hudUpdates.length
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.hudUpdates).toHaveLength(hudUpdatesBefore)
    expect(runtime.hudUpdates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ hp: 2, damageTaken: 1 })]),
    )
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
  })

  it('emits HUD coin statistics when a coin is collected', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin) return

    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ coins: 1 }),
      ]),
    )
  })

  it('emits HUD damage statistics and restored HP after respawn', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike) return

    runtime.triggerHazardOverlap(spike)

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hp: 2, damageTaken: 1 }),
      ]),
    )

    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)
    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hp: 3 }),
      ]),
    )
  })

  it('emits HUD fall count when the player respawns from out-of-bounds', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.y = runtime.stage.world.height + PLAYER_OUT_OF_BOUNDS_MARGIN + 1
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ falls: 1 }),
      ]),
    )
  })

  it('emits enemy and checkpoint HUD stats', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.playerSprite.x = guard.x - 48
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ enemiesDefeated: 1 }),
      ]),
    )

    runtime.playerSprite.x = runtime.stage.checkpoints[0].x
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activeCheckpointIndex: 0,
          checkpointsReached: 1,
        }),
      ]),
    )
  })

  it('emits HUD clear state and suppresses later HUD-changing patches after clear', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    runtime.triggerGoalOverlap(getGoalSprite(runtime))
    const updateCountAfterClear = runtime.hudUpdates.length

    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike) return

    runtime.triggerHazardOverlap(spike)
    runtime.playerSprite.x = runtime.stage.checkpoints[0].x
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cleared: true }),
      ]),
    )
    expect(runtime.hudUpdates).toHaveLength(updateCountAfterClear)
  })

  it('emits a complete result snapshot when the stage is cleared', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()
    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.scene.time.now = 12_340
    runtime.scene.update(12_340, 12_340)
    runtime.playerKeys.right.isDown = false

    const goal = getGoalSprite(runtime)
    runtime.triggerGoalOverlap(goal)

    const resultPatch = runtime.hudUpdates.find((patch) => patch.result)
    expect(resultPatch).toBeDefined()
    expect(resultPatch).toMatchObject({
      cleared: true,
      rank: calculateStageRank({
        elapsedMs: runtime.scene.time.now,
        rankTargets: stage.rankTargets,
        coins: 0,
        coinTarget: stage.coins.length,
        enemiesDefeated: 0,
        enemyTarget: getScoreEnemyTargetCount({ enemies: stage.enemies }),
        checkpointsReached: 0,
        checkpointTarget: stage.checkpoints.length,
        damageTaken: 0,
        falls: 0,
      }),
      result: {
        elapsedMs: runtime.scene.time.now,
        time: formatGameplayHudTime(runtime.scene.time.now),
        coins: 0,
        coinTarget: stage.coins.length,
        damageTaken: 0,
        falls: 0,
        enemiesDefeated: 0,
        enemyTarget: stage.enemies.length,
        checkpointsReached: 0,
        checkpointTarget: stage.checkpoints.length,
      },
    })
  })

  it('uses gameplay elapsed time for clear result instead of paused wall-clock time', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()
    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true
    runtime.scene.time.now = 1_000
    runtime.scene.update(1_000, 1_000)
    runtime.playerKeys.right.isDown = false
    runtime.scene.time.now = 18_000
    runtime.scene.update(18_000, 16)

    runtime.triggerGoalOverlap(getGoalSprite(runtime))

    const resultPatch = runtime.hudUpdates.find((patch) => patch.result)
    expect(resultPatch?.result).toMatchObject({
      elapsedMs: 1_016,
      time: formatGameplayHudTime(1_016),
    })
  })

  it('ignores goal overlap during the queued respawn death window', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike) return

    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)

    const updateCountBeforeGoalOverlap = runtime.hudUpdates.length

    runtime.triggerGoalOverlap(getGoalSprite(runtime))

    expect(runtime.hudUpdates).toHaveLength(updateCountBeforeGoalOverlap)
    expect(runtime.hudUpdates.some((patch) => patch.cleared === true)).toBe(false)

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hp: 3 }),
      ]),
    )
    expect(runtime.hudUpdates.at(-1)).toEqual(
      expect.objectContaining({ hp: 3 }),
    )
  })

  it.each(['1-1', '2-1', '4-4'] as const)(
    'creates a renderer scene from converted gameplay stage %s',
    (stageId) => {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      const runtime = createSceneRuntime({ stage })

      runtime.scene.preload()
      expect(() => runtime.scene.create()).not.toThrow()
      expect(runtime.imageCalls).toEqual(
        expect.arrayContaining(
          stage.backgroundLayers.map((layer) => ({
            key: layer.id,
            assetRef: layer.assetRef,
          })),
        ),
      )
      expect(runtime.imageCalls).toEqual(
        expect.arrayContaining([
          { key: 'terrain-tiles', assetRef: stage.terrain.tilesetAssetRef },
        ]),
      )
      expect(runtime.hudUpdates[0]).toMatchObject({
        coinTarget: stage.coins.length,
        enemyTarget: getScoreEnemyTargetCount({ enemies: stage.enemies }),
        checkpointTarget: stage.checkpoints.length,
      })
    },
  )

  it('applies background layer alpha and tint from converted stage data', () => {
    const stage = getGameplayStageMap('3-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    const farLayer = runtime.tileSprites.find((sprite) => sprite.texture === 'far')
    const midLayer = runtime.tileSprites.find((sprite) => sprite.texture === 'mid')

    expect(farLayer).toBeDefined()
    expect(midLayer).toBeDefined()
    if (!farLayer || !midLayer) return

    expect(farLayer.alpha).toBe(0.32)
    expect(farLayer.tint).toBe(0x8be7ff)
    expect(midLayer.alpha).toBe(0.2)
    expect(midLayer.tint).toBe(0xdff8ff)
  })

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

  it('preloads spike hazard spritesheets from the domain hazard definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    const sprite = hazardActorDefinitions.spikes.sprite
    expect(runtime.spritesheetCalls).toContainEqual({
      key: sprite.key,
      assetRef: sprite.assetRef,
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
    })
  })

  it('preloads the checkpoint beacon image from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    expect(runtime.imageCalls).toContainEqual({
      key: checkpointActorDefinition.sprite.key,
      assetRef: checkpointActorDefinition.sprite.assetRef,
    })
  })

  it('preloads the stage goal spritesheet from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    expect(runtime.spritesheetCalls).toContainEqual({
      key: goalActorDefinition.sprite.key,
      assetRef: goalActorDefinition.sprite.assetRef,
      frameWidth: goalActorDefinition.sprite.frameWidth,
      frameHeight: goalActorDefinition.sprite.frameHeight,
    })
  })

  it('creates the stage goal idle animation from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.animationCreateCalls).toContainEqual({
      key: goalActorDefinition.animation.idleKey,
      frames: [
        { key: goalActorDefinition.sprite.key, frame: 0 },
        { key: goalActorDefinition.sprite.key, frame: 1 },
        { key: goalActorDefinition.sprite.key, frame: 2 },
        { key: goalActorDefinition.sprite.key, frame: 3 },
      ],
      frameRate: goalActorDefinition.animation.frameRate,
      repeat: goalActorDefinition.animation.repeat,
      yoyo: goalActorDefinition.animation.yoyo,
    })
  })

  it('creates a static stage goal body from stage data', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const goal = getGoalSprite(runtime)
    const bottomY = getGoalBottomY({ surfaceY: runtime.stage.goal.surfaceY })

    expect(goal).toMatchObject({
      x: runtime.stage.goal.x,
      y: bottomY,
      texture: goalActorDefinition.sprite.key,
      origin: goalActorDefinition.origin,
      displaySize: goalActorDefinition.displaySize,
      depth: goalActorDefinition.depth,
      refreshedBody: true,
    })
    expect(goal.body.size).toEqual({
      width: goalActorDefinition.body.width,
      height: goalActorDefinition.body.height,
    })
    expect(goal.body.offset).toEqual({
      x: goalActorDefinition.body.offsetX,
      y: goalActorDefinition.body.offsetY,
    })
    expect(goal.playCalls.at(-1)).toEqual({
      key: goalActorDefinition.animation.idleKey,
      ignoreIfPlaying: undefined,
    })
    expect(runtime.overlapCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          a: runtime.playerSprite,
          b: goal,
        }),
      ]),
    )
  })

  it('clears the stage once when the player overlaps the goal', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const goal = getGoalSprite(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return
    guard.velocityX = 80
    runtime.playerSprite.velocityX = 120
    runtime.playerSprite.velocityY = -60
    runtime.playerSprite.accelerationX = 400

    runtime.triggerGoalOverlap(goal)

    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.accelerationX).toBe(0)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
    expect(guard.velocityX).toBe(0)
    expect(goal.tint).toBe(goalActorDefinition.activatedTint)

    runtime.triggerGoalOverlap(goal)

    expect(
      runtime.playerSprite.playCalls.filter(
        (call) => call.key === playerActorDefinition.sprites.idle.key,
      ),
    ).toHaveLength(2)
  })

  it('restores player hurt state and blink visual when the stage clears during hurt recovery', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const goal = getGoalSprite(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)

    const scene = runtime.scene as typeof runtime.scene & {
      isPlayerHurting: boolean
      isPlayerInvulnerable: boolean
    }

    expect(scene.isPlayerHurting).toBe(true)
    expect(scene.isPlayerInvulnerable).toBe(true)
    runtime.playerSprite.alpha = playerHurtPresentation.blinkAlpha

    runtime.triggerGoalOverlap(goal)
    runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
    runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)

    expect(scene.isPlayerHurting).toBe(false)
    expect(scene.isPlayerInvulnerable).toBe(false)
    expect(runtime.killedTweenTargets).toContain(runtime.playerSprite)
    expect(runtime.playerSprite.alpha).toBe(1)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('keeps Armor Guard patrol frozen on the next update after stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)

    const goal = getGoalSprite(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return

    runtime.triggerGoalOverlap(goal)
    runtime.scene.update()

    expect(guard.velocityX).toBe(0)
  })

  it('stops Azure Core floating tween after stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)

    const goal = getGoalSprite(runtime)
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core) return

    expect(
      runtime.tweenCalls.some(
        (call) => call.targets === core && call.repeat === -1 && call.yoyo === true,
      ),
    ).toBe(true)

    runtime.triggerGoalOverlap(goal)

    expect(runtime.killedTweenTargets).toContain(core)
  })

  it('stops gameplay scanning and damage after stage clear', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const goal = getGoalSprite(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(spike).toBeDefined()
    expect(guard).toBeDefined()
    if (!spike || !guard) return

    runtime.triggerGoalOverlap(goal)
    const hurtCallsAfterClear = runtime.playerSprite.playCalls.length

    runtime.triggerHazardOverlap(spike)
    runtime.triggerEnemyOverlap(guard)
    runtime.playerSprite.x = runtime.stage.checkpoints[0].x
    runtime.scene.update()

    expect(runtime.playerSprite.playCalls).toHaveLength(hurtCallsAfterClear)
    expect(getCheckpointSprite(runtime, 'combat-gate').sprite.alpha).toBe(
      checkpointActorDefinition.inactiveAlpha,
    )
  })

  it('does not defeat the player for out-of-bounds position after stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.triggerGoalOverlap(getGoalSprite(runtime))
    runtime.playerSprite.y = runtime.stage.world.height + PLAYER_OUT_OF_BOUNDS_MARGIN + 10

    runtime.scene.update()

    expect(runtime.cameraFadeOutCalls).toHaveLength(0)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('keeps melee recovery callbacks from restoring combat state after stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const scene = runtime.scene as typeof runtime.scene & {
      attackReady: boolean
      isAttacking: boolean
    }

    expect(scene.attackReady).toBe(false)
    expect(scene.isAttacking).toBe(true)

    runtime.triggerGoalOverlap(getGoalSprite(runtime))
    runtime.runDelayedCalls(meleeAttackTiming.attackEndDelayMs)
    runtime.runDelayedCalls(meleeAttackTiming.readyDelayMs)

    expect(scene.attackReady).toBe(false)
    expect(scene.isAttacking).toBe(false)
  })

  it('keeps Homing recovery callbacks from restoring combat state after stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const scene = runtime.scene as typeof runtime.scene & {
      attackReady: boolean
      isAttacking: boolean
      isHomingAttacking: boolean
    }

    expect(scene.attackReady).toBe(false)
    expect(scene.isAttacking).toBe(true)
    expect(scene.isHomingAttacking).toBe(true)

    runtime.triggerGoalOverlap(getGoalSprite(runtime))
    runtime.runDelayedCalls(homingAttackTiming.recoveryDelayMs)

    expect(scene.attackReady).toBe(false)
    expect(scene.isAttacking).toBe(false)
    expect(scene.isHomingAttacking).toBe(false)
  })

  it('creates static spike hazards from stage data', () => {
    const stage = createHazardStage()
    const runtime = createSceneRuntime({ stage })

    runtime.scene.create()

    const hazardSpawn = stage.hazards[0]
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !hazardSpawn) return

    expect(spike).toMatchObject({
      x: hazardSpawn.x,
      y: getGroundedHazardCenterY({
        surfaceY: hazardSpawn.surfaceY,
        height: hazardSpawn.height,
        type: hazardSpawn.type,
      }),
      frame: getHazardFrameIndex({ orientation: hazardSpawn.orientation }),
      depth: 8,
      origin: hazardActorDefinitions.spikes.origin,
    })
    const body = getHazardBodyPresentation({
      width: hazardSpawn.width,
      height: hazardSpawn.height,
      type: hazardSpawn.type,
    })
    expect(spike.body.size).toEqual({
      width: body.width,
      height: body.height,
    })
    expect(spike.body.offset).toEqual({
      x: body.offsetX,
      y: body.offsetY,
    })
    expect(spike.displaySize).toEqual({
      width: hazardSpawn.width,
      height: hazardSpawn.height,
    })
    expect(spike.refreshedBody).toBe(true)
    expect(runtime.overlapCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          a: runtime.playerSprite,
          b: spike,
        }),
      ]),
    )
  })

  it('creates checkpoint beacon visuals from stage data', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const checkpoint = runtime.stage.checkpoints[0]
    expect(checkpoint).toBeDefined()
    if (!checkpoint) return

    const bottomY = getCheckpointBottomY({ surfaceY: checkpoint.surfaceY })
    const sprite = runtime.images.find(
      (image) => image.texture === checkpointActorDefinition.sprite.key && image.x === checkpoint.x,
    )
    expect(sprite).toBeDefined()
    if (!sprite) return

    expect(sprite).toMatchObject({
      x: checkpoint.x,
      y: bottomY,
      alpha: checkpointActorDefinition.inactiveAlpha,
      depth: checkpointActorDefinition.depth,
    })
    expect(sprite.origin).toEqual(checkpointActorDefinition.origin)
    expect(sprite.displaySize).toEqual(checkpointActorDefinition.displaySize)

    expect(runtime.ellipses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          x: checkpoint.x,
          y: bottomY + checkpointActorDefinition.glow.yOffset,
          width: checkpointActorDefinition.glow.width,
          height: checkpointActorDefinition.glow.height,
          fillColor: 0x4be8ff,
          fillAlpha: checkpointActorDefinition.glow.alpha,
          depth: checkpointActorDefinition.glow.depth,
          blendMode: 'ADD',
        }),
        expect.objectContaining({
          x: checkpoint.x,
          y: bottomY + checkpointActorDefinition.ring.yOffset,
          width: checkpointActorDefinition.ring.width,
          height: checkpointActorDefinition.ring.height,
          fillColor: 0x4be8ff,
          fillAlpha: 0,
          depth: checkpointActorDefinition.ring.depth,
          blendMode: 'ADD',
          strokeStyle: {
            width: checkpointActorDefinition.ring.strokeWidth,
            color: 0x4be8ff,
            alpha: checkpointActorDefinition.ring.alpha,
          },
        }),
      ]),
    )
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: expect.arrayContaining([
            expect.objectContaining({ x: checkpoint.x, y: bottomY + checkpointActorDefinition.glow.yOffset }),
            expect.objectContaining({ x: checkpoint.x, y: bottomY + checkpointActorDefinition.ring.yOffset }),
          ]),
          alpha: {
            from: checkpointActorDefinition.idleTween.alphaFrom,
            to: checkpointActorDefinition.idleTween.alphaTo,
          },
          scale: {
            from: checkpointActorDefinition.idleTween.scaleFrom,
            to: checkpointActorDefinition.idleTween.scaleTo,
          },
          duration: checkpointActorDefinition.idleTween.durationMs,
          ease: checkpointActorDefinition.idleTween.ease,
          yoyo: true,
          repeat: -1,
        }),
      ]),
    )
  })

  it('activates a checkpoint when the player reaches the checkpoint X coordinate', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const { checkpoint, sprite } = getCheckpointSprite(runtime, 'combat-gate')
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()

    expect(sprite.alpha).toBe(checkpointActorDefinition.activatedAlpha)
    expect(sprite.tint).toBe(checkpointActorDefinition.activatedTint)
    expect(
      runtime.tweenCalls.some(
        (call) => call.targets === sprite && (
          'scale' in call
          || 'scaleX' in call
          || 'scaleY' in call
        ),
      ),
    ).toBe(false)
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: expect.arrayContaining([
            expect.objectContaining({ x: checkpoint.x }),
          ]),
          alpha: 1,
          duration: checkpointActorDefinition.activationTween.durationMs,
          yoyo: true,
        }),
      ]),
    )
  })

  it('does not reactivate the same checkpoint on repeated updates', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const { checkpoint, sprite } = getCheckpointSprite(runtime, 'combat-gate')
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()
    const tweenCountAfterFirstActivation = runtime.tweenCalls.filter((call) => call.targets === sprite).length

    runtime.scene.update()

    expect(runtime.tweenCalls.filter((call) => call.targets === sprite)).toHaveLength(tweenCountAfterFirstActivation)
  })

  it('activates only the first later checkpoint when the player moves past multiple checkpoints', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    const first = getCheckpointSprite(runtime, 'combat-gate')
    const second = getCheckpointSprite(runtime, 'final-ascent')
    runtime.playerSprite.x = second.checkpoint.x + 100
    runtime.scene.update()

    expect(first.sprite.alpha).toBe(checkpointActorDefinition.activatedAlpha)
    expect(second.sprite.alpha).toBe(checkpointActorDefinition.inactiveAlpha)
  })

  it('skips checkpoint scanning while the player is dead', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const { checkpoint, sprite } = getCheckpointSprite(runtime, 'combat-gate')
    ;(runtime.scene as unknown as { isPlayerDead: boolean }).isPlayerDead = true
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()

    expect(sprite.alpha).toBe(checkpointActorDefinition.inactiveAlpha)
    expect(sprite.tint).toBeUndefined()
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

  it('creates moving platform sprites from stage map data and registers player collision', () => {
    const stage = createEnemyFixtureStage()
    stage.movingPlatforms = [
      {
        id: 'test-lift',
        col: 10,
        row: 8,
        width: 3,
        height: 1,
        axis: 'y',
        distance: 64,
        durationMs: 1000,
        phase: 0,
        origin: { x: 736, y: 544 },
      },
    ]
    const runtime = createSceneRuntime({ stage })

    runtime.scene.create()

    const movingPlatform = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === 'terrain-tiles' && sprite.x === 736,
    )
    expect(movingPlatform).toBeDefined()
    expect(runtime.colliderCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ a: runtime.playerSprite, b: movingPlatform }),
      ]),
    )
  })

  it('updates moving platform positions from elapsed gameplay time', () => {
    const stage = createEnemyFixtureStage()
    stage.movingPlatforms = [
      {
        id: 'test-ferry',
        col: 10,
        row: 8,
        width: 3,
        height: 1,
        axis: 'x',
        distance: 100,
        durationMs: 1000,
        phase: 0,
        origin: { x: 736, y: 544 },
      },
    ]
    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()

    const movingPlatform = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === 'terrain-tiles' && sprite.x === 736,
    )
    expect(movingPlatform).toBeDefined()
    if (!movingPlatform) return

    startGameplay(runtime)
    runtime.scene.update(250, 234)

    expect(movingPlatform.x).toBe(786)
    expect(movingPlatform.y).toBe(544)
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

  it('creates a boss projectile texture for boss stages', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    expect(runtime.generatedTextures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'boss-projectile', width: 28, height: 28 }),
      ]),
    )
  })

  it('preloads and registers 1-6 boss Priestess spritesheet animations', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    for (const sprite of Object.values(bossPriestessSpriteAssets)) {
      expect(runtime.spritesheetCalls).toContainEqual({
        key: sprite.key,
        assetRef: sprite.assetRef,
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight,
      })
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

  it('uses the 1-6 boss Priestess cast sprite for the boss prototype', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    const boss = runtime.getBossSprite()

    expect(boss).toBeDefined()
    expect(boss?.texture).toBe(bossPriestessSpriteAssets.cast.key)
    expect(boss?.x).toBe(5880)
    expect(boss?.y).toBe(384)
    expect(boss?.origin).toEqual(bossPriestessSpriteAssets.cast.origin)
    expect(boss?.scale).toBe(bossPriestessSpriteAssets.cast.scale)
    expect(boss?.body.size).toEqual({
      width: bossPriestessSpriteAssets.cast.body.width,
      height: bossPriestessSpriteAssets.cast.body.height,
    })
    expect(boss?.body.offset).toEqual({
      x: bossPriestessSpriteAssets.cast.body.offsetX,
      y: bossPriestessSpriteAssets.cast.body.offsetY,
    })
    expect(boss?.playCalls.at(-1)).toEqual({
      key: bossPriestessSpriteAssets.cast.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.killedTweenTargets).toContain(boss)
    expect(runtime.tweenCalls.some((call) => call.targets === boss && call.y === 370)).toBe(false)
  })

  it('starts boss pattern with an immediate phase zero aimed projectile once gameplay starts', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const projectile = runtime.sprites.find((sprite) => sprite.texture === 'boss-projectile')
    expect(projectile).toBeDefined()
    expect(projectile?.depth).toBe(16)
    expect(projectile?.blendMode).toBe(runtime.Phaser.BlendModes.ADD)
    expect(projectile?.body.allowGravity).toBe(false)
    expect(projectile?.velocityX).not.toBe(0)
  })

  it('does not stack boss projectile damage while the player is hurting and invulnerable', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const firstProjectile = getBossProjectileSprites(runtime)[0]
    expect(firstProjectile).toBeDefined()
    expect(runtime.playerSprite).toBeDefined()
    if (!firstProjectile || !runtime.playerSprite) return

    firstProjectile.x = runtime.playerSprite.x
    firstProjectile.y = runtime.playerSprite.y
    runtime.scene.update(32, 16)

    const hurtAnimationKey = playerActorDefinition.sprites.hurt.key
    expect(
      runtime.playerSprite.playCalls.filter((call) => call.key === hurtAnimationKey),
    ).toHaveLength(1)
    expect(
      runtime.hudUpdates.filter((patch) => patch.damageTaken !== undefined).at(-1),
    ).toMatchObject({
      hp: 2,
      damageTaken: 1,
    })

    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }))

    const secondProjectile = getBossProjectileSprites(runtime).at(-1)
    expect(secondProjectile).toBeDefined()
    if (!secondProjectile) return

    secondProjectile.x = runtime.playerSprite.x
    secondProjectile.y = runtime.playerSprite.y
    runtime.scene.update(48, 16)

    expect(
      runtime.playerSprite.playCalls.filter((call) => call.key === hurtAnimationKey),
    ).toHaveLength(1)
    expect(
      runtime.hudUpdates.filter((patch) => patch.damageTaken !== undefined).at(-1),
    ).toMatchObject({
      hp: 2,
      damageTaken: 1,
    })
  })

  it('does not start boss pattern or accumulate boss projectiles before gameplay starts', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)

    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }) * 2)

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)
  })

  it.each(['down', 's'] as const)(
    'starts gameplay and boss pattern from %s crouch input',
    (key) => {
      const stage = getGameplayStageMap('1-6')
      expect(stage).toBeDefined()
      if (!stage) return
      const runtime = createSceneRuntime({ stage })

      runtime.scene.preload()
      runtime.scene.create()

      expect(getBossProjectileSprites(runtime)).toHaveLength(0)

      runtime.scene.update(0, 0)
      runtime.playerKeys[key].isDown = true
      runtime.scene.update(16, 16)
      runtime.playerKeys[key].isDown = false

      expect(getBossProjectileSprites(runtime)).toHaveLength(1)
    },
  )

  it('stops boss pattern and clears boss projectiles when the player is defeated in a boss stage', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }))

    expect(getBossProjectileSprites(runtime)).toHaveLength(2)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(1)
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerSprite.x = -PLAYER_OUT_OF_BOUNDS_MARGIN - 1
    runtime.scene.update(32, 16)

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)

    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }) * 2)

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)
  })

  it('does not restart the boss pattern on update while the player is dead', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }))

    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerSprite.x = -PLAYER_OUT_OF_BOUNDS_MARGIN - 1
    runtime.scene.update(32, 16)

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)

    runtime.scene.update(48, 16)

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)
  })

  it('restarts the boss pattern from a clean state after boss-stage respawn', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }))

    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerSprite.x = -PLAYER_OUT_OF_BOUNDS_MARGIN - 1
    runtime.scene.update(32, 16)
    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(getBossProjectileSprites(runtime)).toHaveLength(0)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)
    runtime.runDelayedCalls(500)

    expect(getBossProjectileSprites(runtime)).toHaveLength(1)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(1)
  })

  it('advances boss phase on melee hit instead of defeating the boss as an ordinary enemy', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const boss = runtime.getBossSprite()
    expect(boss).toBeDefined()
    if (!boss) return

    runtime.placePlayerNear(boss.x - 48, boss.y)
    runtime.pressAttack()
    runtime.scene.update(16, 16)
    runtime.releaseAttack()
    runtime.scene.update(32, 16)

    expect(boss.visible).toBe(true)
    expect(boss.body.enable).toBe(true)
    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bossPhase: 2, bossPhaseMax: 4 }),
      ]),
    )
  })

  it('restarts the advanced boss phase only once after the transition delay', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    runtime.hitBossWithMelee()
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)

    runtime.runDelayedCalls(620)

    const projectilesAfterRestart = getBossProjectileSprites(runtime).length
    expect(projectilesAfterRestart).toBeGreaterThan(0)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(1)

    runtime.runDelayedCalls(620)

    expect(getBossProjectileSprites(runtime)).toHaveLength(projectilesAfterRestart)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(1)
  })

  it('plays the boss Priestess hurt sprite during non-final phase transitions', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    runtime.hitBossWithMelee()

    const boss = runtime.getBossSprite()
    expect(boss?.playCalls.at(-1)).toEqual({
      key: bossPriestessSpriteAssets.hurt.key,
      ignoreIfPlaying: true,
    })

    runtime.runDelayedCalls(620)

    expect(boss?.playCalls.at(-1)).toEqual({
      key: bossPriestessSpriteAssets.cast.key,
      ignoreIfPlaying: true,
    })
  })

  it('restores regenerated boss support core presentation after prior defeat tween state', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const supportCore = getEnemySpriteAt(runtime, 1_248)
    supportCore.setVisible(false)
    supportCore.setAlpha(0)
    supportCore.setScale(1.8)
    supportCore.setAngle(90)
    supportCore.body.enable = false

    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)

    expect(supportCore.visible).toBe(true)
    expect(supportCore.alpha).toBe(1)
    expect(supportCore.scale).toBe(enemyActorDefinitions['azure-core'].scale)
    expect(supportCore.angle).toBe(0)
    expect(supportCore.body.enable).toBe(true)
  })

  it('defeats the boss on the final boss phase hit', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()

    const boss = runtime.getBossSprite()
    expect(boss?.visible).toBe(true)
    expect(boss?.playCalls.at(-1)).toEqual({
      key: bossPriestessSpriteAssets.death.key,
      ignoreIfPlaying: true,
    })
    expect(boss?.body.enable).toBe(false)
    expect(
      runtime.tweenCalls.some((call) =>
        call.targets === boss
        && call.duration === 260
        && call.ease === 'Quad.easeOut'
        && call.alpha === 0
      ),
    ).toBe(false)
    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bossPhase: 4,
          bossPhaseMax: 4,
          statusMessageKey: 'status.bossDefeated',
        }),
      ]),
    )
    runtime.runDelayedCalls(800)
    expect(boss?.visible).toBe(true)
  })

  it('ignores boss-stage goal overlap until the boss is defeated', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const activeTimersBefore = runtime.timerEvents.filter((event) => event.active).length
    const projectileCountBefore = getBossProjectileSprites(runtime).length
    const updateCountBeforeGoalOverlap = runtime.hudUpdates.length

    runtime.triggerGoalOverlap(getGoalSprite(runtime))

    expect(runtime.hudUpdates).toHaveLength(updateCountBeforeGoalOverlap)
    expect(runtime.hudUpdates.some((patch) => patch.cleared === true)).toBe(false)
    expect(runtime.hudUpdates.some((patch) => patch.result)).toBe(false)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(activeTimersBefore)
    expect(getBossProjectileSprites(runtime)).toHaveLength(projectileCountBefore)
  })

  it('hides and disables the boss-stage goal until the boss defeat reveal delay elapses', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const goal = getGoalSprite(runtime)

    expect(goal.visible).toBe(false)
    expect(goal.body.enable).toBe(false)

    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()

    expect(goal.visible).toBe(false)
    expect(goal.body.enable).toBe(false)

    runtime.runDelayedCalls(800)

    expect(goal.visible).toBe(true)
    expect(goal.body.enable).toBe(true)
    expect(goal.tint).toBeUndefined()
  })

  it('clears boss projectiles on player defeat and restarts the current phase after respawn', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    expect(runtime.sprites.some((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)).toBe(true)

    runtime.killPlayerWithDamage()
    expect(runtime.sprites.filter((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)).toHaveLength(0)

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()
    runtime.runDelayedCalls(500)

    expect(runtime.sprites.some((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)).toBe(true)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(1)

    runtime.runDelayedCalls(500)

    expect(runtime.sprites.filter((sprite) => sprite.texture === 'boss-projectile' && !sprite.destroyed)).toHaveLength(1)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(1)
  })

  it('clears the boss stage normally after the boss is defeated', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    runtime.runDelayedCalls(620)
    runtime.hitBossWithMelee()
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)
    const projectileCountAfterDefeat = getBossProjectileSprites(runtime).length

    runtime.triggerGoalOverlap(getGoalSprite(runtime))

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cleared: true,
          result: expect.any(Object),
        }),
      ]),
    )
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)

    runtime.advanceTime(getBossPatternDelayMs({ phase: 0 }) * 2)

    expect(getBossProjectileSprites(runtime)).toHaveLength(projectileCountAfterDefeat)
    expect(runtime.timerEvents.filter((event) => event.active)).toHaveLength(0)
  })

  it('creates the generated Homing reticle texture from prototype dimensions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.generateTextureCalls).toContainEqual({
      key: homingAttackPresentation.reticleTextureKey,
      width: homingAttackPresentation.reticleSize,
      height: homingAttackPresentation.reticleSize,
    })
  })

  it('creates the generated coin texture from prototype dimensions', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.generateTextureCalls).toContainEqual({
      key: 'coin',
      width: 44,
      height: 44,
    })
  })

  it('creates coin sprites from stage data with floating presentation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const coinImages = runtime.images.filter((image) => image.texture === 'coin')
    expect(coinImages).toHaveLength(runtime.stage.coins.length)
    expect(coinImages[0]).toMatchObject({
      x: runtime.stage.coins[0]?.x,
      y: runtime.stage.coins[0]?.y,
      depth: 12,
    })
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: coinImages[0],
          y: (runtime.stage.coins[0]?.y ?? 0) - 8,
          duration: 900,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        }),
      ]),
    )
  })

  it('collects a coin when the player moves inside the pickup radius', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()

    expect(runtime.killedTweenTargets).toContain(coin)
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: coin,
          y: coin.y - 34,
          scale: 1.8,
          alpha: 0,
          duration: 260,
          ease: 'Quad.easeOut',
        }),
      ]),
    )
    const collectionTween = runtime.tweenCalls.find((call) => call.targets === coin && call.duration === 260)
    expect(coin.visible).toBe(true)
    collectionTween?.onComplete?.()
    expect(coin.visible).toBe(false)
  })

  it('does not collect the same coin twice', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()
    runtime.scene.update()

    const collectionTweens = runtime.tweenCalls.filter((call) => call.targets === coin && call.duration === 260)
    expect(collectionTweens).toHaveLength(1)
  })

  it('does not scan coins while the player is dead', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin || !runtime.playerSprite) return

    const scene = runtime.scene as typeof runtime.scene & { isPlayerDead: boolean }
    scene.isPlayerDead = true
    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()

    const collectionTweens = runtime.tweenCalls.filter((call) => call.targets === coin && call.duration === 260)
    expect(collectionTweens).toHaveLength(0)
  })

  it('shows the Homing reticle over the nearest eligible airborne target', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(guard).toBeDefined()
    expect(core).toBeDefined()
    if (!guard || !core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    runtime.playerSprite.setFlipX(false)
    guard.x = 1800
    guard.y = 432
    core.x = 1760
    core.y = 320

    runtime.scene.update()

    const reticle = runtime.images.find((image) => image.texture === homingAttackPresentation.reticleTextureKey)
    expect(reticle).toMatchObject({
      x: 1760,
      y: 320 + homingAttackPresentation.reticleYOffset,
      visible: true,
      depth: 20,
      blendMode: 'ADD',
    })
    expect(reticle?.angle).toBe(3)
  })

  it('hides the Homing reticle while grounded or when the target is defeated', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.scene.update()
    const reticle = runtime.images.find((image) => image.texture === homingAttackPresentation.reticleTextureKey)
    expect(reticle?.visible).toBe(true)

    runtime.playerSprite.body.blocked.down = true
    runtime.playerSprite.body.touching.down = true
    runtime.scene.update()
    expect(reticle?.visible).toBe(false)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1712
    runtime.playerSprite.y = core.y
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()
    expect(core.body.enable).toBe(false)
    runtime.playerKeys.z.isDown = false
    runtime.scene.update()
    expect(reticle?.visible).toBe(false)
  })

  it('starts Homing Attack while airborne instead of spawning a melee hitbox', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)
    expect(core.body.enable).toBe(false)
    expect(runtime.playerSprite.texture).toBe(playerActorDefinition.sprites.attack.key)
    expect(runtime.playerSprite.frame).toBe(homingAttackPresentation.attackFrame)
    expect(runtime.playerSprite.scale).toBe(playerActorDefinition.sprites.attack.scale)
    expect(runtime.playerSprite.x).toBe(1726)
    expect(runtime.playerSprite.y).toBe(320)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(-420)
  })

  it('collects coins crossed by the Homing Attack line', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    const lineCoin = runtime.images.find((image) => image.texture === 'coin' && image.x === 1680)
    expect(core).toBeDefined()
    expect(lineCoin).toBeDefined()
    if (!core || !lineCoin || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.killedTweenTargets).toContain(lineCoin)
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: lineCoin,
          duration: 260,
          ease: 'Quad.easeOut',
        }),
      ]),
    )
  })

  it('does not collect coins outside the Homing Attack line radius', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    const offLineCoin = runtime.images.find((image) => image.texture === 'coin' && image.x === 1504)
    expect(core).toBeDefined()
    expect(offLineCoin).toBeDefined()
    if (!core || !offLineCoin || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const collectionTweens = runtime.tweenCalls.filter((call) => call.targets === offLineCoin && call.duration === 260)
    expect(collectionTweens).toHaveLength(0)
  })

  it('keeps Homing hit bounce on the next update before recovery', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    runtime.playerKeys.j.isDown = false
    runtime.scene.update()

    expect(runtime.playerSprite.velocityY).toBe(-420)
  })

  it('can Homing Attack Armor Guard through the existing defeat presentation', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find(
      (sprite) => sprite.texture === enemyActorDefinitions['armor-guard'].sprites?.walk?.key,
    )
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 560
    runtime.playerSprite.y = guard.y
    runtime.playerSprite.setFlipX(false)
    guard.x = 720
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(guard.body.enable).toBe(false)
    expect(guard.playCalls.at(-1)).toEqual({
      key: enemyActorDefinitions['armor-guard'].sprites?.death?.key,
      ignoreIfPlaying: true,
    })
  })

  it('does not apply enemy contact damage during Homing Attack', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(guard).toBeDefined()
    expect(core).toBeDefined()
    if (!guard || !core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    runtime.playerSprite.velocityX = 0
    runtime.playerSprite.velocityY = 0

    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.playCalls.at(-1)).not.toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite.velocityY).toBe(0)
  })

  it('falls back to airborne melee when no Homing target can be acquired', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 3000
    runtime.playerSprite.y = 320
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()

    const hitbox = runtime.images.find((image) => image.texture === 'attack-hitbox')
    expect(hitbox).toMatchObject({
      texture: 'attack-hitbox',
      visible: false,
    })
  })

  it('recovers Homing attack readiness after prototype delay', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)

    runtime.runDelayedCalls(homingAttackTiming.recoveryDelayMs)
    runtime.playerKeys.j.isDown = false
    runtime.scene.update()
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    expect(runtime.images.some((image) => image.texture === 'attack-hitbox')).toBe(true)
  })

  it('clears Homing reticle and target when hurt, dead, and respawned', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(guard).toBeDefined()
    expect(core).toBeDefined()
    if (!guard || !core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.scene.update()
    const reticle = runtime.images.find((image) => image.texture === homingAttackPresentation.reticleTextureKey)
    expect(reticle?.visible).toBe(true)

    runtime.triggerEnemyOverlap(guard)
    expect(reticle?.visible).toBe(false)

    runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
    runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)
    runtime.triggerEnemyOverlap(guard)
    runtime.runDelayedCalls(playerLifeTiming.hurtRecoveryDelayMs)
    runtime.runDelayedCalls(playerLifeTiming.invulnerabilityRecoveryDelayMs)
    runtime.triggerEnemyOverlap(guard)
    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(reticle?.visible).toBe(false)
  })

  it('does not re-arm attack readiness from homing recovery while dead', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const scene = runtime.scene as typeof runtime.scene & {
      attackReady: boolean
      isPlayerDead: boolean
    }
    expect(scene.attackReady).toBe(false)
    scene.isPlayerDead = true

    runtime.runDelayedCalls(homingAttackTiming.recoveryDelayMs)

    expect(scene.attackReady).toBe(false)
  })

  it('emits Homing trail sprites using attack frame and fades them out', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core || !runtime.playerSprite) return
    startGameplay(runtime)

    runtime.playerSprite.body.blocked.down = false
    runtime.playerSprite.body.touching.down = false
    runtime.playerSprite.x = 1600
    runtime.playerSprite.y = 320
    core.x = 1760
    core.y = 320
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const trailSprites = runtime.spriteCalls.filter(
      (sprite) => sprite.texture === playerActorDefinition.sprites.attack.key && sprite !== runtime.playerSprite,
    )
    expect(trailSprites.length).toBeGreaterThan(2)
    expect(trailSprites[0]).toMatchObject({
      frame: homingAttackPresentation.attackFrame,
      tint: homingAttackPresentation.trailTint,
      blendMode: 'ADD',
      flipX: false,
    })
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: trailSprites[0],
          alpha: 0,
          duration: homingAttackTiming.trailFadeMs,
          delay: homingAttackTiming.trailHoldMs,
        }),
      ]),
    )

    const trailTween = runtime.tweenCalls.find((call) => call.targets === trailSprites[0])
    expect(trailSprites[0]?.destroyed).toBe(false)
    trailTween?.onComplete?.()
    expect(trailSprites[0]?.destroyed).toBe(true)
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

  it('preloads and registers the player crouch animation from the domain actor definition', () => {
    const runtime = createSceneRuntime()
    const crouchSprite = playerActorDefinition.sprites.crouch

    runtime.scene.preload()
    runtime.scene.create()

    expect(runtime.spritesheetCalls).toContainEqual({
      key: crouchSprite.key,
      assetRef: crouchSprite.assetRef,
      frameWidth: crouchSprite.frameWidth,
      frameHeight: crouchSprite.frameHeight,
    })
    expect(runtime.animationCreateCalls).toContainEqual({
      key: crouchSprite.key,
      frames: [
        { key: crouchSprite.key, frame: 0 },
        { key: crouchSprite.key, frame: 1 },
        { key: crouchSprite.key, frame: 2 },
        { key: crouchSprite.key, frame: 3 },
      ],
      frameRate: crouchSprite.frameRate,
      repeat: crouchSprite.repeat,
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
    startGameplay(runtime)

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
    startGameplay(runtime)
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
    startGameplay(runtime)

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const hitbox = runtime.images.find((image) => image.texture === 'attack-hitbox')
    expect(hitbox).toMatchObject({
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

  it('does not start melee or Homing attack while crouching', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)
    expect(runtime.playerSprite?.texture).toBe(playerActorDefinition.sprites.crouch.key)
  })

  it('faces and spawns the melee hitbox left when left and J are pressed on the same frame', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)

    runtime.playerKeys.left.isDown = true
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    const hitbox = runtime.images.find((image) => image.texture === 'attack-hitbox')
    expect(hitbox).toMatchObject({
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
    startGameplay(runtime)

    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    const hitbox = runtime.images.find((image) => image.texture === 'attack-hitbox')
    expect(hitbox).toBeDefined()
    if (!hitbox) return

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
    expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(2)
  })

  it('defeats an enemy that moves into an active melee hitbox before the lifetime ends', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return
    startGameplay(runtime)

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
    startGameplay(runtime)

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
    startGameplay(runtime)

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
    startGameplay(runtime)

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
    startGameplay(runtime)

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

  it('regenerates Armor Guard enemies from their spawn after the respawn delay', () => {
    const stage = createEnemyFixtureStage()
    stage.enemies = [
      {
        id: 'regenerating-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 512,
        patrolMinX: 608,
        patrolMaxX: 832,
        respawnPolicy: 'regenerate',
        respawnDelayMs: 650,
      },
    ]
    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()
    const guard = getEnemySpriteAt(runtime, 720)
    startGameplay(runtime)

    runtime.playerSprite!.x = 672
    runtime.playerSprite!.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(guard.body.enable).toBe(false)
    runtime.playerKeys.j.isDown = false
    runtime.placePlayerNear(128, 512)
    guard.x = 999
    guard.setAlpha(0)
    guard.setScale(1.8)

    runtime.runDelayedCalls(650)

    expect(guard.x).toBe(720)
    expect(guard.visible).toBe(true)
    expect(guard.alpha).toBe(1)
    expect(guard.scale).toBe(enemyActorDefinitions['armor-guard'].scale)
    expect(guard.body.enable).toBe(true)
    expect(guard.playCalls.at(-1)).toEqual({
      key: enemyActorDefinitions['armor-guard'].sprites?.walk.key,
      ignoreIfPlaying: true,
    })
  })

  it('regenerates Azure Core enemies with materialize tween before re-enabling the body', () => {
    const stage = createEnemyFixtureStage()
    stage.enemies = [
      {
        id: 'regenerating-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
        respawnPolicy: 'regenerate',
        respawnDelayMs: 650,
      },
    ]
    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()
    const core = getEnemySpriteAt(runtime, 1760)
    startGameplay(runtime)

    runtime.playerSprite!.x = 1712
    runtime.playerSprite!.y = core.y
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()

    runtime.playerKeys.z.isDown = false
    runtime.placePlayerNear(128, 512)
    runtime.runDelayedCalls(650)

    const materializeTween = runtime.tweenCalls.at(-1)
    expect(core.visible).toBe(true)
    expect(core.alpha).toBe(enemyRegenerationPresentation.azureCore.startAlpha)
    expect(core.scale).toBe(enemyRegenerationPresentation.azureCore.startScale)
    expect(core.body.enable).toBe(false)
    expect(materializeTween).toMatchObject({
      targets: core,
      scale: enemyRegenerationPresentation.azureCore.endScale,
      alpha: enemyRegenerationPresentation.azureCore.endAlpha,
      duration: enemyRegenerationPresentation.azureCore.durationMs,
      ease: enemyRegenerationPresentation.azureCore.ease,
    })

    materializeTween?.onComplete?.()

    expect(core.body.enable).toBe(true)
  })

  it('keeps a short-delay Azure Core regeneration visible after the defeat hide callback fires', () => {
    const stage = createEnemyFixtureStage()
    stage.enemies = [
      {
        id: 'fast-regenerating-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
        respawnPolicy: 'regenerate',
        respawnDelayMs: 200,
      },
    ]
    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()
    const core = getEnemySpriteAt(runtime, 1760)
    startGameplay(runtime)

    runtime.playerSprite!.x = 1712
    runtime.playerSprite!.y = core.y
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()

    runtime.playerKeys.z.isDown = false
    runtime.placePlayerNear(128, 512)
    runtime.runDelayedCalls(200)
    expect(core.visible).toBe(true)

    runtime.runDelayedCalls(320)

    expect(core.visible).toBe(true)
    expect(core.body.enable).toBe(false)
  })

  it('keeps non-scoring regenerating enemies out of defeated HUD score and restores their marker after regeneration', () => {
    const stage = createEnemyFixtureStage()
    stage.enemies = [
      {
        id: 'regenerating-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
        respawnPolicy: 'regenerate',
        respawnDelayMs: 650,
        countsForScore: false,
      },
    ]
    const runtime = createSceneRuntime({ stage })
    runtime.scene.create()
    const core = getEnemySpriteAt(runtime, 1760)
    startGameplay(runtime)

    runtime.playerSprite!.x = 1712
    runtime.playerSprite!.y = core.y
    runtime.playerKeys.z.isDown = true
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enemiesDefeated: 0,
          enemyMarkers: [],
        }),
      ]),
    )

    runtime.playerKeys.z.isDown = false
    runtime.placePlayerNear(128, 512)
    runtime.runDelayedCalls(650)
    runtime.tweenCalls.at(-1)?.onComplete?.()

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      enemyMarkers: [
        expect.objectContaining({
          x: 1760 / stage.world.width,
          y: 320 / stage.world.height,
        }),
      ],
    })
  })

  it('applies survived enemy contact damage with hurt knockback, animation, and blink', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
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
    startGameplay(runtime)
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

  it('blocks enemy contact damage while crouching', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.playCalls).not.toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.crouch.body.width,
      height: playerActorDefinition.crouch.body.height,
    })
  })

  it('blocks enemy contact damage on the same crouch-input frame before movement refresh', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.playCalls).not.toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('applies enemy contact damage on the same crouch-release frame using live state', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.down.isDown = false
    runtime.playerSprite.x = 650
    guard.x = 720
    runtime.triggerEnemyOverlap(guard)

    expect(runtime.playerSprite.playCalls).toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('damages and hurts the player on spike hazard overlap', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    startGameplay(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.playerSprite.x = spike.x - 20
    runtime.triggerHazardOverlap(spike)

    expect(runtime.playerSprite.velocityX).toBe(-360)
    expect(runtime.playerSprite.velocityY).toBe(-360)
    expect(runtime.playerSprite.playCalls).toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: runtime.playerSprite,
          alpha: playerHurtPresentation.blinkAlpha,
          duration: playerHurtPresentation.blinkDurationMs,
          yoyo: playerHurtPresentation.blinkYoyo,
          repeat: playerHurtPresentation.blinkRepeat,
        }),
      ]),
    )
  })

  it('does not apply repeated spike hazard damage while invulnerable', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    startGameplay(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.triggerHazardOverlap(spike)
    runtime.triggerHazardOverlap(spike)

    const hurtTweens = runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite)
    expect(hurtTweens).toHaveLength(1)
  })

  it('blocks spike hazard damage while crouching', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    startGameplay(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerSprite.x = spike.x - 20
    runtime.triggerHazardOverlap(spike)

    expect(runtime.playerSprite.playCalls).not.toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.crouch.body.width,
      height: playerActorDefinition.crouch.body.height,
    })
  })

  it('blocks spike hazard damage on the same crouch-input frame before movement refresh', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    startGameplay(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.playerSprite.x = spike.x - 20
    runtime.triggerHazardOverlap(spike)

    expect(runtime.playerSprite.playCalls).not.toContainEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('starts the death transition when spike hazard damage defeats the player', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    startGameplay(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)

    expect(runtime.playerSprite.playCalls).toContainEqual({
      key: playerActorDefinition.sprites.death.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.delayedCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          delay: playerLifeTiming.deathRespawnDelayMs,
        }),
      ]),
    )

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    expect(runtime.cameraFadeOutCalls).toContainEqual({
      duration: playerDeathTransitionPresentation.fadeOutDurationMs,
      red: playerDeathTransitionPresentation.color.red,
      green: playerDeathTransitionPresentation.color.green,
      blue: playerDeathTransitionPresentation.color.blue,
    })

    runtime.triggerFadeOutComplete()
    expect(runtime.cameraFadeInCalls).toContainEqual({
      duration: playerDeathTransitionPresentation.fadeInDurationMs,
      red: playerDeathTransitionPresentation.color.red,
      green: playerDeathTransitionPresentation.color.green,
      blue: playerDeathTransitionPresentation.color.blue,
    })
    expect(runtime.playerSprite.x).toBe(runtime.stage.player.spawn.x)
    expect(runtime.playerSprite.y).toBe(436)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.alpha).toBe(1)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('blocks spike hazard damage during Homing Attack', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    const scene = runtime.scene as typeof runtime.scene & { isHomingAttacking: boolean }
    scene.isHomingAttacking = true
    runtime.triggerHazardOverlap(spike)

    const hurtTweens = runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite)
    expect(hurtTweens).toHaveLength(0)
  })

  it('blocks spike hazard damage after player death', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike || !runtime.playerSprite) return

    const scene = runtime.scene as typeof runtime.scene & { isPlayerDead: boolean }
    scene.isPlayerDead = true
    runtime.triggerHazardOverlap(spike)

    const hurtTweens = runtime.tweenCalls.filter((call) => call.targets === runtime.playerSprite)
    expect(hurtTweens).toHaveLength(0)
  })

  it('ignores repeated enemy contact while invulnerable and restores attack after hurt recovery', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard || !runtime.playerSprite) return
    startGameplay(runtime)

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

    expect(runtime.images.find((image) => image.texture === 'attack-hitbox')).toBeDefined()
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.attack.key,
      ignoreIfPlaying: true,
    })
  })

  it('restores player alpha after invulnerability recovery', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
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
    startGameplay(runtime)

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
    startGameplay(runtime)

    runtime.playerSprite.x = 540
    runtime.playerSprite.y = guard.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()
    const hitbox = runtime.images.find((image) => image.texture === 'attack-hitbox')
    expect(hitbox).toBeDefined()
    if (!hitbox) return
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
    startGameplay(runtime)
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

    expect(runtime.cameraFadeOutCalls).toEqual([{
      duration: playerDeathTransitionPresentation.fadeOutDurationMs,
      red: playerDeathTransitionPresentation.color.red,
      green: playerDeathTransitionPresentation.color.green,
      blue: playerDeathTransitionPresentation.color.blue,
    }])
    expect(runtime.playerSprite.x).toBe(650)
    expect(runtime.cameraFadeInCalls).toHaveLength(0)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.death.key,
      ignoreIfPlaying: true,
    })

    runtime.triggerFadeOutComplete()

    expect(runtime.playerSprite.x).toBe(runtime.stage.player.spawn.x)
    expect(runtime.playerSprite.y).toBe(436)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.alpha).toBe(1)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.cameraFadeInCalls).toEqual([{
      duration: playerDeathTransitionPresentation.fadeInDurationMs,
      red: playerDeathTransitionPresentation.color.red,
      green: playerDeathTransitionPresentation.color.green,
      blue: playerDeathTransitionPresentation.color.blue,
    }])

    runtime.triggerEnemyOverlap(guard)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('keeps stage spawn respawn before activating any checkpoint', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    expect(runtime.playerSprite).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 2400
    guard.x = 2460
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(runtime.playerSprite.x).toBe(runtime.stage.player.spawn.x)
    expect(runtime.playerSprite.y).toBe(436)
  })

  it('respawns at the activated checkpoint spawn after death', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    expect(runtime.playerSprite).toBeDefined()
    if (!guard || !runtime.playerSprite) return
    startGameplay(runtime)

    const { checkpoint } = getCheckpointSprite(runtime, 'combat-gate')
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()

    guard.x = checkpoint.spawnX + 60
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    expect(runtime.playerSprite.x).toBe(checkpoint.x)
    expect(runtime.cameraFadeInCalls).toHaveLength(0)

    runtime.triggerFadeOutComplete()

    expect(runtime.playerSprite.x).toBe(checkpoint.spawnX)
    expect(runtime.playerSprite.y).toBe(436)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.alpha).toBe(1)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('prevents movement, attack, and repeated contact damage while dead before respawn', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
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

    expect(runtime.images.filter((image) => image.texture === 'attack-hitbox')).toHaveLength(0)
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
      startGameplay(runtime)
      const expectedRespawnX =
        position.x >= runtime.stage.checkpoints[0].x
          ? runtime.stage.checkpoints[0].spawnX
          : runtime.stage.player.spawn.x

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

      expect(runtime.cameraFadeOutCalls).toEqual([{
        duration: playerDeathTransitionPresentation.fadeOutDurationMs,
        red: playerDeathTransitionPresentation.color.red,
        green: playerDeathTransitionPresentation.color.green,
        blue: playerDeathTransitionPresentation.color.blue,
      }])
      expect(runtime.playerSprite.x).toBe(position.x)
      expect(runtime.playerSprite.y).toBe(position.y)

      runtime.triggerFadeOutComplete()

      expect(runtime.playerSprite.x).toBe(expectedRespawnX)
      expect(runtime.playerSprite.y).toBe(436)
      expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
        key: playerActorDefinition.sprites.idle.key,
        ignoreIfPlaying: true,
      })
      expect(runtime.cameraFadeInCalls).toEqual([{
        duration: playerDeathTransitionPresentation.fadeInDurationMs,
        red: playerDeathTransitionPresentation.color.red,
        green: playerDeathTransitionPresentation.color.green,
        blue: playerDeathTransitionPresentation.color.blue,
      }])
    }
  })

  it('updates left movement with drag, negative acceleration, flip, and run animation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.scene.update(0, 0)
    runtime.playerKeys.left.isDown = true

    runtime.scene.update(16, 16)

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
    runtime.scene.update(0, 0)
    runtime.playerKeys.right.isDown = true

    runtime.scene.update(16, 16)

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
    runtime.scene.update(0, 0)
    runtime.playerKeys.a.isDown = true

    runtime.scene.update(16, 16)

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
    runtime.scene.update(0, 0)
    runtime.playerKeys.d.isDown = true

    runtime.scene.update(16, 16)

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
    runtime.scene.update(0, 0)
    runtime.playerKeys.left.isDown = true
    runtime.playerKeys.right.isDown = true

    runtime.scene.update(16, 16)

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
    startGameplay(runtime)
    runtime.scene.update()

    expect(runtime.playerSprite?.dragX).toBe(playerActorDefinition.movement.idleDragX)
    expect(runtime.playerSprite?.accelerationX).toBe(0)
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it.each(['down', 's'] as const)(
    'enters crouch from grounded %s input and restores standing body on release',
    (key) => {
      const runtime = createSceneRuntime()

      runtime.scene.create()
      startGameplay(runtime)

      runtime.playerKeys[key].isDown = true
      runtime.scene.update()

      expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
        key: playerActorDefinition.sprites.crouch.key,
        ignoreIfPlaying: true,
      })
      expect(runtime.playerSprite?.body.size).toEqual({
        width: playerActorDefinition.crouch.body.width,
        height: playerActorDefinition.crouch.body.height,
      })
      expect(runtime.playerSprite?.body.offset).toEqual({
        x: playerActorDefinition.crouch.body.offsetX,
        y: playerActorDefinition.crouch.body.offsetY,
      })
      expect(runtime.playerSprite?.accelerationX).toBe(0)
      expect(runtime.playerSprite?.velocityX).toBe(0)

      runtime.playerKeys[key].isDown = false
      runtime.scene.update()

      expect(runtime.playerSprite?.body.size).toEqual({
        width: playerActorDefinition.body.width,
        height: playerActorDefinition.body.height,
      })
      expect(runtime.playerSprite?.body.offset).toEqual({
        x: playerActorDefinition.body.offsetX,
        y: playerActorDefinition.body.offsetY,
      })
    },
  )

  it('does not crouch while airborne', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    startGameplay(runtime)

    runtime.playerSprite!.body.blocked.down = false
    runtime.playerSprite!.body.touching.down = false
    runtime.playerKeys.down.isDown = true
    runtime.scene.update()

    expect(runtime.playerSprite?.playCalls.at(-1)).not.toEqual({
      key: playerActorDefinition.sprites.crouch.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite?.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
  })

  it('lets a boss projectile pass through on the same crouch-input frame', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)

    const projectile = getBossProjectileSprites(runtime)[0]
    expect(projectile).toBeDefined()
    expect(runtime.playerSprite).toBeDefined()
    if (!projectile || !runtime.playerSprite) return

    projectile.x = runtime.playerSprite.x
    projectile.y = runtime.playerSprite.y
    runtime.playerKeys.down.isDown = true

    runtime.scene.update(32, 16)

    expect(projectile.destroyed).toBe(false)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.crouch.key,
      ignoreIfPlaying: true,
    })
    expect(
      runtime.playerSprite.playCalls.some(
        (call) => call.key === playerActorDefinition.sprites.hurt.key,
      ),
    ).toBe(false)
  })

  it('lets boss projectile hits pass through while crouching', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    runtime.playerKeys.down.isDown = true
    runtime.scene.update()

    const projectile = getBossProjectileSprites(runtime)[0]
    expect(projectile).toBeDefined()
    if (!projectile || !runtime.playerSprite) return
    projectile.x = runtime.playerSprite.x
    projectile.y = runtime.playerSprite.y

    runtime.scene.update()

    expect(projectile.destroyed).toBe(false)
    expect(
      runtime.hudUpdates.filter((patch) => patch.damageTaken !== undefined).at(-1),
    ).not.toMatchObject({
      hp: 2,
      damageTaken: 1,
    })
  })

  it('successful jump exits crouch, restores standing body, and plays jump animation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    startGameplay(runtime)

    runtime.playerKeys.down.isDown = true
    runtime.scene.update(32, 16)

    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.crouch.key,
      ignoreIfPlaying: true,
    })
    expect(runtime.playerSprite?.body.size).toEqual({
      width: playerActorDefinition.crouch.body.width,
      height: playerActorDefinition.crouch.body.height,
    })

    runtime.playerKeys.space.isDown = true
    runtime.scene.update(48, 16)

    expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
    expect(runtime.playerSprite?.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
    expect(runtime.playerSprite?.body.offset).toEqual({
      x: playerActorDefinition.body.offsetX,
      y: playerActorDefinition.body.offsetY,
    })
    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.jump.key,
      ignoreIfPlaying: true,
    })
  })

  it('clears crouch before applying hurt presentation', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.down.isDown = false
    const scene = runtime.scene as typeof runtime.scene & {
      applyPlayerContactDamage: (sourceX: number) => void
      isCrouching: boolean
    }
    scene.isCrouching = true
    scene.applyPlayerContactDamage(runtime.playerSprite.x + 16)

    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
    expect(runtime.playerSprite.body.offset).toEqual({
      x: playerActorDefinition.body.offsetX,
      y: playerActorDefinition.body.offsetY,
    })
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.hurt.key,
      ignoreIfPlaying: true,
    })
  })

  it('clears crouch before death and respawn', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.down.isDown = false
    const scene = runtime.scene as typeof runtime.scene & {
      applyPlayerContactDamage: (sourceX: number) => void
      isCrouching: boolean
    }
    scene.isCrouching = true

    scene.applyPlayerContactDamage(runtime.playerSprite.x + 16)
    recoverFromSurvivedHurt(runtime)
    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.down.isDown = false
    scene.isCrouching = true
    scene.applyPlayerContactDamage(runtime.playerSprite.x + 16)
    recoverFromSurvivedHurt(runtime)
    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.down.isDown = false
    scene.isCrouching = true
    scene.applyPlayerContactDamage(runtime.playerSprite.x + 16)

    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
    expect(runtime.playerSprite.body.offset).toEqual({
      x: playerActorDefinition.body.offsetX,
      y: playerActorDefinition.body.offsetY,
    })
  })

  it('clears crouch on stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    startGameplay(runtime)
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()

    runtime.triggerGoalOverlap(getGoalSprite(runtime))

    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('clears crouch on boss phase reset', () => {
    const stage = getGameplayStageMap('1-6')
    expect(stage).toBeDefined()
    if (!stage) return
    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()
    startGameplay(runtime)
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerKeys.down.isDown = true
    runtime.scene.update()
    runtime.playerKeys.down.isDown = false
    const scene = runtime.scene as typeof runtime.scene & {
      handleBossPrototypeHit: () => boolean
      isCrouching: boolean
    }
    scene.isCrouching = true

    expect(scene.handleBossPrototypeHit()).toBe(true)

    expect(runtime.playerSprite.body.size).toEqual({
      width: playerActorDefinition.body.width,
      height: playerActorDefinition.body.height,
    })
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })

  it('applies jump velocity for a grounded Space press', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.scene.update(0, 0)
    runtime.playerKeys.space.isDown = true

    runtime.scene.update(16, 16)

    expect(runtime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  })

  it('plays the jump animation on the grounded jump launch frame', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.scene.update(0, 0)
    runtime.playerKeys.space.isDown = true

    runtime.scene.update(16, 16)

    expect(runtime.playerSprite?.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.jump.key,
      ignoreIfPlaying: true,
    })
  })

  it('maps ArrowUp and W to jump press rising edges', () => {
    const upRuntime = createSceneRuntime()
    upRuntime.scene.create()
    upRuntime.scene.update(0, 0)
    upRuntime.playerKeys.up.isDown = true
    upRuntime.scene.update(16, 16)

    const wRuntime = createSceneRuntime()
    wRuntime.scene.create()
    wRuntime.scene.update(0, 0)
    wRuntime.playerKeys.w.isDown = true
    wRuntime.scene.update(16, 16)

    expect(upRuntime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
    expect(wRuntime.playerSprite?.velocityY).toBe(playerActorDefinition.jump.velocityY)
  })

  it('allows one air jump and rejects a third jump until landing', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()
    runtime.scene.update(0, 0)
    runtime.playerKeys.space.isDown = true
    runtime.scene.update(16, 16)
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
    startGameplay(runtime)
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

describe('gameplay renderer pause controller contract', () => {
  it('exposes explicit pause, resume, reset timing, and destroy controls', () => {
    expect(rendererSource).toContain('export type GameplayRendererController')
    expect(rendererSource).toContain('pause: () => void')
    expect(rendererSource).toContain('resume: () => void')
    expect(rendererSource).toContain('resetTiming: () => void')
    expect(rendererSource).toContain('destroy: () => void')
    expect(rendererSource).toContain('game.scene.pause(sceneKey)')
    expect(rendererSource).toContain('game.scene.resume(sceneKey)')
    expect(rendererSource).toContain('game.loop.resetDelta()')
    expect(rendererSource).not.toContain('pause.resume')
    expect(rendererSource).not.toContain('pause.stageSelect')
  })
})

describe('gameplay renderer sfx contract', () => {
  it('emits typed gameplay sfx actions through the renderer callback boundary', () => {
    expect(rendererSource).toContain("import type { GameplaySfxAction } from '../../domain/audio/audioPolicy'")
    expect(rendererSource).toContain('onSfx?: (action: GameplaySfxAction) => void')
    expect(rendererSource).toContain('private emitGameplaySfx(action: GameplaySfxAction): void')
    expect(rendererSource).toContain('this.options.onSfx?.(action)')
    expect(rendererSource).toContain("this.emitGameplaySfx('coin-collected')")
    expect(rendererSource).toContain("this.emitGameplaySfx('checkpoint-activated')")
    expect(rendererSource).toContain("this.emitGameplaySfx('goal-opened')")
    expect(rendererSource).toContain("this.emitGameplaySfx('player-hit')")
    expect(rendererSource).toContain("this.emitGameplaySfx('player-death')")
    expect(rendererSource).toContain("this.emitGameplaySfx('player-footstep')")
    expect(rendererSource).toContain('getPlayerMovementFootstepDecision')
    expect(rendererSource).toContain('private wasPlayerGroundedForSfx = true')
    expect(rendererSource).toContain('private nextPlayerFootstepSfxAt = 0')
    expect(rendererSource).toContain('private updatePlayerMovementSfx(grounded: boolean, moving: boolean): void')
    expect(rendererSource).not.toContain('armor-guard-step')
    expect(rendererSource).not.toContain('emitArmorGuardStepSfx')
    expect(rendererSource).not.toContain('projectrun:sfx')
  })
})
