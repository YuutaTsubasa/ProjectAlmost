import * as Phaser from 'phaser'
import { PrototypeScene } from './scenes/PrototypeScene'

export function createPlatformerGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1920,
    height: 1080,
    backgroundColor: '#101820',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1500 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PrototypeScene],
  })
}
