import { describe, expect, it } from 'vitest'
import { convertGameplayStageSource } from './gameplayStageMapConverter'
import { defaultGameplayThemeAssets, type GameplayStageSource } from './gameplayStageSource'

const firstGateSource: GameplayStageSource = {
  id: '1-1',
  rankTargets: {
    sTime: 30,
    aTime: 42,
    bTime: 58,
    cTime: 78,
  },
  world: {
    width: 9600,
    height: 1080,
    tileSize: 64,
  },
  playerSpawn: {
    x: 256,
    surfaceY: 512,
  },
  platforms: [
    { col: 2, row: 8, width: 12, height: 1 },
    { col: 16, row: 8, width: 5, height: 1 },
  ],
  coins: [
    { x: 420, y: 456 },
    { x: 560, y: 456 },
  ],
  enemies: [
    {
      id: 'first-guard',
      x: 720,
      surfaceY: 512,
      patrolMinX: 608,
      patrolMaxX: 832,
    },
    {
      id: 'first-core',
      type: 'azure-core',
      x: 1760,
      y: 320,
      patrolMinX: 1760,
      patrolMaxX: 1760,
    },
  ],
  hazards: [
    {
      id: 'first-spikes',
      type: 'spikes',
      x: 760,
      surfaceY: 512,
      width: 180,
      height: 62,
      orientation: 'floor',
    },
  ],
  checkpoints: [
    {
      id: 'combat-gate',
      x: 2540,
      surfaceY: 512,
      spawnX: 2600,
      spawnSurfaceY: 512,
    },
  ],
  goal: {
    x: 9340,
    surfaceY: 512,
  },
}

describe('convertGameplayStageSource', () => {
  it('converts supported stage source fields into a renderer-ready gameplay map', () => {
    const result = convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)

    expect(result.diagnostics).toEqual([])
    expect(result.map).toMatchObject({
      id: '1-1',
      theme: 'white-palace',
      world: {
        width: 9600,
        height: 1080,
        tileSize: 64,
      },
      rankTargets: {
        sTime: 30,
        aTime: 42,
        bTime: 58,
        cTime: 78,
      },
      player: {
        actorId: 'player',
        spawn: {
          x: 256,
          surfaceY: 512,
        },
      },
      terrain: {
        tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
        solidTileIndexes: [0, 1, 2],
        platforms: firstGateSource.platforms,
      },
      goal: {
        x: 9340,
        surfaceY: 512,
      },
    })
    expect(result.map.backgroundLayers.map((layer) => layer.id)).toEqual(['sky', 'far', 'mid'])
    expect(result.map.backgroundLayers.map((layer) => layer.assetRef)).toEqual([
      '/assets/maps/white_palace_sky.webp',
      '/assets/maps/white_palace_far_bg.webp',
      '/assets/maps/white_palace_mid_bg_loop.webp',
    ])
  })

  it('assigns stable coin ids from stage id and source order', () => {
    const result = convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)

    expect(result.map.coins).toEqual([
      { id: '1-1-coin-001', x: 420, y: 456 },
      { id: '1-1-coin-002', x: 560, y: 456 },
    ])
  })

  it('converts prototype guard enemy shapes into Armor Guard runtime spawns', () => {
    const result = convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)

    expect(result.map.enemies).toEqual([
      {
        id: 'first-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 512,
        patrolMinX: 608,
        patrolMaxX: 832,
      },
      {
        id: 'first-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
      },
    ])
  })

  it('emits diagnostics for unsupported mechanics without putting them into the runtime map', () => {
    const result = convertGameplayStageSource(
      {
        ...firstGateSource,
        movingPlatforms: [
          {
            id: 'moving-a',
            col: 10,
            row: 8,
            width: 4,
            height: 1,
            axis: 'x',
            distance: 112,
            durationMs: 2600,
          },
        ],
        gravityZones: [
          {
            id: 'gravity-a',
            x: 400,
            y: 0,
            width: 640,
            height: 1080,
            direction: 'up',
          },
        ],
        surfaceZones: [
          {
            id: 'ice-a',
            type: 'ice',
            x: 900,
            y: 0,
            width: 1200,
            height: 1080,
          },
        ],
        hazards: [
          ...(firstGateSource.hazards ?? []),
          {
            id: 'lava-a',
            type: 'lava',
            x: 1000,
            surfaceY: 700,
            width: 300,
            height: 64,
          },
        ],
      },
      defaultGameplayThemeAssets,
    )

    expect(result.map.hazards).toEqual([
      {
        id: 'first-spikes',
        type: 'spikes',
        x: 760,
        surfaceY: 512,
        width: 180,
        height: 62,
        orientation: 'floor',
      },
    ])
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'unsupported-moving-platform',
      'unsupported-gravity-zone',
      'unsupported-surface-zone',
      'unsupported-hazard',
    ])
    expect(result.diagnostics.map((diagnostic) => diagnostic.sourceId)).toEqual([
      'moving-a',
      'gravity-a',
      'ice-a',
      'lava-a',
    ])
  })

  it('treats omitted hazards as an empty hazard list', () => {
    const { hazards: _omittedHazards, ...stageWithoutHazards } = firstGateSource

    const result = convertGameplayStageSource(
      stageWithoutHazards as GameplayStageSource,
      defaultGameplayThemeAssets,
    )

    expect(result.map.hazards).toEqual([])
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === 'unsupported-hazard')).toBe(
      false,
    )
  })

  it('maps every supported theme to renderable asset refs', () => {
    const themeIds = [
      'white-palace',
      'emerald-sanctuary',
      'cerulean-depths',
      'frostveil-peaks',
      'emberfall-caldera',
      'abyssal-hollow',
    ] as const

    for (const theme of themeIds) {
      const result = convertGameplayStageSource(
        {
          ...firstGateSource,
          theme,
        },
        defaultGameplayThemeAssets,
      )

      expect(result.map.theme).toBe(theme)
      expect(result.map.backgroundLayers).toHaveLength(3)
      expect(result.map.backgroundLayers.every((layer) => layer.assetRef.startsWith('/assets/'))).toBe(true)
      expect(result.map.terrain.tilesetAssetRef).toMatch(/^\/assets\//)
    }
  })

  it('emits a theme asset fallback diagnostic for non-white themes while still producing renderable assets', () => {
    const result = convertGameplayStageSource(
      {
        ...firstGateSource,
        theme: 'emerald-sanctuary',
      },
      defaultGameplayThemeAssets,
    )

    expect(result.map.theme).toBe('emerald-sanctuary')
    expect(result.map.backgroundLayers.every((layer) => layer.assetRef.startsWith('/assets/'))).toBe(
      true,
    )
    expect(result.map.terrain.tilesetAssetRef).toMatch(/^\/assets\//)
    expect(result.diagnostics).toEqual([
      {
        stageId: '1-1',
        code: 'theme-asset-fallback',
        sourceId: 'emerald-sanctuary',
        message: 'Stage 1-1 uses fallback gameplay assets for theme emerald-sanctuary.',
      },
    ])
  })
})
