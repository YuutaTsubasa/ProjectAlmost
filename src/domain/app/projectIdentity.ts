export const PRODUCT_NAME = 'Project Almost'

export const STORAGE_NAMESPACE = 'project-almost'

export function storageKey(name: string): string {
  return `${STORAGE_NAMESPACE}:${name}`
}
