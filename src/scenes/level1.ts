import { Resources } from '../resources'
import BaseLevelScene from '../classes/base-level-scene'
import { TiledResources } from '../resources.tiled'

export default class Level1 extends BaseLevelScene {
  constructor() {
    super({
      tilemap: TiledResources.tilemap_level1,
      background: Resources.img_level1_bg,
    })
  }
}
