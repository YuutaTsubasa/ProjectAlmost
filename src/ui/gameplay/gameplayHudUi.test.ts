import { describe, expect, it } from 'vitest'
import hudSource from './GameplayHud.svelte?raw'
import screenSource from './GameplayScreen.svelte?raw'

describe('Gameplay HUD Svelte UI', () => {
  it('renders gameplay HUD panels and mini-map marker loops', () => {
    expect(hudSource).toContain('class="gameplay-hud"')
    expect(hudSource).toContain('class="hud-status-panel"')
    expect(hudSource).toContain('class="hud-map-panel"')
    expect(hudSource).toContain('class="hud-readouts"')
    expect(hudSource).toContain('{#each state.mapPlatforms as platform}')
    expect(hudSource).toContain('{#each state.checkpointMarkers as checkpoint, index}')
    expect(hudSource).toContain('{#each state.enemyMarkers as enemy}')
    expect(hudSource).toContain('state.goalProgress')
    expect(hudSource).toContain('state.playerProgress')
    expect(hudSource).toContain('pointer-events: none')
  })

  it('renders required HUD readouts and three-HP state', () => {
    expect(hudSource).toContain('HP')
    expect(hudSource).toContain('{state.hp} / {state.hpMax}')
    expect(hudSource).toContain('COINS')
    expect(hudSource).toContain('DAMAGE')
    expect(hudSource).toContain('FALLS')
    expect(hudSource).toContain('ENEMIES')
    expect(hudSource).toContain('CHECKPOINTS')
    expect(hudSource).toContain('TIME')
  })

  it('reflows the top HUD banner below side panels on narrower viewports', () => {
    expect(hudSource).toContain('@media (max-width: 900px)')
    expect(hudSource).toContain('top: 152px;')
    expect(hudSource).toContain('right: 16px;')
    expect(hudSource).toContain('left: 16px;')
    expect(hudSource).toContain('width: auto;')
  })

  it('wires GameplayScreen state and stage display data to the HUD', () => {
    expect(screenSource).toContain("import GameplayHud from './GameplayHud.svelte'")
    expect(screenSource).toContain('getGameplayHudStageDisplay')
    expect(screenSource).toContain('const stageDisplay = $derived')
    expect(screenSource).toContain('createInitialGameplayHudState')
    expect(screenSource).toContain('applyGameplayHudPatch')
    expect(screenSource).toContain('onHudUpdate')
    expect(screenSource).toContain('<GameplayHud')
    expect(screenSource).toContain('stageDisplay={stageDisplay}')
    expect(screenSource).not.toContain(': any = GameplayHud')
  })
})
