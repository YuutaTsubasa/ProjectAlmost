export type AppScreen = { type: 'title' }

export type AppState = {
  screen: AppScreen
}

export function createInitialAppState(): AppState {
  return {
    screen: { type: 'title' },
  }
}
