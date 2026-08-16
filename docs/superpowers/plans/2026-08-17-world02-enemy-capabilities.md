# World 02 Enemy Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add World 02 Thorn Beetle and Seed Lantern enemies while replacing type-name renderer branching with reusable enemy capabilities.

**Architecture:** Keep enemy behavior in `src/domain/gameplay/enemyActor.ts` as immutable definitions and pure functions. Convert stage source enemies into placement-specific spawn unions, then let the Phaser renderer consume placement, behavior, physics, visual, scoring, and respawn capabilities instead of assuming only Armor Guard and Azure Core exist.

**Tech Stack:** TypeScript, Vitest, Svelte/Vite, Phaser Arcade Physics, generated WebP sprite assets under `public/assets/sprites/`.

---

## File Structure

- Modify `src/domain/gameplay/enemyActor.ts`: add enemy capabilities, Thorn Beetle and Seed Lantern definitions, capability-based spawn/patrol/scoring/presentation helpers.
- Modify `src/domain/gameplay/enemyActor.test.ts`: lock the new definitions and helper behavior with domain tests.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`: widen `GameplayEnemySpawn` into grounded and airborne unions for all enemy types.
- Modify `src/domain/gameplay/gameplayStageSource.ts`: widen stage source enemy unions for `thorn-beetle` and `seed-lantern`.
- Modify `src/domain/gameplay/gameplayStageMapConverter.ts`: convert enemies by source type and preserve runtime metadata.
- Modify `src/domain/gameplay/gameplayStageMapConverter.test.ts`: prove source conversion and World 02 type migration.
- Modify `src/domain/assets/preloadManifest.ts`: collect enemy sprite asset refs from definitions and stage enemy types.
- Modify `src/domain/assets/preloadManifest.test.ts`: prove new enemy assets preload.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: create, animate, float, defeat, regenerate, and patrol enemies through capability helpers.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: cover capability-based grounded and airborne enemies.
- Modify `src/domain/gameplay/gameplayStageSources.ts`: change `2-1` through `2-5` small enemies to `thorn-beetle` and `seed-lantern`; keep `2-6` `boss-prototype` unchanged.
- Create `public/assets/sprites/thorn_beetle_walk/sheet-transparent.webp`.
- Create `public/assets/sprites/thorn_beetle_death/sheet-transparent.webp`.
- Create `public/assets/sprites/seed_lantern_idle/sheet-transparent.webp`.
- Create `public/assets/sprites/thorn_beetle_walk/pipeline-meta.json`.
- Create `public/assets/sprites/thorn_beetle_death/pipeline-meta.json`.
- Create `public/assets/sprites/seed_lantern_idle/pipeline-meta.json`.

---

### Task 1: Domain Enemy Capability Model

**Files:**
- Modify: `src/domain/gameplay/enemyActor.test.ts`
- Modify: `src/domain/gameplay/enemyActor.ts`

- [ ] **Step 1: Write failing tests for new enemy definitions and capability defaults**

Add these cases to `src/domain/gameplay/enemyActor.test.ts`:

```ts
it('defines the World 02 Thorn Beetle as a grounded patrol enemy', () => {
  expect(enemyActorDefinitions['thorn-beetle']).toMatchObject({
    type: 'thorn-beetle',
    placement: 'grounded',
    behavior: 'patrol',
    gravity: true,
    sprites: {
      walk: {
        key: 'thorn-beetle-walk',
        assetRef: '/assets/sprites/thorn_beetle_walk/sheet-transparent.webp',
      },
      death: {
        key: 'thorn-beetle-death',
        assetRef: '/assets/sprites/thorn_beetle_death/sheet-transparent.webp',
      },
    },
    patrol: {
      initialDirection: -1,
      speed: 72,
    },
  })
})

it('defines the World 02 Seed Lantern as an airborne Homing target', () => {
  expect(enemyActorDefinitions['seed-lantern']).toMatchObject({
    type: 'seed-lantern',
    placement: 'airborne',
    behavior: 'homing-target',
    gravity: false,
    sprites: {
      idle: {
        key: 'seed-lantern-idle',
        assetRef: '/assets/sprites/seed_lantern_idle/sheet-transparent.webp',
      },
    },
    floating: {
      yOffset: -16,
      angle: 8,
      durationMs: 1050,
      ease: 'Sine.easeInOut',
    },
  })
})

it('uses enemy definitions for score and respawn defaults', () => {
  expect(enemyCountsForScore({ type: 'thorn-beetle' })).toBe(true)
  expect(enemyCountsForScore({ type: 'seed-lantern' })).toBe(false)
  expect(getEnemyDefeatOutcome({ type: 'thorn-beetle' })).toEqual({
    scoreDelta: 1,
    shouldRegenerate: false,
  })
  expect(getEnemyDefeatOutcome({ type: 'seed-lantern' })).toEqual({
    scoreDelta: 0,
    shouldRegenerate: true,
  })
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: FAIL because `thorn-beetle` and `seed-lantern` are not valid `EnemyActorType` values and their definitions do not exist.

- [ ] **Step 3: Implement the minimal definitions and definition-backed defaults**

In `src/domain/gameplay/enemyActor.ts`, update the type unions and definitions:

```ts
export type EnemyActorType = 'armor-guard' | 'azure-core' | 'thorn-beetle' | 'seed-lantern'
export type EnemyDefeatPresentation =
  | 'armor-guard-death'
  | 'azure-core-burst'
  | 'thorn-beetle-death'
  | 'seed-lantern-burst'
export type EnemyRegenerationPresentation =
  | 'armor-guard-restore'
  | 'azure-core-materialize'
  | 'thorn-beetle-restore'
  | 'seed-lantern-materialize'
```

Extend `EnemyActorDefinition` with rule and visual fields:

```ts
rules: {
  respawnPolicy: EnemyRespawnPolicy
  countsForScore: boolean
}
presentation: {
  defeat: EnemyDefeatPresentation
  regeneration: EnemyRegenerationPresentation
}
```

Add `thorn-beetle` and `seed-lantern` entries to `enemyActorDefinitions` with the values asserted in the tests. Move existing Armor Guard and Azure Core defaults into their definition entries:

```ts
rules: { respawnPolicy: 'persistent', countsForScore: true },
presentation: { defeat: 'armor-guard-death', regeneration: 'armor-guard-restore' },
```

and:

```ts
rules: { respawnPolicy: 'regenerate', countsForScore: false },
presentation: { defeat: 'azure-core-burst', regeneration: 'azure-core-materialize' },
```

Replace `defaultEnemyRules`, `enemyDefeatPresentationByType`, and `getEnemyRegenerationPresentation` branching with lookups through `enemyActorDefinitions[input.type]`.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/gameplay/enemyActor.ts src/domain/gameplay/enemyActor.test.ts
git commit -m "feat: add enemy capability definitions"
```

---

### Task 2: Placement-Based Spawn Types And Conversion

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageSource.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.test.ts`

- [ ] **Step 1: Write failing converter tests**

Add tests to `src/domain/gameplay/gameplayStageMapConverter.test.ts`:

```ts
it('converts World 02 source enemy types into placement-specific gameplay spawns', () => {
  const result = convertGameplayStageSource({
    ...minimalStageSource,
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

it('keeps the World 02 boss placeholder as Azure Core for the later boss slice', () => {
  const stage = getGameplayStageMap('2-6')
  expect(stage.enemies.find((enemy) => enemy.id === 'boss-prototype')).toMatchObject({
    id: 'boss-prototype',
    type: 'azure-core',
  })
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: FAIL because the source and map unions do not accept the new enemy types.

- [ ] **Step 3: Implement spawn and source unions**

In `src/domain/gameplay/gameplayMapTypes.ts`, replace the concrete spawn aliases with placement aliases:

```ts
export type GroundedEnemyActorType = 'armor-guard' | 'thorn-beetle'
export type AirborneEnemyActorType = 'azure-core' | 'seed-lantern'
export type GameplayEnemySpawn = GroundedEnemySpawn | AirborneEnemySpawn

export type GroundedEnemySpawn = GameplayEnemyRuntimeMetadata & {
  id: string
  type: GroundedEnemyActorType
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type AirborneEnemySpawn = GameplayEnemyRuntimeMetadata & {
  id: string
  type: AirborneEnemyActorType
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}
```

In `src/domain/gameplay/gameplayStageSource.ts`, mirror those source unions:

```ts
export type GameplayStageSourceGroundedEnemy = GameplayStageSourceEnemyRuntimeMetadata & {
  id: string
  type?: 'guard' | 'thorn-beetle'
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type GameplayStageSourceAirborneEnemy = GameplayStageSourceEnemyRuntimeMetadata & {
  id: string
  type: 'azure-core' | 'seed-lantern'
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}
```

In `src/domain/gameplay/gameplayStageMapConverter.ts`, convert type `'guard'` or omitted type to `'armor-guard'`, preserve `'thorn-beetle'`, and preserve airborne types:

```ts
function convertEnemy(enemy: GameplayStageSource['enemies'][number]): GameplayEnemySpawn {
  if (enemy.type === 'azure-core' || enemy.type === 'seed-lantern') {
    return {
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
      ...getEnemyRuntimeMetadata(enemy),
    }
  }

  return {
    id: enemy.id,
    type: enemy.type === 'thorn-beetle' ? 'thorn-beetle' : 'armor-guard',
    x: enemy.x,
    surfaceY: enemy.surfaceY,
    patrolMinX: enemy.patrolMinX,
    patrolMaxX: enemy.patrolMaxX,
    ...getEnemyRuntimeMetadata(enemy),
  }
}
```

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageSource.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts
git commit -m "feat: convert enemies by placement"
```

---

### Task 3: Capability Helpers For Spawn, Patrol, And Asset Collection

**Files:**
- Modify: `src/domain/gameplay/enemyActor.test.ts`
- Modify: `src/domain/gameplay/enemyActor.ts`

- [ ] **Step 1: Write failing tests for capability helpers**

Add tests to `src/domain/gameplay/enemyActor.test.ts`:

```ts
it('calculates spawn Y from enemy placement definitions', () => {
  expect(getEnemySpawnY({ type: 'thorn-beetle', surfaceY: 640 })).toBe(574)
  expect(getEnemySpawnY({ type: 'seed-lantern', y: 420 })).toBe(420)
})

it('updates patrol only for active patrol-capable enemies', () => {
  expect(shouldUpdateEnemyPatrol({ type: 'thorn-beetle', defeated: false })).toBe(true)
  expect(shouldUpdateEnemyPatrol({ type: 'seed-lantern', defeated: false })).toBe(false)
  expect(shouldUpdateEnemyPatrol({ type: 'thorn-beetle', defeated: true })).toBe(false)
})

it('collects runtime sprite assets from enemy definitions', () => {
  expect(getEnemySpriteAssetRefs(['thorn-beetle', 'seed-lantern'])).toEqual([
    '/assets/sprites/seed_lantern_idle/sheet-transparent.webp',
    '/assets/sprites/thorn_beetle_death/sheet-transparent.webp',
    '/assets/sprites/thorn_beetle_walk/sheet-transparent.webp',
  ])
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: FAIL because `getEnemySpawnY` still branches by old types, `shouldUpdateEnemyPatrol` still checks Armor Guard directly, and `getEnemySpriteAssetRefs` does not exist.

- [ ] **Step 3: Implement helper functions**

In `src/domain/gameplay/enemyActor.ts`, implement placement/behavior helpers:

```ts
export function getEnemySpawnY(input: EnemySpawnYInput): number {
  const definition = enemyActorDefinitions[input.type]
  if (definition.placement === 'airborne') {
    return input.y
  }

  return input.surfaceY - definition.centerAboveSurface - (definition.visualLiftY ?? 0)
}

export function shouldUpdateEnemyPatrol(input: {
  type: EnemyActorType
  defeated: boolean
}): boolean {
  return enemyActorDefinitions[input.type].behavior === 'patrol' && !input.defeated
}

export function getEnemySpriteAssetRefs(types: readonly EnemyActorType[]): string[] {
  return [...new Set(types.flatMap((type) => {
    const sprites = enemyActorDefinitions[type].sprites
    return sprites ? Object.values(sprites).map((sprite) => sprite.assetRef) : []
  }))].sort()
}
```

Update `EnemySpawnYInput` to be a union that includes all grounded and airborne types.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/gameplay/enemyActor.ts src/domain/gameplay/enemyActor.test.ts
git commit -m "feat: add enemy capability helpers"
```

---

### Task 4: Preload Enemy Assets Through Definitions

**Files:**
- Modify: `src/domain/assets/preloadManifest.test.ts`
- Modify: `src/domain/assets/preloadManifest.ts`

- [ ] **Step 1: Write failing preload tests**

Add tests to `src/domain/assets/preloadManifest.test.ts`:

```ts
it('includes stage enemy sprite assets from the supplied gameplay stage map', () => {
  const stage = getGameplayStageMap('1-1')
  expect(stage).toBeDefined()
  const customizedStage: GameplayStageMap = {
    ...stage!,
    enemies: [
      {
        id: 'beetle-a',
        type: 'thorn-beetle',
        x: 520,
        surfaceY: 640,
        patrolMinX: 420,
        patrolMaxX: 620,
      },
      {
        id: 'lantern-a',
        type: 'seed-lantern',
        x: 900,
        y: 420,
        patrolMinX: 900,
        patrolMaxX: 900,
      },
    ],
  }
  const sources = buildGameplayEntryPreloadPlan(projectData, customizedStage).map((asset) => asset.source)

  expect(sources).toContain('/assets/sprites/thorn_beetle_walk/sheet-transparent.webp')
  expect(sources).toContain('/assets/sprites/thorn_beetle_death/sheet-transparent.webp')
  expect(sources).toContain('/assets/sprites/seed_lantern_idle/sheet-transparent.webp')
})

it('keeps first-world enemy sprite assets in shared gameplay preload', () => {
  const sources = buildSharedGameplayPreloadPlan().map((asset) => asset.source)

  expect(sources).toContain('/assets/sprites/enemy_guard_walk/sheet-transparent.webp')
  expect(sources).toContain('/assets/sprites/enemy_guard_death/sheet-transparent.webp')
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm run test -- src/domain/assets/preloadManifest.test.ts
```

Expected: FAIL because stage preload does not collect enemy assets from the supplied stage map.

- [ ] **Step 3: Implement definition-backed preload collection**

In `src/domain/assets/preloadManifest.ts`, import `getEnemySpriteAssetRefs` and update preload source collection:

```ts
import {
  enemyActorDefinitions,
  getEnemySpriteAssetRefs,
  type EnemyActorType,
} from '../gameplay/enemyActor'
```

Replace hard-coded Armor Guard shared sources with:

```ts
...getEnemySpriteAssetRefs(Object.keys(enemyActorDefinitions) as EnemyActorType[]),
```

Add stage enemy source collection to `stageSources`:

```ts
const enemyTypes = stage.enemies.map((enemy) => enemy.type)

return [
  ...stage.backgroundLayers.map((layer) => layer.assetRef),
  stage.terrain.tilesetAssetRef,
  ...getEnemySpriteAssetRefs(enemyTypes),
  music,
  ...(stageData.isBoss
    ? Object.values(bossPriestessSpriteAssets).map((sprite) => sprite.assetRef)
    : []),
]
```

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
npm run test -- src/domain/assets/preloadManifest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/assets/preloadManifest.ts src/domain/assets/preloadManifest.test.ts
git commit -m "feat: preload enemy assets from definitions"
```

---

### Task 5: Migrate World 02 Small Enemy Stage Data

**Files:**
- Modify: `src/domain/gameplay/gameplayStageSources.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.test.ts`

- [ ] **Step 1: Write failing World 02 migration test**

Add this test to `src/domain/gameplay/gameplayStageMapConverter.test.ts`:

```ts
it('uses World 02 enemy identities in playable stages before the boss stage', () => {
  for (const stageId of ['2-1', '2-2', '2-3', '2-4', '2-5'] as const) {
    const enemyTypes = new Set(getGameplayStageMap(stageId).enemies.map((enemy) => enemy.type))

    expect(enemyTypes.has('thorn-beetle')).toBe(true)
    expect(enemyTypes.has('seed-lantern')).toBe(true)
    expect(enemyTypes.has('armor-guard')).toBe(false)
    expect(enemyTypes.has('azure-core')).toBe(false)
  }
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: FAIL because `2-1` through `2-5` still contain Armor Guard and Azure Core small enemies.

- [ ] **Step 3: Update World 02 stage source enemy types**

In `src/domain/gameplay/gameplayStageSources.ts`, for stage IDs `2-1` through `2-5` only:

- Add `"type": "thorn-beetle"` to grounded enemies that currently omit type.
- Change support enemies from `"type": "azure-core"` to `"type": "seed-lantern"`.
- Leave `2-6` unchanged, including `boss-prototype`.

Use a structured edit or careful targeted replacements around the `2-1` to `2-5` blocks. Do not edit `1-*`, `3-*`, `4-*`, `5-*`, or `6-*` blocks in this task.

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/assets/preloadManifest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/gameplay/gameplayStageSources.ts src/domain/gameplay/gameplayStageMapConverter.test.ts
git commit -m "feat: use world02 enemy identities"
```

---

### Task 6: Renderer Enemy Creation Through Capabilities

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer tests for capability-based creation**

Add tests to `src/ui/gameplay/createGameplayRenderer.test.ts` near existing enemy creation tests:

```ts
it('creates grounded patrol enemies from placement and behavior capabilities', () => {
  const runtime = createSceneRuntime({
    stage: {
      ...createEnemyFixtureStage(),
      enemies: [
        {
          id: 'beetle-a',
          type: 'thorn-beetle',
          x: 520,
          surfaceY: 640,
          patrolMinX: 420,
          patrolMaxX: 620,
        },
      ],
    },
  })
  runtime.scene.preload()
  runtime.scene.create()

  const beetle = runtime.enemySprites.find((sprite) => sprite.texture === 'thorn-beetle-walk')

  expect(beetle).toBeDefined()
  expect(beetle?.body.allowGravity).toBe(true)
  expect(beetle?.playCalls.at(-1)).toEqual({ key: 'thorn-beetle-walk', ignoreIfPlaying: undefined })
})

it('creates airborne Homing enemies from placement and behavior capabilities', () => {
  const runtime = createSceneRuntime({
    stage: {
      ...createEnemyFixtureStage(),
      enemies: [
        {
          id: 'lantern-a',
          type: 'seed-lantern',
          x: 900,
          y: 420,
          patrolMinX: 900,
          patrolMaxX: 900,
        },
      ],
    },
  })
  runtime.scene.preload()
  runtime.scene.create()

  const lantern = runtime.enemySprites.find((sprite) => sprite.texture === 'seed-lantern-idle')

  expect(lantern).toBeDefined()
  expect(lantern?.body.allowGravity).toBe(false)
  expect(runtime.tweenCalls.some((call) => call.targets === lantern)).toBe(true)
})
```

- [ ] **Step 2: Run the focused renderer tests and confirm they fail**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because renderer enemy creation still branches on `armor-guard` versus Azure Core assumptions.

- [ ] **Step 3: Implement capability-based creation**

In `src/ui/gameplay/createGameplayRenderer.ts`, replace the `createEnemies()` old-type branch with helper functions:

```ts
private createEnemies(): void {
  if (!this.terrainLayer) {
    throw new Error(`Unable to create enemy colliders before terrain for stage ${this.stageMap.id}.`)
  }

  this.enemies = this.stageMap.enemies.map((spawn) => this.createEnemy(spawn))
}
```

Implement `createEnemy(spawn)` to:

- read `const definition = enemyActorDefinitions[spawn.type]`.
- create sprite with the definition's default render texture.
- apply origin, scale, collide-world-bounds, depth, body size, body offset.
- enable terrain collider only when `definition.placement === 'grounded'`.
- disable gravity and set immovable for airborne enemies.
- play the walk/idle animation when a sprite animation exists.
- start floating when `definition.behavior === 'homing-target'` and the enemy is not `boss-prototype`.

Add this domain helper:

```ts
export function getEnemyDefaultSpriteDefinition(type: EnemyActorType): EnemySpriteDefinition | undefined {
  const sprites = enemyActorDefinitions[type].sprites
  return sprites?.walk ?? sprites?.idle
}
```

- [ ] **Step 4: Run the focused renderer tests and confirm they pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/gameplay/enemyActor.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: create enemies from capabilities"
```

---

### Task 7: Renderer Defeat, Regeneration, And Patrol Through Capabilities

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/domain/gameplay/enemyActor.ts`
- Modify: `src/domain/gameplay/enemyActor.test.ts`

- [ ] **Step 1: Write failing tests for capability-based defeat and regeneration**

Add renderer tests:

```ts
it('plays Thorn Beetle death presentation without treating it as Azure Core', () => {
  const runtime = createSceneRuntime({
    stage: {
      ...createEnemyFixtureStage(),
      enemies: [
        {
          id: 'beetle-a',
          type: 'thorn-beetle',
          x: 520,
          surfaceY: 640,
          patrolMinX: 420,
          patrolMaxX: 620,
        },
      ],
    },
  })
  runtime.scene.preload()
  runtime.scene.create()

  const beetle = runtime.enemySprites.find((sprite) => sprite.texture === 'thorn-beetle-walk')
  expect(beetle).toBeDefined()
  if (!beetle) return

  runtime.placePlayerNear(beetle.x, beetle.y)
  runtime.pressAttack()
  runtime.scene.update(16, 16)
  runtime.triggerEnemyOverlap(beetle)

  expect(beetle?.playCalls.at(-1)).toEqual({ key: 'thorn-beetle-death', ignoreIfPlaying: true })
})

it('regenerates Seed Lantern with its own texture and materialize presentation', () => {
  const runtime = createSceneRuntime({
    stage: {
      ...createEnemyFixtureStage(),
      enemies: [
        {
          id: 'lantern-a',
          type: 'seed-lantern',
          x: 900,
          y: 420,
          patrolMinX: 900,
          patrolMaxX: 900,
          respawnDelayMs: 1,
        },
      ],
    },
  })
  runtime.scene.preload()
  runtime.scene.create()

  const lantern = runtime.enemySprites.find((sprite) => sprite.texture === 'seed-lantern-idle')
  expect(lantern).toBeDefined()
  if (!lantern) return

  runtime.placePlayerNear(128, 512)
  runtime.pressAttack()
  runtime.scene.update(16, 16)
  runtime.triggerEnemyOverlap(lantern)
  runtime.runDelayedCalls(2)

  expect(lantern?.texture).toBe('seed-lantern-idle')
  expect(lantern?.visible).toBe(true)
  expect(lantern?.body.enable).toBe(false)
  expect(runtime.tweenCalls.some((call) => call.targets === lantern && call.scale === 1)).toBe(true)
})
```

- [ ] **Step 2: Run the focused renderer tests and confirm they fail**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because defeat/regeneration still routes by the two old type names.

- [ ] **Step 3: Implement presentation helpers and renderer routing**

In `src/domain/gameplay/enemyActor.ts`, add data needed for Seed Lantern materialize presentation:

```ts
seedLantern: {
  startScale: 0.35,
  endScale: 1,
  startAlpha: 0,
  endAlpha: 1,
  durationMs: 320,
  ease: 'Back.easeOut',
},
```

In `createGameplayRenderer.ts`:

- Replace death animation checks with `getEnemyDefeatPresentation(enemy.spawn.type)`.
- For sprite-death presentations, get `enemyActorDefinitions[type].sprites.death`.
- For burst presentations, use the existing burst tween but allow both Azure Core and Seed Lantern.
- In `resetEnemyRuntime`, restore the default sprite for the enemy's own type, not Azure Core as the fallback.
- Use `getEnemyRegenerationPresentation(enemy.spawn.type)` and definition-backed materialize settings for airborne support enemies.
- Use `shouldUpdateEnemyPatrol` everywhere patrol updates are currently type-checked.

- [ ] **Step 4: Run focused domain and renderer tests**

Run:

```bash
npm run test -- src/domain/gameplay/enemyActor.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/gameplay/enemyActor.ts src/domain/gameplay/enemyActor.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: route enemy presentation by capability"
```

---

### Task 8: Generate And Integrate World 02 Enemy Sprite Assets

**Files:**
- Create: `public/assets/sprites/thorn_beetle_walk/sheet-transparent.webp`
- Create: `public/assets/sprites/thorn_beetle_death/sheet-transparent.webp`
- Create: `public/assets/sprites/seed_lantern_idle/sheet-transparent.webp`
- Create: `public/assets/sprites/thorn_beetle_walk/pipeline-meta.json`
- Create: `public/assets/sprites/thorn_beetle_death/pipeline-meta.json`
- Create: `public/assets/sprites/seed_lantern_idle/pipeline-meta.json`

- [ ] **Step 1: Use the sprite generation workflow**

Use the `generate2dsprite` skill before generating assets. Generate:

- Thorn Beetle walk: 4 frames, 128x128 frame size, transparent background, side-view readable silhouette, bramble shell and small legs.
- Thorn Beetle death: 4 frames, 128x128 frame size, transparent background, shell collapsing into leaves/thorns.
- Seed Lantern idle: 4 frames, 128x128 frame size, transparent background, glowing seed lantern with leaf casing.

- [ ] **Step 2: Verify generated asset dimensions**

Run:

```bash
file public/assets/sprites/thorn_beetle_walk/sheet-transparent.webp
file public/assets/sprites/thorn_beetle_death/sheet-transparent.webp
file public/assets/sprites/seed_lantern_idle/sheet-transparent.webp
```

Expected: each file exists and is a WebP image. If local tooling can report dimensions, verify each sheet is `512x128`.

- [ ] **Step 3: Run preload and renderer tests**

Run:

```bash
npm run test -- src/domain/assets/preloadManifest.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add public/assets/sprites/thorn_beetle_walk public/assets/sprites/thorn_beetle_death public/assets/sprites/seed_lantern_idle
git commit -m "feat: add world02 enemy sprites"
```

---

### Task 9: Full Verification

**Files:**
- No planned code edits unless verification finds an issue.

- [ ] **Step 1: Run domain/application tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run whitespace/path sanity check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Commit any verification fixes**

If verification required fixes, commit only those fixes:

```bash
git add <fixed-files>
git commit -m "fix: stabilize world02 enemy capabilities"
```

If no fixes were required, do not create an empty commit.
