import * as ex from 'excalibur'
import Level1 from './scenes/level1'
import { loader } from './resources'

ex.Physics.useArcadePhysics()
ex.Physics.acc = new ex.Vector(0, 800)

const game = new ex.Engine({
  resolution: ex.Resolution.SNES,
  displayMode: ex.DisplayMode.FitScreen,
  antialiasing: false,
})

game.addScene('level1', new Level1())

game.start(loader).then(() => {
  game.goToScene('level1')
})
