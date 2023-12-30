import { Resources } from '../resources'
import BaseLevelScene from '../classes/base-level-scene'

export default class Level1 extends BaseLevelScene {
  constructor() {
    super({
      tilemap: Resources.tilemap_level1,
      background: Resources.img_level1_bg,
    })
  }
}
