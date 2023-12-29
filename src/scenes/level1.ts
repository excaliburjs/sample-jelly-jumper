import * as ex from 'excalibur'
import Player from '../actors/player'
import { MovingPlatform } from '../actors/moving-platform'

export default class Level1 extends ex.Scene {
  onInitialize() {
    const player = new Player(320, 32)
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
            name: `checkerboard-${x}-${y}`,
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

    // const ground = new ex.Actor({
    //   x: -100,
    //   y: 100,
    //   width: 800,
    //   height: 100,
    //   anchor: ex.vec(0.5, 0.5),
    //   color: ex.Color.Green,
    //   collisionType: ex.CollisionType.Fixed,
    // })
    // this.add(ground)

    const trianglePoints = [ex.vec(-128, 16), ex.vec(0, -16), ex.vec(128, 16)]
    const triangle = new ex.Actor({
      name: 'triangle',
      x: 100,
      y: 69,
      collider: new ex.PolygonCollider({ points: trianglePoints }),
      collisionType: ex.CollisionType.Fixed,
    })
    const triangleGraphic = new ex.Polygon({
      points: trianglePoints,
      color: ex.Color.Green,
      filtering: ex.ImageFiltering.Pixel,
      smoothing: false,
      quality: 4,
    })
    triangle.graphics.use(triangleGraphic)
    this.add(triangle)

    const leftwall = new ex.Actor({
      name: 'leftwall',
      x: -100,
      y: 100,
      width: 100,
      height: 800,
      anchor: ex.vec(0.5, 0.5),
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
    })
    this.add(leftwall)

    const platform = new MovingPlatform(
      {
        x: 300,
        y: 75,
        width: 100,
        height: 16,
      },
      (actions) =>
        actions.repeatForever((builder) =>
          builder.moveBy(100, -50, 50).moveBy(-100, 50, 50)
        )
    )
    this.add(platform)

    this.camera.strategy.lockToActor(player)
  }
}
