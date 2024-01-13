import * as ex from 'excalibur'

export const Resources = {
  img: {
    player: new ex.ImageSource('/res/images/Player.png'),
    level1Background: new ex.ImageSource('/res/images/Forest_Background_0.png'),
    spiderGreen: new ex.ImageSource('/res/images/Spider_1.png'),
    spiderGray: new ex.ImageSource('/res/images/Spider_2.png'),
    platform: new ex.ImageSource('/res/images/Platform.png'),
  },

  music: {
    stage1: new ex.Sound('/res/music/stage1.ogg'),
    stage2: new ex.Sound('/res/music/stage2.ogg'),
  },
  sfx: {
    playerJump: new ex.Sound('/res/sfx/player-jump.wav'),
    playerLand: new ex.Sound('/res/sfx/player-land.wav'),
    footstep: new ex.Sound('/res/sfx/footstep.wav'),
    turnAround: new ex.Sound('/res/sfx/turn-around.wav'),
    squish: new ex.Sound('/res/sfx/squish.wav'),
  },
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

for (const group of Object.values(Resources)) {
  for (const resource of Object.values(group)) {
    loader.addResource(resource)
  }
}
