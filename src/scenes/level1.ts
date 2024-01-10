import * as ex from 'excalibur'
import { Resources } from '../resources'
import BaseLevelScene from '../classes/base-level-scene'
import { TiledResources } from '../resources.tiled'
import { MovingPlatform } from '../actors/moving-platform'

export default class Level1 extends BaseLevelScene {
  constructor() {
    super({
      tilemap: TiledResources.tilemap_level1,
      background: Resources.img_level1_bg,
    })

    // add 16x16 physics squar
    const square = new ex.Actor({
      x: 80,
      y: 100,
      width: 16,
      height: 16,
      color: ex.Color.Red,
      collisionType: ex.CollisionType.Active,
    })
    // this.add(square)

    const platform = new MovingPlatform(
      {
        x: 100,
        y: 150,
        width: 100,
        height: 16,
      },
      (actions) =>
        actions.repeatForever(
          (builder) => builder.moveBy(0, -50, 30).moveBy(0, 50, 30)
          // .easeBy(-50, 50, 500, ex.EasingFunctions.EaseOutQuad)
          // .delay(500)
          // .easeBy(50, -50, 500, ex.EasingFunctions.EaseOutQuad)
          // .delay(500)
          // .moveBy(200, -50, 500)
        )
    )
    200
    this.add(platform)
  }
}
