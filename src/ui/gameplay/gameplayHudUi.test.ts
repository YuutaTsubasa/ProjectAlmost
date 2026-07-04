import { describe, expect, it } from 'vitest'
import hudSource from './GameplayHud.svelte?raw'
import screenSource from './GameplayScreen.svelte?raw'

describe('Gameplay HUD Svelte UI', () => {
  it('renders prototype-equivalent HUD regions and panel shell details', () => {
    expect(hudSource).toContain('class="gameplay-hud"')
    expect(hudSource).toContain('class="hud-panel status-hud"')
    expect(hudSource).toContain('class="stage-banner"')
    expect(hudSource).toContain('class="hud-panel map-hud"')
    expect(hudSource).toContain('class="hud-panel objective-hud"')
    expect(hudSource).toContain('class="bottom-hud"')
    expect(hudSource).toContain('class="corner tl"')
    expect(hudSource).toContain('class="corner tr"')
    expect(hudSource).toContain('class="corner bl"')
    expect(hudSource).toContain('class="corner br"')
    expect(hudSource).toContain('pointer-events: none')
  })

  it('renders status panel with portrait, system label, player name, and HP state', () => {
    expect(hudSource).toContain('System Status')
    expect(hudSource).toContain('GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC')
    expect(hudSource).toContain('class="portrait-slot"')
    expect(hudSource).toContain('Yuuta Tsubasa')
    expect(hudSource).toContain('{state.hp} / {state.hpMax}')
    expect(hudSource).toContain('class="bar"')
  })

  it('renders stage banner with world label, stage id, and subtitle', () => {
    expect(hudSource).toContain('stageDisplay.worldLabel')
    expect(hudSource).toContain('stageDisplay.stageId')
    expect(hudSource).toContain('stageDisplay.stageSubtitle')
    expect(hudSource).toContain('class="banner-fill"')
    expect(hudSource).toContain('class="emblem"')
  })

  it('keeps the gameplay banner geometry isolated from stage-select banner styles', () => {
    expect(hudSource).toContain('animation: none')
    expect(hudSource).toContain('width: 28.1cqw')
    expect(hudSource).toContain('transform: translateX(-50%)')
  })

  it('sizes HUD proportions against the resolution frame instead of the viewport', () => {
    const styleSource = hudSource.slice(hudSource.indexOf('<style>'))

    expect(styleSource).toContain('cqw')
    expect(styleSource).toContain('cqh')
    expect(styleSource).not.toContain('@container')
    expect(styleSource).not.toContain('@media')
    expect(styleSource).not.toMatch(/\b\d*\.?\d+vw\b/)
    expect(styleSource).not.toMatch(/\b\d*\.?\d+vh\b/)
    expect(styleSource).not.toMatch(/\b(?:min|max|clamp|minmax)\([^)]*px[^)]*(?:cqw|cqh)/)
    expect(styleSource).not.toMatch(/\b(?:min|max|clamp|minmax)\([^)]*(?:cqw|cqh)[^)]*px/)
  })

  it('renders map overview marker loops with prototype labels', () => {
    expect(hudSource).toContain('Map Overview')
    expect(hudSource).toContain('class="mini-map"')
    expect(hudSource).toContain('{#each state.mapPlatforms as platform}')
    expect(hudSource).toContain('{#each state.checkpointMarkers as checkpoint, index}')
    expect(hudSource).toContain('{#each state.enemyMarkers as enemy}')
    expect(hudSource).toContain('state.goalProgress')
    expect(hudSource).toContain('state.playerProgress')
  })

  it('renders objective, controls, readouts, and rank fields', () => {
    expect(hudSource).toContain('Objective')
    expect(hudSource).toContain('Reach the goal')
    expect(hudSource).toContain('Controls')
    expect(hudSource).toContain('Move')
    expect(hudSource).toContain('Jump')
    expect(hudSource).toContain('Crouch')
    expect(hudSource).toContain('Attack')
    expect(hudSource).toContain('Homing')
    expect(hudSource).toContain('Time')
    expect(hudSource).toContain('Coins')
    expect(hudSource).toContain('Damage')
    expect(hudSource).toContain('Falls')
    expect(hudSource).toContain('Enemies')
    expect(hudSource).toContain('Checkpoints')
    expect(hudSource).toContain('Rank')
    expect(hudSource).toContain('state.rank')
  })

  it('wires GameplayScreen stage display data to the HUD', () => {
    expect(screenSource).toContain("import GameplayHud from './GameplayHud.svelte'")
    expect(screenSource).toContain('getGameplayHudStageDisplay')
    expect(screenSource).toContain('const stageDisplay = $derived')
    expect(screenSource).toContain('createInitialGameplayHudState')
    expect(screenSource).toContain('applyGameplayHudPatch')
    expect(screenSource).toContain('onHudUpdate')
    expect(screenSource).toContain('stageDisplay={stageDisplay}')
  })
})
