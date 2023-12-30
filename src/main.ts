import * as ex from 'excalibur'
import Level1 from './scenes/level1'
import { loader } from './resources'
import Demo from './scenes/demo'

ex.Physics.useArcadePhysics()
ex.Physics.acc = new ex.Vector(0, 800)

const game = new ex.Engine({
  resolution: ex.Resolution.SNES,
  displayMode: ex.DisplayMode.FitScreen,
  fixedUpdateFps: 120,
  maxFps: 60,
  antialiasing: false,
})

game.addScene('level1', new Level1())
game.addScene('demo', new Demo())

game.start(loader).then(() => {
  game.goToScene('level1')
})
