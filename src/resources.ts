import * as ex from 'excalibur'

export const Resources = {
  img_player: new ex.ImageSource('/res/images/Player.png'),
  img_level1_bg: new ex.ImageSource('/res/images/Forest_Background_0.png'),
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
