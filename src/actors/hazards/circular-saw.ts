import * as ex from 'excalibur'
import { Resources } from '../../resources'
import { EnemyActor } from '../../classes/enemy-actor'
import { GRAVITY } from '../../util/world'
import { HurtPlayerComponent } from '../../components/behaviours/hurt-player'

export class CircularSawEnemy extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      anchor: ex.vec(0.5, 0.5),
      radius: 14,
      rotation: 0,
      collisionType: ex.CollisionType.Passive,
    })

    this.body.useGravity = false
    this.graphics.use(Resources.img.circularSaw.toSprite())
    this.addComponent(new HurtPlayerComponent({ amount: Infinity }))
  }

  onPreUpdate(_engine: ex.Engine, delta: number) {
    this.rotation += delta / 250
  }
}
