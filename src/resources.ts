import * as ex from 'excalibur'

export const Resources = {
  img_player: new ex.ImageSource(require('../res/Player.png')),
} as const


// instantly starts game once loading has completed
class DevLoader extends ex.Loader {  
  showPlayButton() {
    return Promise.resolve();
  }

  draw() {}
}

export const loader = process.env.NODE_ENV === 'development' ? new DevLoader() : new ex.Loader()

for (const resource of Object.values(Resources)) {
  loader.addResource(resource)
}

