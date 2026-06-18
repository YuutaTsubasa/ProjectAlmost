import highSpireJson from './1-6-boss-arena.json'
import type { BossArenaPlan } from './bossArenaTypes'

const highSpire = highSpireJson as BossArenaPlan

export const bossArenaPlans = {
  '1-6': highSpire,
} as const satisfies Record<string, BossArenaPlan>

export type BossArenaId = keyof typeof bossArenaPlans

export function validateBossArena(plan: BossArenaPlan): void {
  const { width, height, tileSize } = plan.world
  const bounds = plan.arenaBounds

  if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > width || bounds.y + bounds.height > height) {
    throw new Error(`Boss arena ${plan.id}: arena bounds exceed the world.`)
  }

  for (const platform of plan.platforms) {
    const right = (platform.col + platform.width) * tileSize
    const bottom = (platform.row + platform.height) * tileSize
    if (platform.col < 0 || platform.row < 0 || right > width || bottom > height) {
      throw new Error(`Boss arena ${plan.id}: platform at (${platform.col}, ${platform.row}) exceeds the world.`)
    }
  }

  const exitSupported = plan.platforms.some((platform) => {
    const left = platform.col * tileSize
    const right = left + platform.width * tileSize
    return plan.exitGoal.x >= left && plan.exitGoal.x < right && plan.exitGoal.surfaceY === platform.row * tileSize
  })

  if (!exitSupported) {
    throw new Error(`Boss arena ${plan.id}: exit goal does not align with a platform surface.`)
  }

  const coreIds = new Set(plan.homingCores.map((core) => core.id))
  for (const phase of plan.phases) {
    for (const coreId of phase.activeCoreIds) {
      if (!coreIds.has(coreId)) {
        throw new Error(`Boss arena ${plan.id}: phase "${phase.id}" references unknown core "${coreId}".`)
      }
    }
  }
}

for (const plan of Object.values(bossArenaPlans)) validateBossArena(plan)
