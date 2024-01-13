import * as ex from 'excalibur'
import Level1 from './scenes/level1'
import { loader } from './resources'
import Demo from './scenes/demo'
import { TiledResources } from './resources.tiled'

ex.Physics.useArcadePhysics()
ex.Physics.acc = new ex.Vector(0, 1450)

const game = new ex.Engine({
  resolution: {
    height: ex.Resolution.SNES.height,
    // make 16:9
    width: (ex.Resolution.SNES.height / 9) * 16,
  },
  displayMode: ex.DisplayMode.FitScreen,
  fixedUpdateFps: 60,
  // maxFps: 60,
  antialiasing: false,
})

// setup scenes
game.addScene('level1', new Level1())
game.addScene('demo', new Demo())

// temporary
Object.values(TiledResources).forEach((resource) => {
  loader.addResource(resource)
})

// start game
game.start(loader).then(() => {
  game.goToScene('level1')
})
