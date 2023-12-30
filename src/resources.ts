import { TiledMapResource } from '@excaliburjs/plugin-tiled'
import * as ex from 'excalibur'

export const Resources = {
  img_player: new ex.ImageSource('/res/images/Player.png'),
  tilemap_level1: new TiledMapResource('/res/tilemaps/level1.tmx', {}),
} as const

// instantly starts game once loading has completed
class DevLoader extends ex.Loader {
  showPlayButton() {
    return Promise.resolve()
  }

  draw() {}
}

export const loader =
  process.env.NODE_ENV === 'development' ? new DevLoader() : new ex.Loader()

for (const resource of Object.values(Resources)) {
  loader.addResource(resource)
}
