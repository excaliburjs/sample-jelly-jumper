import * as ex from 'excalibur'
import { OneWayCollisionComponent } from '../components/physics/one-way-collision'
import { CarrierComponent } from '../components/physics/carrier'

export interface MovingPlatformArgs extends ex.ActorArgs {
  oneWay?: boolean
}

export class MovingPlatform extends ex.Actor {
  constructor(
    args: MovingPlatformArgs,
    cb: (actions: ex.ActionsComponent) => any
  ) {
    super({
      color: ex.Color.Green,
      collisionType: ex.CollisionType.Fixed,
      ...args,
    })

    cb(this.actions)

    this.addComponent(new CarrierComponent())

    if (!args.oneWay) {
      this.addComponent(new OneWayCollisionComponent())
    }
  }
}
