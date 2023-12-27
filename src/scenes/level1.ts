import * as ex from 'excalibur'
import Player from '../actors/player'

export default class Level1 extends ex.Scene {
  onInitialize() {
    const player = new Player(32, 32)
    this.add(player)

    const checkerboardSize = 32
    const checkerboardWidth = 100 * checkerboardSize
    const checkerboardHeight = 8 * checkerboardSize

    // create a 16x16 checkerboard alternating between green and dark green squares
    for (let x = 0; x < checkerboardWidth / checkerboardSize; x++) {
      for (let y = 0; y < checkerboardHeight / checkerboardSize; y++) {
        const isDarkGreen = (x + y) % 2 === 0
        this.add(
          new ex.Actor({
            x: -100 + x * checkerboardSize,
            y: 100 + y * checkerboardSize,
            width: checkerboardSize,
            height: checkerboardSize,
            anchor: ex.vec(0.5, 0.5),
            color: isDarkGreen ? ex.Color.fromRGB(0, 100, 0) : ex.Color.Green,
            collisionType: ex.CollisionType.Fixed,
          })
        )
      }
    }

    this.camera.strategy.lockToActor(player)
  }
}
