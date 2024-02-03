import * as ex from 'excalibur'
import { loader } from './resources'
import Level1 from './scenes/level1'
import Demo from './scenes/demo'

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
  scenes: {
    root: {
      scene: Level1,
      transitions: {
        out: new ex.FadeInOut({
          duration: 300,
          direction: 'out',
        }),
        in: new ex.FadeInOut({ duration: 300, direction: 'in' }),
      },
    },
    demo: Demo,
  },
})

// start game
game.start(loader)
