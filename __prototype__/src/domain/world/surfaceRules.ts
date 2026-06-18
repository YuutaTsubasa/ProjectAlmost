export type SurfaceZoneLike<TSurfaceType extends string = string> = {
  type: TSurfaceType
  x: number
  y: number
  width: number
  height: number
}

export function findActiveSurfaceZone<
  TSurfaceType extends string,
  TZone extends SurfaceZoneLike<TSurfaceType>,
>(input: {
  pointX: number
  pointY: number
  surfaceType: TSurfaceType
  zones: readonly TZone[]
}): TZone | undefined {
  return input.zones.find((zone) =>
    zone.type === input.surfaceType
    && input.pointX >= zone.x
    && input.pointX <= zone.x + zone.width
    && input.pointY >= zone.y
    && input.pointY <= zone.y + zone.height,
  )
}
