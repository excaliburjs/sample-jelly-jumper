import * as ex from 'excalibur'

export const Resources = {
  img_player: new ex.ImageSource('/res/images/Player.png'),
  img_level1_bg: new ex.ImageSource('/res/images/Forest_Background_0.png'),
  img_spider_green: new ex.ImageSource('/res/images/Spider_1.png'),
  img_spider_gray: new ex.ImageSource('/res/images/Spider_2.png'),
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
