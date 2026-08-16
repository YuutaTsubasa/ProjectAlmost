import { describe, expect, it } from 'vitest'
import { isBossStageDefinition } from './bossBattle'
import { convertGameplayStageSource } from './gameplayStageMapConverter'
import { getGameplayStageMap } from './gameplayStageMaps'
import type { GameplayStageSource } from './gameplayStageSource'
import { gameplayStageVisualProfiles } from './gameplayStageVisualProfile'

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
    const result = convertGameplayStageSource(firstGateSource, gameplayStageVisualProfiles)

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
    const result = convertGameplayStageSource(firstGateSource, gameplayStageVisualProfiles)

    expect(result.map.coins).toEqual([
      { id: '1-1-coin-001', x: 420, y: 456 },
      { id: '1-1-coin-002', x: 560, y: 456 },
    ])
  })

  it('converts supported moving platform source data into runtime map spawns', () => {
    const source = {
      ...firstGateSource,
      movingPlatforms: [
        {
          id: 'first-vine-lift',
          col: 26,
          row: 9,
          width: 4,
          height: 1,
          axis: 'y',
          distance: 72,
          durationMs: 2100,
        },
        {
          id: 'thorn-gap-ferry',
          col: 52,
          row: 9,
          width: 4,
          height: 1,
          axis: 'x',
          distance: 112,
          durationMs: 2600,
          phase: 0.35,
        },
      ],
    } satisfies GameplayStageSource

    const result = convertGameplayStageSource(source, gameplayStageVisualProfiles)

    expect(result.map.movingPlatforms).toEqual([
      {
        id: 'first-vine-lift',
        col: 26,
        row: 9,
        width: 4,
        height: 1,
        axis: 'y',
        distance: 72,
        durationMs: 2100,
        phase: 0,
        origin: { x: 1792, y: 608 },
      },
      {
        id: 'thorn-gap-ferry',
        col: 52,
        row: 9,
        width: 4,
        height: 1,
        axis: 'x',
        distance: 112,
        durationMs: 2600,
        phase: 0.35,
        origin: { x: 3456, y: 608 },
      },
    ])
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === 'unsupported-moving-platform')).toBe(false)
  })

  it('converts prototype guard enemy shapes into Armor Guard runtime spawns', () => {
    const result = convertGameplayStageSource(firstGateSource, gameplayStageVisualProfiles)

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

  it('converts World 02 source enemy types into placement-specific gameplay spawns', () => {
    const result = convertGameplayStageSource({
      ...firstGateSource,
      theme: 'emerald-sanctuary',
      enemies: [
        {
          id: 'beetle-a',
          type: 'thorn-beetle',
          x: 420,
          surfaceY: 640,
          patrolMinX: 360,
          patrolMaxX: 520,
        },
        {
          id: 'lantern-a',
          type: 'seed-lantern',
          x: 900,
          y: 420,
          patrolMinX: 900,
          patrolMaxX: 900,
          respawnDelayMs: 650,
        },
      ],
    }, gameplayStageVisualProfiles)

    expect(result.map.enemies).toEqual([
      {
        id: 'beetle-a',
        type: 'thorn-beetle',
        x: 420,
        surfaceY: 640,
        patrolMinX: 360,
        patrolMaxX: 520,
      },
      {
        id: 'lantern-a',
        type: 'seed-lantern',
        x: 900,
        y: 420,
        patrolMinX: 900,
        patrolMaxX: 900,
        respawnDelayMs: 650,
      },
    ])
  })

  it('uses World 02 enemy identities in playable stages before the boss stage', () => {
    for (const stageId of ['2-1', '2-2', '2-3', '2-4', '2-5'] as const) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      const enemyTypes = new Set(stage!.enemies.map((enemy) => enemy.type))

      expect(enemyTypes.has('thorn-beetle')).toBe(true)
      expect(enemyTypes.has('seed-lantern')).toBe(true)
      expect(enemyTypes.has('armor-guard')).toBe(false)
      expect(enemyTypes.has('azure-core')).toBe(false)
    }
  })

  it('keeps the World 02 boss placeholder as Azure Core for the later boss slice', () => {
    const stage = getGameplayStageMap('2-6')
    if (!stage) {
      throw new Error('Expected World 02 stage 2-6 to exist.')
    }
    expect(stage.enemies.find((enemy) => enemy.id === 'boss-prototype')).toMatchObject({
      id: 'boss-prototype',
      type: 'azure-core',
    })
  })

  it('preserves boss prototype metadata for runtime boss detection', () => {
    const source = {
      ...firstGateSource,
      id: '1-6',
      enemies: [
        {
          id: 'boss-prototype',
          type: 'azure-core',
          x: 5880,
          y: 384,
          patrolMinX: 5880,
          patrolMaxX: 5880,
          respawnPolicy: 'persistent',
          countsForScore: true,
        },
      ],
    } satisfies GameplayStageSource

    const result = convertGameplayStageSource(source, gameplayStageVisualProfiles)

    expect(result.map.enemies[0]).toMatchObject({
      id: 'boss-prototype',
      type: 'azure-core',
      respawnPolicy: 'persistent',
      countsForScore: true,
    })
    expect(isBossStageDefinition({
      stageId: result.map.id,
      enemies: result.map.enemies,
    })).toBe(true)
  })

  it('preserves regeneration delay metadata for runtime enemy respawns', () => {
    const source = {
      ...firstGateSource,
      enemies: [
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
      ],
    } satisfies GameplayStageSource

    const result = convertGameplayStageSource(source, gameplayStageVisualProfiles)

    expect(result.map.enemies[0]).toMatchObject({
      id: 'regenerating-core',
      respawnPolicy: 'regenerate',
      respawnDelayMs: 650,
      countsForScore: false,
    })
  })

  it('emits diagnostics only for unsupported mechanics without putting them into the runtime map', () => {
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
      gameplayStageVisualProfiles,
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
      'unsupported-gravity-zone',
      'unsupported-surface-zone',
      'unsupported-hazard',
    ])
    expect(result.diagnostics.map((diagnostic) => diagnostic.sourceId)).toEqual([
      'gravity-a',
      'ice-a',
      'lava-a',
    ])
  })

  it('treats omitted hazards as an empty hazard list', () => {
    const { hazards: _omittedHazards, ...stageWithoutHazards } = firstGateSource

    const result = convertGameplayStageSource(
      stageWithoutHazards as GameplayStageSource,
      gameplayStageVisualProfiles,
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
        gameplayStageVisualProfiles,
      )

      expect(result.map.theme).toBe(theme)
      expect(result.map.backgroundLayers).toHaveLength(3)
      expect(result.map.backgroundLayers.every((layer) => layer.assetRef.startsWith('/assets/'))).toBe(
        true,
      )
      expect(result.map.terrain.tilesetAssetRef).toMatch(/^\/assets\//)
      expect(result.diagnostics).toEqual([])
    }
  })

  it('uses complete non-white theme profiles without fallback diagnostics', () => {
    const result = convertGameplayStageSource(
      {
        ...firstGateSource,
        theme: 'emerald-sanctuary',
      },
      gameplayStageVisualProfiles,
    )

    expect(result.map.theme).toBe('emerald-sanctuary')
    expect(result.map.backgroundLayers.map((layer) => layer.assetRef)).toEqual([
      '/assets/maps/emerald_sanctuary_sky.webp',
      '/assets/maps/emerald_sanctuary_far_bg.webp',
      '/assets/maps/emerald_sanctuary_mid_bg_loop.webp',
    ])
    expect(result.map.backgroundLayers[2]).toMatchObject({
      id: 'mid',
      width: 3840,
    })
    expect(result.map.terrain.tilesetAssetRef).toBe(
      '/assets/tiles/emerald_sanctuary_platform_tiles_surface_aligned.webp',
    )
    expect(result.diagnostics).toEqual([])
  })
})
