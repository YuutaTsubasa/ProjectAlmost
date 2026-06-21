import type { PlatformRect } from './gameplayMapTypes'

export type PlatformBoundsValidation =
  | { valid: true }
  | { valid: false; reason: string }

export function getTileColumnCount(input: { worldWidth: number; tileSize: number }): number {
  return input.worldWidth / input.tileSize
}

export function getTileRowCount(input: { worldHeight: number; tileSize: number }): number {
  return Math.ceil(input.worldHeight / input.tileSize)
}

export function getPlatformTileIndex(input: { index: number; width: number }): number {
  if (input.width === 1) return 1
  if (input.index === 0) return 0
  if (input.index === input.width - 1) return 2
  return 1
}

export function validatePlatformBounds(input: {
  columns: number
  rows: number
  platforms: readonly PlatformRect[]
}): PlatformBoundsValidation {
  for (let index = 0; index < input.platforms.length; index += 1) {
    const platform = input.platforms[index]
    if (platform.width <= 0 || platform.height <= 0) {
      return {
        valid: false,
        reason: `Platform at index ${index} must have positive width and height.`,
      }
    }
    if (platform.col < 0 || platform.col + platform.width > input.columns) {
      return { valid: false, reason: `Platform at index ${index} exceeds terrain columns.` }
    }
    if (platform.row < 0 || platform.row + platform.height > input.rows) {
      return { valid: false, reason: `Platform at index ${index} exceeds terrain rows.` }
    }
  }

  return { valid: true }
}

export function buildTerrainTileGrid(input: {
  columns: number
  rows: number
  platforms: readonly PlatformRect[]
}): number[][] {
  const grid = Array.from({ length: input.rows }, () => Array.from({ length: input.columns }, () => -1))

  for (const platform of input.platforms) {
    for (let y = 0; y < platform.height; y += 1) {
      for (let x = 0; x < platform.width; x += 1) {
        grid[platform.row + y][platform.col + x] = getPlatformTileIndex({
          index: x,
          width: platform.width,
        })
      }
    }
  }

  return grid
}
