export const VIRTUAL_WIDTH = 1920
export const VIRTUAL_HEIGHT = 1080

export type ContainerSize = {
  containerWidth: number
  containerHeight: number
}

export type AspectFitFrame = {
  width: number
  height: number
  offsetX: number
  offsetY: number
  scale: number
}

export function calculateAspectFitFrame({
  containerWidth,
  containerHeight,
}: ContainerSize): AspectFitFrame {
  const scale = Math.min(containerWidth / VIRTUAL_WIDTH, containerHeight / VIRTUAL_HEIGHT)
  const width = VIRTUAL_WIDTH * scale
  const height = VIRTUAL_HEIGHT * scale

  return {
    width,
    height,
    offsetX: (containerWidth - width) / 2,
    offsetY: (containerHeight - height) / 2,
    scale,
  }
}
