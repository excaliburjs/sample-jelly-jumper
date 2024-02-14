import * as ex from 'excalibur'
import { ClimbableComponent } from '../../components/behaviours/climbable'

export class LadderTile extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      anchor: ex.vec(0, 0),
      collisionType: ex.CollisionType.Passive,
      ...args,
    })

    this.addComponent(new ClimbableComponent())
  }
}
