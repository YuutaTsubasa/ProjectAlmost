export type ProjectIdentity = {
  productName: 'Project Almost'
  shell: 'tauri-v2'
  ui: 'svelte'
  domainCore: 'functional'
  stateModel: 'reactive'
}

export function createProjectIdentity(): ProjectIdentity {
  return {
    productName: 'Project Almost',
    shell: 'tauri-v2',
    ui: 'svelte',
    domainCore: 'functional',
    stateModel: 'reactive',
  }
}
