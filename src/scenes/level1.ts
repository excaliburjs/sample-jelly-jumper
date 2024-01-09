import * as ex from 'excalibur'
import { Resources } from '../resources'
import BaseLevelScene from '../classes/base-level-scene'
import { TiledResources } from '../resources.tiled'

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
    this.add(square)
  }
}
