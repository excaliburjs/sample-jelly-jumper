import * as ex from 'excalibur'
import { OneWayCollisionComponent } from '../../components/physics/one-way-collision'

export class OneWayPlatform extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Fixed,
      anchor: ex.vec(0, 0),
      height: 16,
    })

    this.addComponent(new OneWayCollisionComponent())
  }
}
