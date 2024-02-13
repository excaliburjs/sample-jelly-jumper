import * as ex from 'excalibur'
import { DamageComponent } from '../../components/behaviours/damage'
import { CollisionGroup } from '../../util/collision-group'

export class SpikeTile extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      name: 'spike',
      anchor: ex.vec(0, 0),
      width: 16,
      height: 16,
      collisionType: ex.CollisionType.Fixed,
      collisionGroup: CollisionGroup.Hazard,
    })

    this.addComponent(
      new DamageComponent({ amount: Infinity, cancelContactOnDamage: false })
    )
  }
}
