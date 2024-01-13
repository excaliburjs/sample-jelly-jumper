import * as ex from 'excalibur'
import { Resources } from '../resources'

import { TiledResources } from '../resources.tiled'
import { MovingPlatform } from '../actors/platforms/moving-platform'
import LevelScene from '../classes/level-scene'

export default class Level1 extends LevelScene {
  constructor() {
    super({
      tilemap: TiledResources.tiled.level1,
      background: Resources.img.level1Background,
      song: Resources.music.stage1,
    })
  }
}
